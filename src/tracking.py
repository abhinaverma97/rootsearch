import argparse
import json
from db_manager import ArchiveDB
from analysis_db import AnalysisDB
from ingestdata import clean_text

def run_sweep():
    """
    Searches the archive for all tracked keywords across all users and saves new matches.
    Matches are only found for posts appearing AFTER the keyword was added by the user.
    """
    adb = AnalysisDB()
    archive_db = ArchiveDB()
    
    # Returns [(user_id, keyword, added_at), ...]
    tracked_items = adb.get_tracked_keywords()
    if not tracked_items:
        print("[*] No keywords are currently being tracked by any user.")
        return

    print(f"[*] Scanning archive for {len(tracked_items)} user-keyword tracking assignments...")
    
    for user_id, kw, added_at in tracked_items:
        # added_at is a string from SQLite: 'YYYY-MM-DD HH:MM:SS'
        # archive_db.search expects a timestamp string or something it can compare directly in SQL
        
        results, total = archive_db.search(kw, limit=100, min_timestamp=added_at) 
        
        if results:
            print(f"  [+] User {user_id}: Found {len(results)} matches for '{kw}' since {added_at}")
            for r in results:
                # r is a dict from ArchiveDB.search: {"board", "thread_id", "post_id", "comment", ...}
                adb.save_keyword_match(
                    user_id=user_id,
                    keyword=kw,
                    board=r['board'],
                    thread_id=r['thread_id'],
                    post_id=r['post_id'],
                    comment=clean_text(r['comment'])
                )
        
    print(f"[*] Sweep complete. Checking database for new matches...")
    # Summary of total matches found ever
    cursor = adb.conn.cursor()
    total = cursor.execute("SELECT COUNT(*) FROM keyword_matches").fetchone()[0]
    print(f"[*] Total tracked matches in database: {total}")

def manage_keywords(args):
    adb = AnalysisDB()
    if args.add:
        for kw in args.add:
            adb.add_tracked_keyword(kw)
            print(f"[+] Now tracking: '{kw}'")
    
    if args.remove:
        for kw in args.remove:
            adb.remove_tracked_keyword(kw)
            print(f"[-] Stopped tracking: '{kw}'")
            
    if args.list:
        keywords = adb.get_tracked_keywords()
        print("\n[*] Currently Tracked Keywords:")
        for kw in keywords:
            print(f"  - {kw}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Track specific keywords across the 4chan archive.")
    subparsers = parser.add_subparsers(dest="command")

    # Command: sweep
    sweep_parser = subparsers.add_parser("sweep", help="Search the archive for all tracked keywords.")

    # Command: manage
    manage_parser = subparsers.add_parser("manage", help="Add, remove, or list tracked keywords.")
    manage_parser.add_argument("--add", nargs="+", help="Add one or more keywords to the track list.")
    manage_parser.add_argument("--remove", nargs="+", help="Remove one or more keywords from the track list.")
    manage_parser.add_argument("--list", action="store_true", help="List all currently tracked keywords.")

    args = parser.parse_args()

    if args.command == "sweep":
        run_sweep()
    elif args.command == "manage":
        manage_keywords(args)
    else:
        parser.print_help()
