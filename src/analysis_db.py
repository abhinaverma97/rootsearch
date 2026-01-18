import sqlite3
import json
import logging
import time
from pathlib import Path

class AnalysisDB:
    def __init__(self, db_path="data/opportunities.db"):
        # Ensure db_path is relative to project root, not current working directory
        project_root = Path(__file__).parent.parent
        self.db_path = project_root / db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), timeout=20)
        # Enable WAL (Write-Ahead Logging) for concurrent read/writes
        self.conn.execute("PRAGMA journal_mode=WAL")
        self._create_tables()
        self._migrate_schema()

    def _migrate_schema(self):
        """Adds missing columns and indexes to existing tables."""
        cursor = self.conn.cursor()
        
        # 1. New Columns for 'opportunities'
        new_cols = [
            ("market_score", "INTEGER"),
            ("complexity", "TEXT"),
            ("market_size", "TEXT"),
            ("product_domain", "TEXT"),
            ("intent_category", "TEXT"),
            ("flair_type", "TEXT"),
            ("core_pain", "TEXT")
        ]
        
        # Check existing columns
        cursor.execute("PRAGMA table_info(opportunities)")
        existing_cols = [row[1] for row in cursor.fetchall()]
        
        for col_name, col_type in new_cols:
            if col_name not in existing_cols:
                try:
                    cursor.execute(f"ALTER TABLE opportunities ADD COLUMN {col_name} {col_type}")
                    print(f"[*] Migrated schema: Added {col_name} to opportunities")
                except Exception as e:
                    print(f"[!] Migration error for {col_name}: {e}")
                    
        # 2. Indexes for Performance
        indexes = [
            ("idx_market_score", "opportunities", "market_score"),
            ("idx_intent", "opportunities", "intent_category"),
            ("idx_timestamp", "opportunities", "timestamp")
        ]
        
        for idx_name, table, col in indexes:
            try:
                cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table}({col})")
            except Exception as e:
                print(f"[!] Index creation error {idx_name}: {e}")

        # 3. FTS5 Virtual Table for Instant Search
        try:
            # Check if FTS table exists and has all columns
            cursor.execute("PRAGMA table_info(opportunities_fts)")
            existing_fts_cols = [row[1] for row in cursor.fetchall()]
            required_fts_cols = ["core_pain", "product_concept", "solution", "emerging_trend", "category", "intent_category", "product_domain", "target_audience", "source_boards"]
            
            needs_recreate = False
            if not existing_fts_cols:
                needs_recreate = True
            else:
                for col in required_fts_cols:
                    if col not in existing_fts_cols:
                        needs_recreate = True
                        break
            
            if needs_recreate:
                print("[*] Rebuilding FTS5 Search Index...")
                # Drop old if exists
                cursor.execute("DROP TABLE IF EXISTS opportunities_fts")
                cursor.execute("DROP TRIGGER IF EXISTS opportunities_ai")
                cursor.execute("DROP TRIGGER IF EXISTS opportunities_ad")
                cursor.execute("DROP TRIGGER IF EXISTS opportunities_au")
                
                # Create FTS table
                cols_sql = ", ".join(required_fts_cols)
                cursor.execute(f'''
                    CREATE VIRTUAL TABLE opportunities_fts USING fts5(
                        {cols_sql},
                        content='opportunities', 
                        content_rowid='id'
                    )
                ''')
                
                # Create Triggers to keep FTS in sync with main table
                cursor.execute(f'''
                    CREATE TRIGGER opportunities_ai AFTER INSERT ON opportunities BEGIN
                      INSERT INTO opportunities_fts(rowid, {cols_sql}) 
                      VALUES (new.id, new.core_pain, new.product_concept, new.solution, new.emerging_trend, new.category, new.intent_category, new.product_domain, new.target_audience, new.source_boards);
                    END;
                ''')
                cursor.execute(f'''
                    CREATE TRIGGER opportunities_ad AFTER DELETE ON opportunities BEGIN
                      INSERT INTO opportunities_fts(opportunities_fts, rowid, {cols_sql}) 
                      VALUES('delete', old.id, old.core_pain, old.product_concept, old.solution, old.emerging_trend, old.category, old.intent_category, old.product_domain, old.target_audience, old.source_boards);
                    END;
                ''')
                cursor.execute(f'''
                    CREATE TRIGGER opportunities_au AFTER UPDATE ON opportunities BEGIN
                      INSERT INTO opportunities_fts(opportunities_fts, rowid, {cols_sql}) 
                      VALUES('delete', old.id, old.core_pain, old.product_concept, old.solution, old.emerging_trend, old.category, old.intent_category, old.product_domain, old.target_audience, old.source_boards);
                      INSERT INTO opportunities_fts(rowid, {cols_sql}) 
                      VALUES (new.id, new.core_pain, new.product_concept, new.solution, new.emerging_trend, new.category, new.intent_category, new.product_domain, new.target_audience, new.source_boards);
                    END;
                ''')
                
                # Backfill existing data
                print("[*] Backfilling FTS Index...")
                cursor.execute(f'''
                    INSERT INTO opportunities_fts(rowid, {cols_sql})
                    SELECT id, {cols_sql} FROM opportunities
                ''')
        except Exception as e:
            print(f"[!] FTS5 Error: {e}")

        # Migrations for Tracked Keywords
        cursor.execute("PRAGMA table_info(tracked_keywords)")
        tk_cols = [row[1] for row in cursor.fetchall()]
        if "label" not in tk_cols:
            cursor.execute("ALTER TABLE tracked_keywords ADD COLUMN label TEXT")
            
        cursor.execute("PRAGMA table_info(keyword_matches)")
        km_cols = [row[1] for row in cursor.fetchall()]
        if "is_read" not in km_cols:
            cursor.execute("ALTER TABLE keyword_matches ADD COLUMN is_read INTEGER DEFAULT 0")

        self.conn.commit()

    def _create_tables(self):
        cursor = self.conn.cursor()
        
        # Table for the high-level opportunities
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS opportunities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_boards TEXT,
                category TEXT,
                pain_points TEXT, -- JSON array
                emerging_trend TEXT,
                solution TEXT,
                product_concept TEXT,
                target_audience TEXT,
                market_score INTEGER,
                complexity TEXT,
                market_size TEXT,
                product_domain TEXT,
                intent_category TEXT,
                flair_type TEXT,
                core_pain TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Table for the evidence linked to posts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS evidence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                opportunity_id INTEGER,
                post_id INTEGER,
                quote TEXT,
                relevance TEXT,
                FOREIGN KEY(opportunity_id) REFERENCES opportunities(id)
            )
        ''')

        # 3. Tracked Keywords
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tracked_keywords (
                user_id TEXT,
                keyword TEXT,
                added_at INTEGER,
                label TEXT,
                PRIMARY KEY (user_id, keyword)
            )
        ''')

        # 4. Keyword Matches
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS keyword_matches (
                user_id TEXT,
                post_id INTEGER,
                keyword TEXT,
                board TEXT,
                thread_id INTEGER,
                comment TEXT,
                found_at INTEGER,
                is_read INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, post_id, keyword)
            )
        ''')

        # 5. Board Stats History
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS board_stats_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_code TEXT,
                threads INTEGER,
                replies INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # 6. Global Settings (for API Rotation, etc.)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        ''')

        # 8. Curated Collections (User Specific)
        # Drop old global table if it lacks user_id (simplistic migration for this dev phase)
        try:
             # Check if user_id exists
             cursor.execute("SELECT user_id FROM collections LIMIT 1")
        except:
             # If error, it means table exists but no user_id (or table doesn't exist). 
             # For now, let's just drop and recreate to be clean since we just added it.
             cursor.execute("DROP TABLE IF EXISTS collections")

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                name TEXT,
                boards TEXT, -- Comma separated board codes
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, name)
            )
        ''')

        # 7. Board Stats Cache (Replaces local JSON file)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS board_stats_cache (
                board_code TEXT PRIMARY KEY,
                data JSON,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        self.conn.commit()

    def save_board_stats(self, board, threads, replies):
        """Log current stats for a board (History)."""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT INTO board_stats_history (board_code, threads, replies)
            VALUES (?, ?, ?)
        ''', (board, threads, replies))
        self.conn.commit()

    def save_board_cache(self, board, data):
        """Save full board stats JSON to cache table."""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO board_stats_cache (board_code, data, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        ''', (board, json.dumps(data)))
        self.conn.commit()

    def get_all_cached_stats(self):
        """Retrieve all cached board stats as a dictionary."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT board_code, data FROM board_stats_cache")
        rows = cursor.fetchall()
        
        results = {}
        for board, data_json in rows:
            try:
                results[board] = json.loads(data_json)
            except:
                pass
        return results

    # --- Collections ---
    def get_collections(self, user_id):
        cursor = self.conn.cursor()
        cursor.execute("SELECT name, boards FROM collections WHERE user_id = ? ORDER BY name", (user_id,))
        return [{"name": r[0], "boards": r[1].split(",")} for r in cursor.fetchall()]

    def save_collection(self, user_id, name, boards):
        cursor = self.conn.cursor()
        board_str = ",".join(boards)
        cursor.execute("INSERT OR REPLACE INTO collections (user_id, name, boards) VALUES (?, ?, ?)", (user_id, name, board_str))
        self.conn.commit()

    def delete_collection(self, user_id, name):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM collections WHERE user_id = ? AND name = ?", (user_id, name))
        self.conn.commit()

    # --- Saved Items ---
    def get_saved_items(self, user_id):
        cursor = self.conn.cursor()
        cursor.execute("SELECT opportunity_id, data, saved_at FROM saved_items WHERE user_id = ? ORDER BY saved_at DESC", (user_id,))
        return [
            {
                "opportunity_id": r[0],
                "data": json.loads(r[1]),
                "saved_at": r[2]
            }
            for r in cursor.fetchall()
        ]

    def save_item(self, user_id, opportunity_id, data):
        cursor = self.conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO saved_items (user_id, opportunity_id, data) VALUES (?, ?, ?)", (user_id, opportunity_id, json.dumps(data)))
        self.conn.commit()

    def unsave_item(self, user_id, opportunity_id):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM saved_items WHERE user_id = ? AND opportunity_id = ?", (user_id, opportunity_id))
        self.conn.commit()



    def get_setting(self, key, default=None):
        """Retrieve a global setting."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        row = cursor.fetchone()
        return row[0] if row else default

    def update_setting(self, key, value):
        """Update or create a global setting."""
        cursor = self.conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, str(value)))
        self.conn.commit()

    def get_previous_stats(self, board, hours_ago=24):
        """
        Get the most recent stats entry that is at least 'hours_ago' old.
        For now, we just get the most recent *previous* entry to keep it simple,
        or the one closest to 24h ago if we had a lot of data.
        
        Simple logic: Get the latest entry BEFORE the current session (assuming we just saved one).
        Actually, we usually call this BEFORE saving the current one in the script, 
        or we just get the latest one and compare.
        
        Let's retrieve the most recent entry.
        """
        cursor = self.conn.cursor()
        # Get the latest entry
        cursor.execute('''
            SELECT threads, replies, timestamp 
            FROM board_stats_history 
            WHERE board_code = ? AND timestamp < datetime('now', '-12 hours')
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (board,))
        row = cursor.fetchone()
        
        if row:
            return {"threads": row[0], "replies": row[1], "timestamp": row[2]}
        return None

    def add_tracked_keyword(self, user_id, keyword, label=None):
        cursor = self.conn.cursor()
        now = int(time.time())
        cursor.execute("INSERT OR REPLACE INTO tracked_keywords (user_id, keyword, label, added_at) VALUES (?, ?, ?, ?)", (user_id, keyword, label, now))
        self.conn.commit()

    def remove_tracked_keyword(self, user_id, keyword):
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM tracked_keywords WHERE user_id = ? AND keyword = ?", (user_id, keyword))
        self.conn.commit()

    def get_tracked_keywords(self, user_id=None):
        cursor = self.conn.cursor()
        if user_id:
            rows = cursor.execute("SELECT keyword, added_at FROM tracked_keywords WHERE user_id = ?", (user_id,)).fetchall()
        else:
            rows = cursor.execute("SELECT user_id, keyword, added_at FROM tracked_keywords").fetchall()
        return rows
        
    def get_tracked_keywords_stats(self, user_id):
        """
        Returns keywords with stats for a specific user: {keyword, label, unread_count, latest_match}
        """
        cursor = self.conn.cursor()
        query = """
            SELECT 
                k.keyword, 
                k.label,
                COUNT(CASE WHEN m.is_read = 0 THEN 1 END) as unread_count,
                MAX(m.found_at) as last_match_at
            FROM tracked_keywords k
            LEFT JOIN keyword_matches m ON k.keyword = m.keyword AND k.user_id = m.user_id
            WHERE k.user_id = ?
            GROUP BY k.keyword, k.label
            ORDER BY unread_count DESC, k.label ASC
        """
        rows = cursor.execute(query, (user_id,)).fetchall()
        return [
            {
                "keyword": r[0],
                "label": r[1] or "No Audience", 
                "unread_count": r[2],
                "last_match_at": r[3]
            }
            for r in rows
        ]

    def get_keyword_matches(self, user_id, keyword):
        """
        Returns all specific post matches for a keyword.
        """
        cursor = self.conn.cursor()
        query = """
            SELECT post_id, board, thread_id, comment, found_at, is_read
            FROM keyword_matches
            WHERE user_id = ? AND keyword = ?
            ORDER BY found_at DESC
        """
        cursor.execute(query, (user_id, keyword))
        rows = cursor.fetchall()
        return [
            {
                "post_id": r[0],
                "board": r[1],
                "thread_id": r[2],
                "comment": r[3],
                "found_at": r[4],
                "is_read": r[5]
            }
            for r in rows
        ]

    def mark_keyword_read(self, user_id, keyword):
        cursor = self.conn.cursor()
        cursor.execute("UPDATE keyword_matches SET is_read = 1 WHERE user_id = ? AND keyword = ?", (user_id, keyword))
        self.conn.commit()

    def save_keyword_match(self, user_id, keyword, board, thread_id, post_id, comment):
        cursor = self.conn.cursor()
        now = int(time.time())
        cursor.execute('''
            INSERT OR IGNORE INTO keyword_matches (user_id, post_id, keyword, board, thread_id, comment, found_at, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        ''', (user_id, post_id, keyword, board, thread_id, comment, now))
        self.conn.commit()

    def save_analysis(self, boards, analysis_json):
        """
        Saves the AI-generated analysis JSON into the database.
        """
        cursor = self.conn.cursor()
        source_boards = ",".join(boards) if isinstance(boards, list) else boards
        
        opportunities = analysis_json.get("opportunities", [])
        
        for opp in opportunities:
            # Insert opportunity
            cursor.execute('''
                INSERT INTO opportunities (
                    source_boards, category, pain_points, emerging_trend, 
                    solution, product_concept, target_audience,
                    market_score, complexity, market_size, product_domain,
                    intent_category, flair_type, core_pain
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                source_boards,
                opp.get("category"),
                json.dumps(opp.get("pain_points", [])),
                opp.get("emerging_trend"),
                opp.get("solution"),
                opp.get("product_concept"),
                opp.get("target_audience"),
                opp.get("market_score"),
                opp.get("complexity"),
                opp.get("market_size"),
                opp.get("product_domain"),
                opp.get("intent_category"),
                opp.get("flair_type"),
                opp.get("core_pain")
            ))
            
            opportunity_id = cursor.lastrowid
            
            # Insert evidence
            evidence_list = opp.get("evidence", [])
            for ev in evidence_list:
                cursor.execute('''
                    INSERT INTO evidence (
                        opportunity_id, post_id, quote, relevance
                    ) VALUES (?, ?, ?, ?)
                ''', (
                    opportunity_id,
                    ev.get("post_id"),
                    ev.get("quote"),
                    ev.get("relevance")
                ))
        
        self.conn.commit()
        return len(opportunities)

    def get_latest_analysis(self, boards=None, score_min=None, complexity=None, market_size=None, intent_category=None, flair_type=None):
        """
        Retrieves the most recent opportunities for specific boards with optional filters.
        """
        cursor = self.conn.cursor()
        
        conditions = []
        params = []
        
        # 1. Filter by Boards
        if boards:
            if isinstance(boards, str):
                board_list = [b.strip() for b in boards.split(",") if b.strip()]
            else:
                board_list = boards
                
            if board_list:
                temp_conditions = []
                for b in board_list:
                    temp_conditions.append("',' || source_boards || ',' LIKE ?")
                    params.append(f"%,{b},%")
                conditions.append(f"({' OR '.join(temp_conditions)})")
        
        # 2. Granular Filters
        if score_min is not None:
            conditions.append("market_score >= ?")
            params.append(score_min)
            
        if complexity:
            conditions.append("complexity = ?")
            params.append(complexity)
            
        if market_size:
            conditions.append("market_size = ?")
            params.append(market_size)
            
        if intent_category:
            conditions.append("intent_category = ?")
            params.append(intent_category)
            
        if flair_type:
            conditions.append("flair_type = ?")
            params.append(flair_type)
            
        query = "SELECT * FROM opportunities"
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY timestamp DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Convert to dictionary format
        result = []
        for row in rows:
            opp_id = row[0]
            # Fetch evidence for this opp
            cursor.execute("SELECT post_id, quote, relevance FROM evidence WHERE opportunity_id = ?", (opp_id,))
            evidence = [{"post_id": e[0], "quote": e[1], "relevance": e[2]} for e in cursor.fetchall()]
            
            result.append({
                "id": opp_id,
                "boards": row[1],
                "category": row[2],
                "pain_points": json.loads(row[3]) if row[3] else [],
                "emerging_trend": row[4],
                "solution": row[5],
                "product_concept": row[6],
                "target_audience": row[7],
                "market_score": row[8],
                "complexity": row[9],
                "market_size": row[10],
                "product_domain": row[11],
                "intent_category": row[12],
                "flair_type": row[13],
                "core_pain": row[14],
                "timestamp": row[15],
                "evidence": evidence
            })
        return result

    def search_opportunities(self, query=None, boards=None, score_min=None, complexity=None, market_size=None, intent_category=None, flair_type=None, category=None, limit=50, offset=0, sort_by="date", sort_order="desc"):
        """
        Search opportunities with full filtering and text search.
        Returns (results, total_count).
        """
        cursor = self.conn.cursor()
        
        # Use helper to build conditions (shared with aggregations)
        where_clause, params = self._build_search_conditions(
            cursor, query, boards, score_min, complexity, market_size, intent_category, flair_type, category
        )
        
        if where_clause is None: # FTS returned no hits
            return [], 0
            
        # Get Total Count
        count_query = f"SELECT COUNT(*) FROM opportunities{where_clause}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]
        
        # Sorting
        order_clause = "ORDER BY timestamp DESC" # Default
        if sort_by == "score":
            order_clause = f"ORDER BY market_score {sort_order.upper()}, timestamp DESC"
        elif sort_by == "date":
             order_clause = f"ORDER BY timestamp {sort_order.upper()}"
        # FTS relevance would go here if we had FTS
        
        # Get Results
        data_query = f"SELECT * FROM opportunities{where_clause} {order_clause} LIMIT ? OFFSET ?"
        cursor.execute(data_query, params + [limit, offset])
        rows = cursor.fetchall()
        
        # Format Results
        result = []
        for row in rows:
            opp_id = row[0]
            # Fetch evidence for this opp
            cursor.execute("SELECT post_id, quote, relevance FROM evidence WHERE opportunity_id = ?", (opp_id,))
            evidence = [{"post_id": e[0], "quote": e[1], "relevance": e[2]} for e in cursor.fetchall()]
            
            result.append({
                "id": opp_id,
                "boards": row[1],
                "category": row[2],
                "pain_points": json.loads(row[3]) if row[3] else [],
                "emerging_trend": row[4],
                "solution": row[5],
                "product_concept": row[6],
                "target_audience": row[7],
                "market_score": row[8],
                "complexity": row[9],
                "market_size": row[10],
                "product_domain": row[11],
                "intent_category": row[12],
                "flair_type": row[13],
                "core_pain": row[14],
                "timestamp": row[15],
                "evidence": evidence
            })
            
        return result, total_count

    def _build_search_conditions(self, cursor, query, boards, score_min, complexity, market_size, intent_category, flair_type, category):
        """Helper to build WHERE clause and params for search filtering."""
        conditions = []
        params = []
        
        # 1. Text Search (FTS5)
        fts_rowids = None
        if query and query.strip():
            # Support prefix matching by appending * to tokens
            # We split by space and append * to each word if not already present
            words = query.strip().split()
            fts_query_str = " ".join([f"{w}*" if not w.endswith('*') else w for w in words])
            
            try:
                fts_sql = f"SELECT rowid FROM opportunities_fts WHERE opportunities_fts MATCH ?"
                cursor.execute(fts_sql, (fts_query_str,))
                fts_rowids = [r[0] for r in cursor.fetchall()]
                
                if not fts_rowids:
                    return None, None # Signal no matches
            except Exception as e:
                print(f"[!] FTS Search Error with '{fts_query_str}': {e}")
                pass

        if fts_rowids is not None:
             conditions.append(f"id IN ({','.join(map(str, fts_rowids))})")

        # 2. Board Filter
        if boards:
            if isinstance(boards, str):
                board_list = [b.strip() for b in boards.split(",") if b.strip()]
            else:
                board_list = boards
                
            if board_list:
                temp_conditions = []
                for b in board_list:
                    temp_conditions.append("',' || source_boards || ',' LIKE ?")
                    params.append(f"%,{b},%")
                conditions.append(f"({' OR '.join(temp_conditions)})")
        
        # 3. Granular Filters
        if score_min is not None:
            conditions.append("market_score >= ?")
            params.append(score_min)
        if complexity:
            conditions.append("complexity = ?")
            params.append(complexity)
        if market_size:
            conditions.append("market_size = ?")
            params.append(market_size)
        if intent_category:
            conditions.append("intent_category = ?")
            params.append(intent_category)
        if flair_type:
            conditions.append("flair_type = ?")
            params.append(flair_type)
        if category:
            conditions.append("category = ?")
            params.append(category)
            
        where_clause = ""
        if conditions:
            where_clause = " WHERE " + " AND ".join(conditions)
            
        return where_clause, params

    def get_search_aggregations(self, query=None, boards=None, score_min=None, complexity=None, market_size=None, intent_category=None, flair_type=None, category=None):
        """
        Calculate aggregations for the filtered result set.
        """
        cursor = self.conn.cursor()
        
        # Reuse condition builder logic
        where_clause, params = self._build_search_conditions(
            cursor, query, boards, score_min, complexity, market_size, intent_category, flair_type, category
        )
        
        if where_clause is None: # Means FTS found nothing
            return {"intent_counts": {}, "score_distribution": {}}
            
        # 1. Intent Counts
        cursor.execute(f"SELECT intent_category, COUNT(*) FROM opportunities{where_clause} GROUP BY intent_category", params)
        intent_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0]}
        
        # 2. Score Distribution (Grouped by ranges)
        # We can just get all market_scores and bucket in python for flexibility, or SQL.
        # Given small dataset, GROUP BY market_score is fine.
        cursor.execute(f"SELECT market_score, COUNT(*) FROM opportunities{where_clause} GROUP BY market_score", params)
        score_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0] is not None}
        
        # Bucket scores into ranges [1-3], [4-6], [7-8], [9-10]
        score_dist = {"Low (1-3)": 0, "Medium (4-6)": 0, "High (7-8)": 0, "Elite (9-10)": 0}
        for score, count in score_counts.items():
            if score <= 3: score_dist["Low (1-3)"] += count
            elif score <= 6: score_dist["Medium (4-6)"] += count
            elif score <= 8: score_dist["High (7-8)"] += count
            else: score_dist["Elite (9-10)"] += count

        # 3. Industry Category Counts
        cursor.execute(f"SELECT category, COUNT(*) FROM opportunities{where_clause} GROUP BY category", params)
        category_counts = {row[0]: row[1] for row in cursor.fetchall() if row[0]}

        return {
            "intent_counts": intent_counts,
            "category_counts": category_counts,
            "score_distribution": score_dist
        }
