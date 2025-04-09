import { Router } from "express";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import type { Request, Response } from "express";
import * as bcrypt from "bcrypt";

export const authRouter = Router();

// Helper to create a safe user object (without password)
const createSafeUser = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

// Register a new user
authRouter.post("/register", async (req, res) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid registration data", 
        errors: validation.error.format() 
      });
    }

    const { name, email, password } = req.body;

    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    // Create user
    const user = await storage.createUser({
      name,
      email,
      password,
      isAdmin: false,
      isActive: true
    });

    // Set user in session
    req.session.userId = user.id;

    // Return user without password
    res.status(201).json(createSafeUser(user));
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try {
    // Validate request body
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid login data", 
        errors: validation.error.format() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: "This account has been deactivated" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set user in session
    req.session.userId = user.id;

    // Return user without password
    res.json(createSafeUser(user));
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Get current user
authRouter.get("/me", async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user from database
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user is active
    if (!user.isActive) {
      // Clear session for inactive user
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
      return res.status(401).json({ message: "This account has been deactivated" });
    }

    // Return user without password
    res.json(createSafeUser(user));
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
});

// Logout
authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    res.json({ message: "Logged out successfully" });
  });
});

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
