import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDbInstance } from "../db";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_for_dev_only";

// Schema for input validation (Mitigates payload injection)
const AuthSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

authRouter.post("/register", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = AuthSchema.parse(req.body);
        const role = req.body.role === 'admin' ? 'admin' : 'user';

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const db = getDbInstance();
        try {
            const stmt = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)');
            stmt.run(username, hashedPassword, role);
            res.status(201).json({ message: "User registered successfully" });
            return;
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                res.status(409).json({ message: "Username already exists" });
                return;
            }
            throw error;
        }
    } catch (error) {
         if (error instanceof z.ZodError) {
             res.status(400).json({ message: "Validation error", errors: error.issues });
             return;
         }
         console.error("Register error", error);
         res.status(500).json({ message: "Internal server error" });
         return;
    }
});

authRouter.post("/login", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { username, password } = AuthSchema.parse(req.body);
        const db = getDbInstance();
        
        const stmt = db.prepare('SELECT id, username, password, role FROM users WHERE username = ?');
        const user = stmt.get(username) as any;

        if (!user || !(await bcrypt.compare(password, user.password))) {
             res.status(401).json({ message: "Invalid credentials" }); // Note: Generic error to avoid user enumeration
             return;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Store JWT in an httpOnly cookie (Mitigates XSS accessing token)
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict', // Mitigates CSRF
            maxAge: 3600000 // 1 hour
        });

        res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username, role: user.role } });
        return;
    } catch (error) {
        if (error instanceof z.ZodError) {
             res.status(400).json({ message: "Validation error", errors: error.issues });
             return;
         }
        console.error("Login error", error);
        res.status(500).json({ message: "Internal server error" });
         return;
    }
});

authRouter.post("/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out" });
});
