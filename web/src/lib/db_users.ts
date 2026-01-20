import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), '..', 'data', 'users.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize DB
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        provider TEXT DEFAULT 'google',
        
        plan_type TEXT DEFAULT 'free',
        subscription_status TEXT DEFAULT 'active',
        credits_total INTEGER DEFAULT 10,
        credits_used INTEGER DEFAULT 0,
        next_billing_date TEXT,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS saved_items (
        user_id TEXT,
        opportunity_id INTEGER,
        data TEXT,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, opportunity_id)
    );

    CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        boards TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, name)
    );
`);

export interface User {
    id: string;
    email: string;
    name: string;
    image: string;
    provider: string;
    plan_type: 'free' | 'pro' | 'enterprise';
    subscription_status: string;
    credits_total: number;
    credits_used: number;
    next_billing_date: string | null;
    created_at: string;
    last_login: string | null;
}

export function getUserByEmail(email: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function createUser(user: Partial<User>): User {
    // Check if user is an admin (pro access)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const isPro = user.email ? adminEmails.includes(user.email) : false;

    const stmt = db.prepare(`
        INSERT INTO users (id, email, name, image, provider, plan_type, last_login)
        VALUES (@id, @email, @name, @image, @provider, @plan_type, CURRENT_TIMESTAMP)
        RETURNING *
    `);

    return stmt.get({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        provider: user.provider || 'google',
        plan_type: isPro ? 'pro' : 'free'
    }) as User;
}

export function updateUserLogin(email: string) {
    // Check if user should be pro (admin email)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const isPro = adminEmails.includes(email);

    if (isPro) {
        // Upgrade to pro if admin
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP, plan_type = ? WHERE email = ?').run('pro', email);
    } else {
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = ?').run(email);
    }
}

export function updateUserPlan(userId: string, planType: 'free' | 'pro' | 'enterprise') {
    db.prepare('UPDATE users SET plan_type = ? WHERE id = ?').run(planType, userId);
}

export function getUserById(id: string): User | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

// --- Saved Items Functions ---

export function saveItem(userId: string, opportunityId: number, data: any) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO saved_items (user_id, opportunity_id, data)
        VALUES (?, ?, ?)
    `);
    return stmt.run(userId, opportunityId, JSON.stringify(data));
}

export function unsaveItem(userId: string, opportunityId: number) {
    return db.prepare('DELETE FROM saved_items WHERE user_id = ? AND opportunity_id = ?').run(userId, opportunityId);
}

export function getSavedItems(userId: string) {
    const rows = db.prepare('SELECT * FROM saved_items WHERE user_id = ? ORDER BY saved_at DESC').all(userId);
    return rows.map((r: any) => ({
        ...r,
        data: JSON.parse(r.data)
    }));
}

// --- Collections Functions ---

export function createCollection(userId: string, name: string, boards: string[]) {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO collections (user_id, name, boards)
        VALUES (?, ?, ?)
    `);
    return stmt.run(userId, name, JSON.stringify(boards));
}

export function getCollections(userId: string) {
    const rows = db.prepare('SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    return rows.map((r: any) => ({
        ...r,
        boards: JSON.parse(r.boards)
    }));
}

export function deleteCollection(userId: string, name: string) {
    return db.prepare('DELETE FROM collections WHERE user_id = ? AND name = ?').run(userId, name);
}
