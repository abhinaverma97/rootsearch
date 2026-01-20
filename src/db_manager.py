import sqlite3
from pathlib import Path

class ArchiveDB:
    def __init__(self, db_path="data/4chan_archive.db"):
        # Ensure db_path is relative to project root
        project_root = Path(__file__).parent.parent
        self.db_path = project_root / db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path), timeout=20)
        # Enable WAL mode for better concurrency
        self.conn.execute("PRAGMA journal_mode=WAL")
        self._create_tables()

    def _create_tables(self):
        cursor = self.conn.cursor()
        
        # 1. Threads table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS threads (
                thread_id INTEGER PRIMARY KEY,
                board TEXT,
                subject TEXT,
                last_modified INTEGER,
                reply_count INTEGER,
                image_count INTEGER
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_threads_board_mod ON threads (board, last_modified DESC)')

        # 2. Posts table (normalized)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS posts (
                post_id INTEGER PRIMARY KEY,
                thread_id INTEGER,
                board TEXT,
                timestamp INTEGER,
                comment TEXT,
                is_op INTEGER,
                FOREIGN KEY(thread_id) REFERENCES threads(thread_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_posts_thread_board ON posts (board, thread_id)')

        # 3. Request Tracking for API compliance (If-Modified-Since)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS api_sync (
                resource_id TEXT PRIMARY KEY, -- e.g. "catalog_sci" or "thread_12345"
                last_modified_header TEXT
            )
        ''')

        # 4. Full Text Search table for comments
        cursor.execute('''
            CREATE VIRTUAL TABLE IF NOT EXISTS posts_search USING fts5(
                post_id UNINDEXED, 
                comment,
                content='posts',
                content_rowid='post_id'
            )
        ''')
        
        # Triggers to keep FTS index updated automatically
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
                INSERT INTO posts_search(rowid, post_id, comment) VALUES (new.post_id, new.post_id, new.comment);
            END;
        ''')

        self.conn.commit()

    def insert_thread(self, board, thread_data):
        cursor = self.conn.cursor()
        posts = thread_data.get('posts', [])
        if not posts: return

        op = posts[0]
        thread_id = op['no']
        
        # Insert/Update Thread
        cursor.execute('''
            INSERT INTO threads (thread_id, board, subject, last_modified, reply_count, image_count)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(thread_id) DO UPDATE SET
                last_modified=excluded.last_modified,
                reply_count=excluded.reply_count,
                image_count=excluded.image_count
        ''', (
            thread_id, 
            board, 
            op.get('sub'), 
            op.get('last_modified', op.get('time')),
            len(posts) - 1,
            thread_data.get('images', 0)
        ))

        # Insert Posts
        for i, post in enumerate(posts):
            cursor.execute('''
                INSERT OR IGNORE INTO posts (post_id, thread_id, board, timestamp, comment, is_op)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                post['no'],
                thread_id,
                board,
                post['time'],
                post.get('com', ''),
                1 if i == 0 else 0
            ))
        
        self.conn.commit()

    def search(self, keyword, limit=50, offset=0, min_timestamp=None):
        cursor = self.conn.cursor()
        
        # 1. Get Total Count
        # Support prefix matching for live search too
        words = keyword.strip().split()
        fts_keyword = " ".join([f"{w}*" if not w.endswith('*') else w for w in words])
        
        where_clause = "WHERE ps.comment MATCH ?"
        params = [fts_keyword]
        
        if min_timestamp:
            # We need to join with posts to filter by timestamp for the count
            count_query = f"""
                SELECT COUNT(*) 
                FROM posts_search ps
                JOIN posts p ON ps.rowid = p.post_id
                {where_clause} AND p.timestamp > ?
            """
            params.append(min_timestamp)
        else:
            count_query = f"SELECT COUNT(*) FROM posts_search ps {where_clause}"

        cursor.execute(count_query, params)
        total_count = cursor.fetchone()[0]

        # 2. Calculate Board Aggregations (for ALL matching results)
        if min_timestamp:
            agg_query = """
                SELECT p.board, COUNT(*) as count
                FROM posts_search ps
                JOIN posts p ON ps.rowid = p.post_id
                WHERE ps.comment MATCH ? AND p.timestamp > ?
                GROUP BY p.board
                ORDER BY count DESC
            """
            agg_params = [fts_keyword, min_timestamp]
        else:
            agg_query = """
                SELECT p.board, COUNT(*) as count
                FROM posts_search ps
                JOIN posts p ON ps.rowid = p.post_id
                WHERE ps.comment MATCH ?
                GROUP BY p.board
                ORDER BY count DESC
            """
            agg_params = [fts_keyword]
        
        cursor.execute(agg_query, agg_params)
        board_counts = {row[0]: row[1] for row in cursor.fetchall()}
        
        aggregations = {
            "board_counts": board_counts
        }

        # 3. Get Results (Optimized: Deferred Join)
        if min_timestamp:
            fts_query = """
                SELECT ps.rowid 
                FROM posts_search ps
                JOIN posts p ON ps.rowid = p.post_id
                WHERE ps.comment MATCH ? AND p.timestamp > ?
                ORDER BY ps.rowid DESC 
                LIMIT ? OFFSET ?
            """
            query_params = [fts_keyword, min_timestamp, limit, offset]
        else:
            fts_query = """
                SELECT rowid 
                FROM posts_search 
                WHERE comment MATCH ? 
                ORDER BY rowid DESC 
                LIMIT ? OFFSET ?
            """
            query_params = [fts_keyword, limit, offset]
            
        post_ids_rows = cursor.execute(fts_query, query_params).fetchall()
        
        if not post_ids_rows:
            return [], total_count, aggregations
            
        post_ids = [r[0] for r in post_ids_rows]
        
        # 4. Fetch Details for these specific IDs
        placeholders = ','.join(['?'] * len(post_ids))
        details_query = f"""
            SELECT p.board, p.thread_id, p.post_id, p.comment, p.timestamp, t.subject
            FROM posts p
            JOIN threads t ON p.thread_id = t.thread_id
            WHERE p.post_id IN ({placeholders})
            ORDER BY p.post_id DESC
        """
        
        rows = cursor.execute(details_query, post_ids).fetchall()
        
        results = []
        for r in rows:
            results.append({
                "board": r[0],
                "thread_id": r[1],
                "post_id": r[2],
                "comment": r[3],
                "timestamp": r[4],
                "subject": r[5]
            })
            
        return results, total_count, aggregations

    def get_thread(self, board, thread_id):
        cursor = self.conn.cursor()
        
        # Get Thread Info
        cursor.execute("SELECT thread_id, board, subject, last_modified, reply_count, image_count FROM threads WHERE board = ? AND thread_id = ?", (board, thread_id))
        row = cursor.fetchone()
        if not row: return None
        
        thread_info = {
            "thread_id": row[0],
            "board": row[1],
            "subject": row[2],
            "last_modified": row[3],
            "reply_count": row[4],
            "image_count": row[5]
        }
        
        # Get Posts
        cursor.execute("""
            SELECT post_id, timestamp, comment, is_op 
            FROM posts 
            WHERE board = ? AND thread_id = ? 
            ORDER BY post_id ASC
        """, (board, thread_id))
        
        posts = []
        for r in cursor.fetchall():
            posts.append({
                "no": r[0],
                "time": r[1],
                "com": r[2],
                "is_op": r[3]
            })
            
        return {
            **thread_info,
            "posts": posts
        }

    def get_all_stored_boards(self):
        cursor = self.conn.cursor()
        rows = cursor.execute("SELECT DISTINCT board FROM threads").fetchall()
        return [row[0] for row in rows]

    def get_sync_header(self, resource_id):
        cursor = self.conn.cursor()
        row = cursor.execute("SELECT last_modified_header FROM api_sync WHERE resource_id = ?", (resource_id,)).fetchone()
        return row[0] if row else None

    def set_sync_header(self, resource_id, header_value):
        if not header_value: return
        cursor = self.conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO api_sync (resource_id, last_modified_header) VALUES (?, ?)", (resource_id, header_value))
        self.conn.commit()

    def get_global_stats(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM posts")
        post_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(DISTINCT board) FROM threads")
        board_count = cursor.fetchone()[0]
        return {
            "posts": post_count,
            "boards": board_count
        }

if __name__ == "__main__":
    db = ArchiveDB()
    print("[*] Database initialized at data/4chan_archive.db")
