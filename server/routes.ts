import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authRouter } from "./auth";
import { authMiddleware, adminMiddleware } from "./middleware";
import { z } from "zod";
import { insertBookingSchema, insertParkingSpotSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Authentication routes
  app.use("/api/auth", authRouter);

  // User routes
  app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Enhance users with booking counts
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const bookingCount = await storage.getUserBookingCount(user.id);
          return { ...user, bookingCount, password: undefined };
        })
      );
      
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Parking spot routes
  app.get("/api/parking/spots", async (req, res) => {
    try {
      const { date, startTime, duration } = req.query;

      if (date && startTime && duration) {
        // Get available spots for the given time slot
        const spots = await storage.getAvailableParkingSpots(
          date as string,
          startTime as string,
          parseInt(duration as string)
        );
        res.json(spots);
      } else {
        // Get all spots
        const spots = await storage.listParkingSpots();
        res.json(spots);
      }
    } catch (error) {
      console.error("Error fetching spots:", error);
      res.status(500).json({ message: "Failed to fetch parking spots" });
    }
  });

  // Booking routes
  app.get("/api/bookings/my-bookings", authMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", authMiddleware, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { spotId, date, startTime, duration } = req.body;

      // Validate request body
      const bookingSchema = insertBookingSchema.pick({
        spotId: true,
        date: true,
        startTime: true,
        duration: true,
      });
      
      const validation = bookingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid booking data", errors: validation.error.format() });
      }

      // Check if the spot exists
      const spot = await storage.getParkingSpot(spotId);
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }

      // Check if the spot is available for the given time slot
      const availableSpots = await storage.getAvailableParkingSpots(date, startTime, duration);
      const isAvailable = availableSpots.some(s => s.id === spotId);
      
      if (!isAvailable) {
        return res.status(400).json({ message: "This spot is not available for the selected time slot" });
      }

      // Calculate end time
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + duration);
      
      const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

      // Calculate total price
      const totalPrice = spot.pricePerHour * duration;

      // Create booking
      const booking = await storage.createBooking({
        userId,
        spotId,
        date,
        startTime,
        endTime,
        duration,
        totalPrice,
        status: "CONFIRMED",
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.delete("/api/bookings/:id", authMiddleware, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if the booking exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if the booking belongs to the user or user is admin
      if (booking.userId !== userId && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Not authorized to cancel this booking" });
      }

      // Check if booking can be cancelled (not completed or already cancelled)
      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return res.status(400).json({ 
          message: `Booking cannot be cancelled. Current status: ${booking.status}` 
        });
      }

      // Cancel the booking
      const success = await storage.deleteBooking(bookingId);
      if (success) {
        res.json({ message: "Booking cancelled successfully" });
      } else {
        res.status(500).json({ message: "Failed to cancel booking" });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // Admin routes
  app.get("/api/admin/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/admin/bookings", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookings = await storage.listBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.delete("/api/admin/bookings/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      
      // Check if the booking exists
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check if booking can be cancelled
      if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
        return res.status(400).json({ 
          message: `Booking cannot be cancelled. Current status: ${booking.status}` 
        });
      }

      // Cancel the booking
      const success = await storage.deleteBooking(bookingId);
      if (success) {
        res.json({ message: "Booking cancelled successfully" });
      } else {
        res.status(500).json({ message: "Failed to cancel booking" });
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  app.get("/api/admin/spots", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const spots = await storage.listParkingSpots();
      res.json(spots);
    } catch (error) {
      console.error("Error fetching spots:", error);
      res.status(500).json({ message: "Failed to fetch parking spots" });
    }
  });

  app.post("/api/admin/spots", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      // Validate request body
      const validation = insertParkingSpotSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid spot data", errors: validation.error.format() });
      }

      // Check if spot number already exists
      const existingSpot = await storage.getParkingSpotByNumber(req.body.spotNumber);
      if (existingSpot) {
        return res.status(409).json({ message: "A spot with this number already exists" });
      }

      // Create spot
      const spot = await storage.createParkingSpot(req.body);
      res.status(201).json(spot);
    } catch (error) {
      console.error("Error creating spot:", error);
      res.status(500).json({ message: "Failed to create parking spot" });
    }
  });

  app.put("/api/admin/spots/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const spotId = parseInt(req.params.id);
      
      // Check if the spot exists
      const spot = await storage.getParkingSpot(spotId);
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }

      // Validate request body
      const validation = z.object({
        spotNumber: z.string().min(1),
        level: z.number().min(1),
        type: z.string(),
        pricePerHour: z.number().min(0),
        isAvailable: z.boolean(),
      }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid spot data", errors: validation.error.format() });
      }

      // Check if spot number already exists and is not the current spot
      if (req.body.spotNumber !== spot.spotNumber) {
        const existingSpot = await storage.getParkingSpotByNumber(req.body.spotNumber);
        if (existingSpot) {
          return res.status(409).json({ message: "A spot with this number already exists" });
        }
      }

      // Update spot
      const updatedSpot = await storage.updateParkingSpot(spotId, req.body);
      res.json(updatedSpot);
    } catch (error) {
      console.error("Error updating spot:", error);
      res.status(500).json({ message: "Failed to update parking spot" });
    }
  });

  app.delete("/api/admin/spots/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const spotId = parseInt(req.params.id);
      
      // Check if the spot exists
      const spot = await storage.getParkingSpot(spotId);
      if (!spot) {
        return res.status(404).json({ message: "Parking spot not found" });
      }

      // Delete spot
      const success = await storage.deleteParkingSpot(spotId);
      if (success) {
        res.json({ message: "Parking spot deleted successfully" });
      } else {
        res.status(400).json({ message: "Cannot delete spot with active bookings" });
      }
    } catch (error) {
      console.error("Error deleting spot:", error);
      res.status(500).json({ message: "Failed to delete parking spot" });
    }
  });

  app.get("/api/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.listUsers();
      
      // Enhance users with booking counts
      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          const bookingCount = await storage.getUserBookingCount(user.id);
          return { ...user, bookingCount, password: undefined };
        })
      );
      
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate request body
      const validation = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        isActive: z.boolean(),
        isAdmin: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.format() });
      }

      // Check if email already exists and is not the current user
      if (req.body.email !== user.email) {
        const existingUser = await storage.getUserByEmail(req.body.email);
        if (existingUser) {
          return res.status(409).json({ message: "A user with this email already exists" });
        }
      }

      // Update user
      const updatedUser = await storage.updateUser(userId, req.body);
      if (updatedUser) {
        // Don't return the password in the response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.patch("/api/admin/users/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      // Validate request body
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't allow deactivating your own account
      if (req.user!.id === userId && !isActive) {
        return res.status(400).json({ message: "You cannot deactivate your own account" });
      }

      // Update user status
      const updatedUser = await storage.updateUser(userId, { isActive });
      if (updatedUser) {
        // Don't return the password in the response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  return httpServer;
}
