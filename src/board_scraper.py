import requests
import time
import json
import argparse
from pathlib import Path
from db_manager import ArchiveDB

def get_all_boards():
    """Fetches the list of all board codes from 4chan."""
    try:
        r = requests.get("https://a.4cdn.org/boards.json")
        r.raise_for_status()
        return [b['board'] for b in r.json()['boards']]
    except Exception as e:
        print(f"[!] Failed to retrieve boards list: {e}")
        return []

def scrape_board(board_code, db=None):
    """
    Scrapes all threads from a given board, performs incremental updates, and saves to database.
    """
    base_url = "https://a.4cdn.org"
    if db is None:
        db = ArchiveDB() # Initializes/Connects to data/4chan_archive.db

    print(f"\n[*] Processing /{board_code}/...")
    
    # 1. Fetch Catalog with If-Modified-Since
    resource_id = f"catalog_{board_code}"
    last_mod = db.get_sync_header(resource_id)
    headers = {"If-Modified-Since": last_mod} if last_mod else {}
    
    try:
        response = requests.get(f"{base_url}/{board_code}/catalog.json", headers=headers)
        if response.status_code == 304:
            print(f"[*] /{board_code}/ catalog unchanged. Skipping.")
            return
        response.raise_for_status()
        catalog = response.json()
        db.set_sync_header(resource_id, response.headers.get("Last-Modified"))
    except Exception as e:
        print(f"[!] Error fetching catalog: {e}")
        return

    # 2. Extract all thread info from all pages
    catalog_threads = []
    for page in catalog:
        for thread in page['threads']:
            catalog_threads.append(thread)

    if not catalog_threads:
        print(f"[!] No threads found on board /{board_code}/.")
        return

    print(f"[*] Total threads in catalog: {len(catalog_threads)}. Checking against database...")

    updated_count = 0
    new_count = 0
    skipped_count = 0

    # 2. Query database for existing reply counts to support incremental updates
    cursor = db.conn.cursor()
    existing_stats = {
        str(row[0]): row[1] 
        for row in cursor.execute("SELECT thread_id, reply_count FROM threads WHERE board=?", (board_code,)).fetchall()
    }

    for index, thread_info in enumerate(catalog_threads, 1):
        thread_id = str(thread_info['no'])
        live_replies = thread_info.get('replies', 0)
        
        # 3. Incremental check: Skip if we have this version already
        if thread_id in existing_stats:
            if live_replies <= existing_stats[thread_id]:
                skipped_count += 1
                continue
        
        # 4. Respect 4chan API limit
        time.sleep(1.1) 
        print(f"[{index}/{len(catalog_threads)}] Fetching/Updating thread {thread_id}...", end="\r")
        
        try:
            thread_url = f"{base_url}/{board_code}/thread/{thread_id}.json"
            
            # Use sync headers for threads as well (4chan rule)
            thread_resource = f"thread_{board_code}_{thread_id}"
            t_last_mod = db.get_sync_header(thread_resource)
            t_headers = {"If-Modified-Since": t_last_mod} if t_last_mod else {}
            
            thread_res = requests.get(thread_url, headers=t_headers)
            
            if thread_res.status_code == 304:
                skipped_count += 1
                continue
            
            if thread_res.status_code == 200:
                thread_data = thread_res.json()
                db.insert_thread(board_code, thread_data)
                db.set_sync_header(thread_resource, thread_res.headers.get("Last-Modified"))
                
                if thread_id in existing_stats:
                    updated_count += 1
                else:
                    new_count += 1
            elif thread_res.status_code == 404:
                continue
        except Exception as e:
            print(f"\n[!] Error processing {thread_id}: {e}")

    print(f"\n[*] Summary: {new_count} new, {updated_count} updated, {skipped_count} skipped.")
    print(f"[*] All data successfully archived in SQLite database: data/4chan_archive.db")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="4chan Full Board Scraper")
    parser.add_argument("board", nargs="?", help="Optional board code (e.g., 'sci'). If omitted, all boards are scraped.")
    parser.add_argument("--continuous", action="store_true", help="Run the scraper in a continuous loop.")
    parser.add_argument("--interval", type=int, default=300, help="Wait time (seconds) between full scrape cycles (default: 300).")
    
    args = parser.parse_args()
    shared_db = ArchiveDB()

    def run_scrape():
        if args.board:
            scrape_board(args.board, db=shared_db)
        else:
            print("[*] No board specified. Starting full archival of ALL boards...")
            boards = get_all_boards()
            if not boards:
                print("[!] Could not retrieve board list.")
            else:
                for i, board in enumerate(boards, 1):
                    print(f"\n--- Board {i}/{len(boards)} ---")
                    scrape_board(board, db=shared_db)
                    time.sleep(1.1)
                print("\n[*] Full sweep complete.")

    if args.continuous:
        print(f"[*] Entering continuous monitor mode (Interval: {args.interval}s)")
        while True:
            try:
                run_scrape()
                print(f"\n[*] Cycle finished. Next sweep in {args.interval}s...")
                time.sleep(args.interval)
            except KeyboardInterrupt:
                print("\n[!] Scraper stopped by user.")
                break
            except Exception as e:
                print(f"\n[!] Unexpected error in main loop: {e}")
                print("[*] Retrying in 60s...")
                time.sleep(60)
    else:
        run_scrape()
