import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// Authentication middleware - checks if user is logged in
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user is logged in via session
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Fetch user from storage
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
}

// Admin middleware - checks if user is an admin
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  // authMiddleware should be called before this, so req.user should exist
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}
