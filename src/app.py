import os
import logging
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks, HTTPException, Query, Depends, Header, status
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from project root .env.local (if present)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

from monitor_service import MonitorService
from scheduler_service import SchedulerService
from db_manager import ArchiveDB
from analysis_db import AnalysisDB
from search import keyword_search
from board_stats import get_board_stats
from jose import jwt, JWTError
import razorpay
from users_db import UserDB

NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "supersecretkey") # Should match Next.js secret
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "admin-secret")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "admin-secret")
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rootsearch_api")

# Conditionally enable docs
docs_url = "/docs" if ENVIRONMENT == "development" else None
redoc_url = "/redoc" if ENVIRONMENT == "development" else None

app = FastAPI(title="RootSearch API", docs_url=docs_url, redoc_url=redoc_url)

app.add_middleware(
    CORSMiddleware, 
    allow_origins=ALLOWED_ORIGINS, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Services
monitor = MonitorService(interval=int(os.getenv("MONITOR_INTERVAL", "300")))
scheduler = SchedulerService()

admin_header_scheme = APIKeyHeader(name="X-Admin-Key", auto_error=False)

async def verify_admin_key(key: str = Depends(admin_header_scheme)):
    if key != ADMIN_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Invalid or missing Admin API Key"
        )
    return key


@app.on_event("startup")
def startup():
    logger.info("Starting services on startup: monitor and scheduler")
    monitor.start()
    scheduler.start()


@app.on_event("shutdown")
def shutdown():
    logger.info("Shutting down services")
    monitor.stop()
    scheduler.shutdown()


@app.get("/health")
def health():
    return {
        "monitor_running": monitor.running(),
        "scheduler_running": scheduler._scheduler.running,
        "environment": ENVIRONMENT
    }

def verify_jwt(authorization: str = Header(None)):
    """Verifies the JWT token and returns the user's plan."""
    if not authorization:
        # For prototype simplicity: If no header, assume unauthorized or free?
        # Requirement said: "Strictly use JWT". So 401.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
    
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, NEXTAUTH_SECRET, algorithms=["HS256"])
        return payload # Should contain 'plan_type'
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except IndexError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid header format")


class MonitorStartRequest(BaseModel):
    interval: Optional[int] = None
    boards: Optional[List[str]] = None


@app.post("/admin/monitor/start", dependencies=[Depends(verify_admin_key)])
def admin_monitor_start(payload: MonitorStartRequest):
    if payload.interval:
        monitor.interval = payload.interval
    # Allow empty list to mean "no specific boards"
    if payload.boards is not None:
        monitor.boards = payload.boards
    monitor.start()
    return {"status": "started", "interval": monitor.interval, "boards": (monitor.boards or "all")}


@app.post("/admin/monitor/stop", dependencies=[Depends(verify_admin_key)])
def admin_monitor_stop():
    monitor.stop()
    return {"status": "stopped"}


@app.post("/admin/run-analysis", dependencies=[Depends(verify_admin_key)])
def trigger_analysis(background_tasks: BackgroundTasks):
    # Run analysis in background (non-blocking)
    background_tasks.add_task(scheduler.run_analysis_once)
    return {"status": "enqueued"}


@app.get("/boards")
def list_boards():
    db = ArchiveDB()
    return {"boards": db.get_all_stored_boards()}


from pathlib import Path
import json


@app.get("/boards/{board}/stats")
def board_stats(board: str):
    """Return cached board stats from Database."""
    try:
        adb = AnalysisDB()
        all_stats = adb.get_all_cached_stats()
        if board in all_stats:
            return all_stats[board]
    except Exception as e:
        logger.error(f"Error fetching cached stats from DB: {e}")

    # Fallback: perform live fetch
    stats = get_board_stats(board, quiet=True)
    if stats is None:
        raise HTTPException(status_code=404, detail="Board stats not found")
    return stats


@app.get("/boards/stats")
def all_boards_stats():
    """Return the cached stats for all boards from Database."""
    try:
        adb = AnalysisDB()
        return adb.get_all_cached_stats()
    except Exception as e:
        logger.error(f"Failed to read cached board stats from DB: {e}")
        raise HTTPException(status_code=500, detail="Failed to read cached board stats")


@app.get("/stats/global")
def global_stats():
    """Return live global stats from the archive."""
    try:
        db = ArchiveDB()
        return db.get_global_stats()
    except Exception as e:
        logger.error(f"Error fetching global stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
def search(q: str, limit: int = 50):
    return keyword_search(q, limit=limit)



@app.get("/opportunities")
def opportunities(
    board: Optional[str] = Query(None, description="Board code(s) to filter by"),
    limit: int = 5,
    score_min: Optional[int] = Query(None, description="Minimum market score"),
    complexity: Optional[str] = Query(None, description="Complexity filter (Low, Medium, High)"),
    size: Optional[str] = Query(None, description="Market size filter"),
    intent: Optional[str] = Query(None, description="Intent category filter"),
    flair: Optional[str] = Query(None, description="Flair type filter"),
    user: dict = Depends(verify_jwt)
):
    """Return latest AI-generated opportunities with granular filtering."""
    
    # Enforce Free Tier Limits
    if user.get("plan_type") != "pro":
        limit = 3 # Hard limit
        # Disable advanced filters
        intent = None
        complexity = None
        size = None
        flair = None
    try:
        adb = AnalysisDB()
        result = adb.get_latest_analysis(
            boards=board,
            score_min=score_min,
            complexity=complexity,
            market_size=size,
            intent_category=intent,
            flair_type=flair
        )
        return result[:limit] if limit > 0 else result
    except Exception as e:
        logger.error(f"Error fetching opportunities: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/advanced-search")
def advanced_search(
    q: Optional[str] = Query(None),
    mode: str = Query("analyzed", pattern="^(live|analyzed)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    # Filters
    boards: Optional[str] = None,
    score_min: Optional[int] = None,
    complexity: Optional[str] = None,
    size: Optional[str] = None,
    intent: Optional[str] = None,
    flair: Optional[str] = None,
    category: Optional[str] = None,
    # Sorting
    sort_by: str = Query("date", pattern="^(date|score)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    user: dict = Depends(verify_jwt)
):
    offset = (page - 1) * limit
    
    # Enforce Free Tier Limits
    if user.get("plan_type") != "pro":
        limit = 3
        # Disable advanced filters
        intent = None
        complexity = None
        size = None
        flair = None
        category = None
        # Score_min is allowed for everyone or PRO only? Plan said "Advanced Filters: Intent, Industry, Complexity".
        # Let's leave score_min available for free for now to confirm "valid signals".
    
    if mode == "analyzed":
        adb = AnalysisDB()
        results, total = adb.search_opportunities(
            query=q,
            boards=boards,
            score_min=score_min,
            complexity=complexity,
            market_size=size,
            intent_category=intent,
            flair_type=flair,
            category=category,
            limit=limit,
            offset=offset,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        # Calculate Aggregations for visualisations
        aggregations = adb.get_search_aggregations(
            query=q,
            boards=boards,
            score_min=score_min,
            complexity=complexity,
            market_size=size,
            intent_category=intent,
            flair_type=flair,
            category=category
        )
        
        return {
            "results": results,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "mode": "analyzed"
            },
            "aggregations": aggregations
        }

    else: # mode == "live"
        db = ArchiveDB()
        # Live search typically only supports basic text search + boards
        # We can implement board filtering in ArchiveDB.search if needed, 
        # but the current implementation extracts board from query or result?
        # The current db_manager.search doesn't natively filter by board argument yet, 
        # only text match. Supporting board filter in live search would require DB update.
        # For now, we search all.
        
        results, total, aggregations = db.search(q, limit=limit, offset=offset)
        
        return {
            "results": results,
            "meta": {
                "total": total,
                "page": page,
                "limit": limit,
                "mode": "live"
            },
            "aggregations": aggregations
        }

@app.get("/threads/{board}/{thread_id}")
def get_thread_details(board: str, thread_id: int, user: dict = Depends(verify_jwt)):
    """Return full thread content including all posts."""
    if user.get("plan_type") != "pro":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Thread context is a Pro feature.")

    db = ArchiveDB()
    thread_data = db.get_thread(board, thread_id)
    if not thread_data:
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread_data

# ... (Keep existing code)

class KeywordPayload(BaseModel):
    keyword: str
    label: Optional[str] = None

@app.get("/keywords")
def get_keywords(user: dict = Depends(verify_jwt)):
    """Get tracked keywords with stats for the authenticated user."""
    user_id = user.get("sub")
    try:
        adb = AnalysisDB()
        return {"keywords": adb.get_tracked_keywords_stats(user_id)}
    except Exception as e:
        logger.error(f"Error fetching keywords for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/keywords/matches")
def get_keyword_matches(keyword: str, user: dict = Depends(verify_jwt)):
    """Get all specific post matches for a keyword."""
    user_id = user.get("sub")
    try:
        adb = AnalysisDB()
        return {"matches": adb.get_keyword_matches(user_id, keyword)}
    except Exception as e:
        logger.error(f"Error fetching matches for keyword {keyword}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keywords")
def add_keyword(payload: KeywordPayload, user: dict = Depends(verify_jwt)):
    """Add or update a tracked keyword for the authenticated user."""
    user_id = user.get("sub")
    
    # Check Plan
    if user.get("plan_type") != "pro":
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Keyword tracking is a Pro feature.")
    
    try:
        adb = AnalysisDB()
        adb.add_tracked_keyword(user_id, payload.keyword, payload.label)
        return {"status": "success", "keyword": payload.keyword}
    except Exception as e:
        logger.error(f"Error adding keyword for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keywords/{keyword}/read")
def mark_keyword_read(keyword: str, user: dict = Depends(verify_jwt)):
    """Mark all matches for a keyword as read for the authenticated user."""
    user_id = user.get("sub")
    try:
        adb = AnalysisDB()
        adb.mark_keyword_read(user_id, keyword)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error marking keyword read for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class SavedItemPayload(BaseModel):
    opportunityId: int
    data: dict

@app.get("/saved")
def get_saved_items(user: dict = Depends(verify_jwt)):
    """Get all saved items for the user."""
    user_id = user.get("sub")
    try:
        adb = AnalysisDB()
        return adb.get_saved_items(user_id)
    except Exception as e:
        logger.error(f"Error fetching saved items for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/saved")
def save_item(payload: SavedItemPayload, user: dict = Depends(verify_jwt)):
    """Save an opportunity/item."""
    user_id = user.get("sub")
    # Free tier limit? Plan says "Unlimited Collections & Saves" for Pro.
    # Implicitly Free checks might exist, but for now implementing basic save.
    
    try:
        adb = AnalysisDB()
        adb.save_item(user_id, payload.opportunityId, payload.data)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving item: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/saved/{opportunity_id}")
def unsave_item(opportunity_id: int, user: dict = Depends(verify_jwt)):
    """Remove a saved item."""
    user_id = user.get("sub")
    try:
        adb = AnalysisDB()
        adb.unsave_item(user_id, opportunity_id)
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error removing saved item: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Validates the signature and updates database
class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    user_id: str

@app.post("/create-order")
async def create_order(request: dict, user: dict = Depends(verify_jwt)):
    """Creates a Razorpay order for Pro subscription."""
    amount = 1000 # $10.00 USD in cents (Early Bird)
    currency = "USD"
    
    try:
        order_data = {
            "amount": amount,
            "currency": currency,
            "receipt": f"receipt_{user.get('sub')}", # 'sub' is usually user_id in JWT
            "notes": {
                "user_id": user.get("sub"),
                "plan": "pro"
            }
        }
        order = razorpay_client.order.create(data=order_data)
        return order
    except Exception as e:
        logger.error(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-payment")
async def verify_payment(payload: PaymentVerification):
    """Verifies Razorpay payment signature and updates user plan."""
    try:
        # Verify Signature
        params_dict = {
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        }
        
        # Verify the signature
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # If successful, update the user db
        user_db = UserDB()
        success = user_db.update_plan(payload.user_id, 'pro')
        
        if success:
            return {"status": "success", "message": "Plan updated to Pro"}
        else:
            raise HTTPException(status_code=500, detail="Failed to update user database")
            
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Payment Signature")
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- Collections API ---

class CollectionPayload(BaseModel):
    name: str
    boards: List[str]

@app.get("/collections")
def get_collections(user: dict = Depends(verify_jwt)):
    """Get collections for the authenticated user."""
    try:
        adb = AnalysisDB()
        return adb.get_collections(user.get("sub"))
    except Exception as e:
        logger.error(f"Error fetching collections: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/collections")
def save_collection(payload: CollectionPayload, user: dict = Depends(verify_jwt)):
    """Create or update a collection."""
    user_id = user.get("sub")
    plan_type = user.get("plan_type")
    
    # 1. Check Plan Limits (Free = Max 1)
    if plan_type != "pro":
        adb = AnalysisDB()
        current = adb.get_collections(user_id)
        # If updating existing (name exists), it's fine. If new, check limit.
        exists = any(c['name'] == payload.name for c in current)
        if not exists and len(current) >= 1:
            raise HTTPException(status_code=403, detail="Free Plan limited to 1 collection. Upgrade to Pro for unlimited.")

    try:
        adb = AnalysisDB()
        adb.save_collection(user_id, payload.name, payload.boards)
        return {"status": "success", "name": payload.name}
    except Exception as e:
        logger.error(f"Error saving collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/collections/{name}")
def delete_collection(name: str, user: dict = Depends(verify_jwt)):
    """Delete a collection."""
    try:
        adb = AnalysisDB()
        adb.delete_collection(user.get("sub"), name)
        return {"status": "success", "deleted": name}
    except Exception as e:
        logger.error(f"Error deleting collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))



