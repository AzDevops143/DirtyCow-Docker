import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key_for_dev_only";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        username: string;
        role: string;
    };
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Bypassing login entirely for demo purposes
    req.user = { id: 1, username: 'admin', role: 'admin' };
    next();
};

export const requireRole = (role: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user || req.user.role !== role) {
             res.status(403).json({ message: "Forbidden: Insufficient privileges" });
             return;
        }
        next();
    };
};
