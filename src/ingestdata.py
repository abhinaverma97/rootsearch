import sqlite3
import argparse
import json
import re
import html
from pathlib import Path

def clean_text(text):
    """
    Cleans 4chan HTML comments for AI readability.
    """
    if not text:
        return ""
    
    # 1. Unescape HTML entities (e.g., &quot; -> ")
    text = html.unescape(text)
    
    # 2. Convert <br> tags to actual newlines
    text = re.sub(r'<br\s*/?>', '\n', text)
    
    # 3. Strip all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # 4. Remove quote links (e.g., >>12345678)
    text = re.sub(r'>>\d+', '', text)
    
    # 5. Clean up extra whitespace/newlines
    text = re.sub(r'\n+', '\n', text).strip()
    
    return text

def ingest_data(boards, limit=15, min_replies=30, output_file=None):
    if isinstance(boards, str):
        boards = [boards]
    

    base_dir = Path(__file__).resolve().parent.parent
    db_path = base_dir / "data" / "4chan_archive.db"
    
    if not db_path.exists():
        print(f"[!] Database not found at {db_path.absolute()}")
        return

    conn = sqlite3.connect(str(db_path), timeout=20)
    conn.execute("PRAGMA journal_mode=WAL")
    cursor = conn.cursor()

    overall_result = []

    for board in boards:
        # 1. Fetch LATEST threads (sorted by last activity)
        query = "SELECT thread_id, subject, last_modified, reply_count FROM threads WHERE board = ? AND reply_count >= ? ORDER BY last_modified DESC"
        params = [board, min_replies]
        
        if limit:
            query += " LIMIT ?"
            params.append(limit)
        
        cursor.execute(query, params)
        threads = cursor.fetchall()

        if not threads:
            print(f"[*] No threads found in the database for /{board}/.")
            continue

        thread_ids = [t[0] for t in threads]
        thread_meta = {t[0]: {"subject": t[1], "last_modified": t[2]} for t in threads}

        print(f"[*] Fetching all posts for {len(thread_ids)} threads in /{board}/...")

        # 2. Fetch ALL posts for these threads in ONE query
        placeholders = ",".join(["?"] * len(thread_ids))
        query_posts = f"""
            SELECT thread_id, post_id, timestamp, comment, is_op 
            FROM posts 
            WHERE board = ? AND thread_id IN ({placeholders})
            ORDER BY thread_id, timestamp ASC
        """
        
        cursor.execute(query_posts, [board] + thread_ids)
        all_posts = cursor.fetchall()

        # 3. Group posts by thread
        grouped_data = {}
        for t_id, p_id, ts, com, is_op in all_posts:
            if t_id not in grouped_data:
                grouped_data[t_id] = {
                    "board": board,
                    "thread_id": t_id,
                    "subject": clean_text(thread_meta[t_id]["subject"]) if thread_meta[t_id]["subject"] else None,
                    "last_modified": thread_meta[t_id]["last_modified"],
                    "posts": []
                }
            
            grouped_data[t_id]["posts"].append({
                "post_id": p_id,
                "timestamp": ts,
                "comment": clean_text(com),
                "is_op": bool(is_op)
            })

        # Append to overall list in the order threads were found
        overall_result.extend([grouped_data[t_id] for t_id in thread_ids if t_id in grouped_data])

    # Output the data
    if output_file:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(overall_result, f, indent=2)
        print(f"[*] Data saved to {output_path}")
    
    conn.close()
    return overall_result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Read archived 4chan data from the local database.")
    parser.add_argument("boards", nargs="+", help="Board code(s) to read (e.g., 'sci' 'v')")
    parser.add_argument("--limit", type=int, default=20, help="Limit number of threads to retrieve (default: 20, or 10 if multiple boards)")
    parser.add_argument("--min-replies", type=int, default=30, help="Minimum number of replies required for a thread (default: 30)")
    parser.add_argument("--output", "-o", help="File path to save the JSON output")
    
    args = parser.parse_args()
    ingest_data(args.boards, args.limit, args.min_replies, args.output)
