import argparse
import json
from db_manager import ArchiveDB
from ingestdata import clean_text

def keyword_search(keyword, limit=50):
    """
    Searches the archive for a specific keyword using FTS5.
    """
    db = ArchiveDB()
    print(f"[*] Searching for '{keyword}'...")
    
    # Use the existing FTS5 search from ArchiveDB
    results = db.search(keyword, limit=limit)
    
    if not results:
        print(f"[*] No results found for '{keyword}'.")
        return []

    processed_results = []
    for board, thread_id, post_id, comment in results:
        processed_results.append({
            "board": board,
            "thread_id": thread_id,
            "post_id": post_id,
            "comment": clean_text(comment) # Clean HTML for readability
        })
    
    return processed_results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search the 4chan archive for keywords.")
    parser.add_argument("keyword", help="The string or FTS5 query to search for.")
    parser.add_argument("--limit", type=int, default=50, help="Max results to return (default: 50)")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()
    
    results = keyword_search(args.keyword, args.limit)
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"\n[*] Found {len(results)} matches:")
        for res in results:
            print("-" * 40)
            print(f"Board: /{res['board']}/ | Thread: {res['thread_id']} | Post: {res['post_id']}")
            print(f"Comment: {res['comment'][:200]}..." if len(res['comment']) > 200 else f"Comment: {res['comment']}")
