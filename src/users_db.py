import sqlite3
from pathlib import Path
import time

class UserDB:
    def __init__(self, db_path="data/users.db"):
        # Ensure db_path is relative to project root
        project_root = Path(__file__).parent.parent
        self.db_path = project_root / db_path
        self.conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        self.conn.execute("PRAGMA journal_mode=WAL")

    def update_plan(self, user_id, plan_type):
        """Updates the user's plan type."""
        cursor = self.conn.cursor()
        cursor.execute('''
            UPDATE users 
            SET plan_type = ?, subscription_status = 'active', next_billing_date = date('now', '+1 month')
            WHERE id = ?
        ''', (plan_type, user_id))
        self.conn.commit()
        return cursor.rowcount > 0

    def get_user(self, user_id):
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cursor.fetchone()
