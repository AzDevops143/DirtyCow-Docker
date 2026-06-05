import { Router, Response } from "express";
import { z } from "zod";
import { getDbInstance } from "../db";
import { authenticate, requireRole, AuthenticatedRequest } from "../middleware/auth";
// Note: We'd normally use Redis here but sticking to in-memory to keep infrastructure sane without actual Redis
const memoryCache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

const getCached = (key: string) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        memoryCache.delete(key);
        return null;
    }
    return item.value;
};
const setCache = (key: string, value: any) => {
    memoryCache.set(key, { value, expiry: Date.now() + CACHE_TTL });
}


export const dataRouter = Router();

// Protect all data routes
dataRouter.use(authenticate);

const ItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

// GET all items (accessible by user or admin, but users only see their own unless admin)
dataRouter.get("/", (req: AuthenticatedRequest, res: Response): void => {
    const user = req.user!;
    const db = getDbInstance();
    
    const cacheKey = `items:${user.id}:${user.role}`;
    const cached = getCached(cacheKey);
    if (cached) {
         res.json({ source: 'cache', data: cached });
         return;
    }

    try {
        let items;
        if (user.role === 'admin') {
            const stmt = db.prepare('SELECT * FROM items');
            items = stmt.all();
        } else {
            // SQL Injection prevented by using parameterized query ?
            const stmt = db.prepare('SELECT * FROM items WHERE user_id = ?');
            items = stmt.all(user.id);
        }
        
        setCache(cacheKey, items);
        res.json({ source: 'db', data: items });
    } catch (error) {
        console.error("Fetch items error", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST to create item
dataRouter.post("/", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
     try {
         const { name, description } = ItemSchema.parse(req.body);
         const user = req.user!;
         const db = getDbInstance();

         // XSS Mitigation on input (simple sanitize, ideal system would use DOMPurify on frontend)
         const safeName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
         const safeDesc = description ? description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : null;
         
         const stmt = db.prepare('INSERT INTO items (user_id, name, description) VALUES (?, ?, ?)');
         const result = stmt.run(user.id, safeName, safeDesc);
         
         // Invalidate Cache
         memoryCache.clear();

         res.status(201).json({ id: result.lastInsertRowid, message: "Item created" });
         return;
     } catch(error) {
          if (error instanceof z.ZodError) {
             res.status(400).json({ message: "Validation error", errors: error.issues });
             return;
         }
         res.status(500).json({ message: "Error creating item" });
         return;
     }
});

// Admin-only route: Delete any user's item
dataRouter.delete("/:id", requireRole('admin'), (req: AuthenticatedRequest, res: Response): void => {
    try {
        // Broken Access Control (Insecure Direct Object Reference) mitigated by requireRole('admin') middleware
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const db = getDbInstance();
        const stmt = db.prepare('DELETE FROM items WHERE id = ?');
        const info = stmt.run(id);

        if (info.changes === 0) {
            res.status(404).json({ message: "Item not found" });
            return;
        }
        
        // Invalidate Cache
        memoryCache.clear();

        res.json({ message: "Item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting item" });
    }
});
