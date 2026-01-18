import requests
import json
import argparse
import os
from pathlib import Path
from dotenv import load_dotenv
from ingestdata import ingest_data
from analysis_db import AnalysisDB
from db_manager import ArchiveDB
from key_rotator import rotator

def analyze_data(input_data, api_key, source_boards=None):
    """
    Analyzes list of thread data and sends it to the AI for product analysis.
    """
    if not api_key or api_key == "<OPENROUTER_API_KEY>":
        print("[!] Error: Please provide a valid OpenRouter API key.")
        return

    if not input_data:
        print("[*] No data to analyze.")
        return

    print(f"[*] Analyzing {len(input_data)} threads...")

    db = AnalysisDB()
    system_prompt = """
    You are a specialized Market Discovery AI. Your goal is to analyze raw forum discussions and identify high-signal discoveries.
    Instead of inventing product ideas, focus on capturing the raw reality of the users' needs.

    For each discovery, classify it into one of the following Intent Categories and STRICTLY follow the corresponding schema.
    Fields marked "NULL" must be returned as null.

    1. "Core Pains & Anger"
       - Use when: User is venting, complaining, or expressing frustration.
       - core_pain: REQUIRED (Deep description of the frustration).
       - target_audience: REQUIRED (Who is angry?).
       - solution: REQUIRED (Suggested approach to solve the pain).
       - product_concept: NULL.
       - emerging_trend: NULL.

    2. "Money Talk"
       - Use when: Users discuss spending, budgets, or "I would pay for...".
       - core_pain: REQUIRED (What are they trying to solve with money?).
       - product_concept: REQUIRED (What is the theoretical product?).
       - target_audience: REQUIRED (Who is better to pay?).
       - solution: NULL.
       - emerging_trend: NULL.

    3. "Advice & Solution Requests"
       - Use when: User asks "How do I...?" or "Is there a tool for...?".
       - core_pain: REQUIRED (The problem they can't solve).
       - ticket_audience: REQUIRED (Who is asking?).
       - solution: REQUIRED.
       - product_concept: NULL.
       - emerging_trend: NULL.

    4. "Emerging Trends"
       - Use when: A new behavior, vocabulary, or interest is spreading (e.g., "Everyone is moving to Linux").
       - emerging_trend: REQUIRED (Description of the shift).
       - target_audience: REQUIRED (Who is driving the trend?).
       - core_pain: NULL.
       - solution: NULL.
       - product_concept: NULL.

    5. "Ideas"
       - Use when: Users explicitly propose a solution or feature.
       - product_concept: REQUIRED (The idea description).
       - solution: REQUIRED (How it works).
       - core_pain: OPTIONAL (If the idea solves a specific pain).
       - emerging_trend: NULL.


    CRITICAL ANTI-HALLUCINATION RULE:
    If a value is not explicitly stated in the text OR supported by at least two independent users,
    you MUST return null for that field.
    Do NOT infer, generalize, assume, or “best guess” any value.

    You are NOT a startup ideation assistant.
    You are an observer documenting raw user reality.
    Do NOT optimize for usefulness, opportunity, novelty, or product viability.
    
    MARKET_SCORE GUIDANCE (MANDATORY):
    1–3  → Isolated, weak, or ambiguous signal
    4–6  → Repeated pain or request with moderate intensity
    7–8  → Strong recurring pain with emotional or monetary impact
    9–10 → Widespread, urgent, unresolved problem across multiple users or threads

    EMPTY OUTPUT IS VALID:
    If no high-signal, evidence-backed discoveries exist,
    return exactly:
    { "discoveries": [] }
    Do NOT force discoveries to fill the output.

    Return the analysis strictly in this JSON format:
    {
      "discoveries": [
        {
          "intent_category": "Core Pains & Anger | Money Talk | Advice Requests | Emerging Trends | Ideas",
          "category": "High-level industry (e.g. Bio-hacking)",
          
          "core_pain": "String or Null",
          "emerging_trend": "String or Null",
          "solution": "String or Null",
          "product_concept": "String or Null",
          
          "target_audience": "String (Required)",
          "market_score": 1-10 (Weighted by signal intensity),
          "complexity": "Low | Medium | High",
          "market_size": "Niche | Mid-size | Mass Market",
          "product_domain": "Domain (e.g. FinTech)",
          "flair_type": "Context tag (e.g. Rant, Question)",
          "evidence": [
            {
               "post_id": "...", "quote": "...", "relevance": "..."
            }
          ]
        }
      ]
    }

    Constraints:
    - respect the NULL rules above. Do not hallucinate values.
    - If a field is NULL in the schema, it MUST be valid JSON null, not an empty string.
    - Multi-post support: Prioritize findings supported by multiple users.
    - EVIDENCE IS NECESSARY: Every discovery MUST include at least one valid evidence item.
    """

    user_content = json.dumps(input_data, indent=2)

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps({
                "model": "xiaomi/mimo-v2-flash:free",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
            })
        )
        response.raise_for_status()
        result = response.json()
        
        analysis_content = result['choices'][0]['message']['content']
        
        # Extract JSON from potential markdown wrapping
        clean_json = analysis_content.strip()
        if clean_json.startswith("```json"):
            clean_json = clean_json[7:-3].strip()
        elif clean_json.startswith("```"):
            clean_json = clean_json[3:-3].strip()

        try:
            json_analysis = json.loads(clean_json)
            
            # Handle both "discoveries" and legacy "opportunities" key
            data_list = json_analysis.get("discoveries", json_analysis.get("opportunities", []))
            normalized_analysis = {"opportunities": data_list} # Keep internal DB logic compatible with "opportunities" key

            # Save to Database
            count = db.save_analysis(source_boards or "unknown", normalized_analysis)
            print(f"[*] Analysis complete! Saved {count} discoveries to data/opportunities.db")
            
            # Increment API request count for rotation
            rotator.increment_count()
            
            # Optional: Also save to JSON for backup/debugging
            source_name = "_".join(source_boards) if isinstance(source_boards, list) else (source_boards or "output")
            project_root = Path(__file__).resolve().parent.parent
            output_file = project_root / "data" / f"analysis_{source_name}.json"
            output_file.parent.mkdir(parents=True, exist_ok=True)
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(json_analysis, f, indent=2)
            
        except json.JSONDecodeError:
            print("[!] AI did not return valid JSON. Saving raw output to analysis_failed.txt")
            with open("analysis_failed.txt", "w", encoding="utf-8") as f:
                f.write(analysis_content)

    except Exception as e:
        print(f"[!] API Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze forum data for product opportunities.")
    parser.add_argument("--boards", nargs="+", help="Board codes to ingest and analyze directly (e.g., 'sci' 'v')")
    parser.add_argument("--all-boards", action="store_true", help="Analyze all boards currently stored in the archive database.")
    parser.add_argument("--file", help="Path to an existing JSON file to analyze")
    parser.add_argument("--limit", type=int, default=15, help="Limit per board (default: 20)")
    parser.add_argument("--min-replies", type=int, default=30, help="Min replies per thread (default: 30)")
    parser.add_argument("--api-key", help="OpenRouter API Key")
    
    args = parser.parse_args()
    
    # Load environment variables
    env_path = Path(__file__).parent.parent / ".env.local"
    load_dotenv(dotenv_path=env_path)
    
    # Use rotator if no key provided via argument
    api_key = args.api_key or rotator.get_active_key() or os.getenv("OPENROUTER_API_KEY") or "<OPENROUTER_API_KEY>"
    
    data = []
    
    if args.all_boards:
        archive_db = ArchiveDB()
        boards_to_process = archive_db.get_all_stored_boards()
        if not boards_to_process:
            print("[!] No boards found in the archive database. Run the scraper first.")
            exit(1)
    elif args.boards:
        boards_to_process = args.boards
    else:
        boards_to_process = []

    if boards_to_process:
        print(f"[*] Starting analysis for {len(boards_to_process)} boards...")
        for board in boards_to_process:
            print(f"\n--- Analyzing /{board}/ ---")
            data = ingest_data([board], limit=args.limit, min_replies=args.min_replies)
            if not data:
                print(f"[*] skipping /{board}/ (no data matches criteria)")
                continue
            
            # Refresh key mid-run if using rotator
            current_key = args.api_key or rotator.get_active_key() or os.getenv("OPENROUTER_API_KEY") or "<OPENROUTER_API_KEY>"
            analyze_data(data, current_key, source_boards=[board])
    elif args.file:
        input_path = Path(args.file)
        if input_path.exists():
            with open(input_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            analyze_data(data, api_key, source_boards=input_path.stem)
        else:
            print(f"[!] File not found: {args.file}")
    else:
        print("[!] Error: Specify either --boards or --file")
        exit(1)