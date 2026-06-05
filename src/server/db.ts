import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "database.sqlite");

// Allow setting up an in-memory DB for tests
export const getDb = (memory = false) => {
    const db = new Database(memory ? ':memory:' : dbPath);
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    return db;
};

// Singleton connection
let dbInstance: Database.Database | null = null;
export const getDbInstance = () => {
    if (!dbInstance) {
        dbInstance = getDb();
    }
    return dbInstance;
};

export const initDb = () => {
    const db = getDbInstance();
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `);
};

// Initialize schema on startup
initDb();
