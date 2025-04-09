import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']);
export const spotTypeEnum = pgEnum('spot_type', ['STANDARD', 'HANDICAPPED', 'ELECTRIC', 'COMPACT']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parking Spots Table
export const parkingSpots = pgTable("parking_spots", {
  id: serial("id").primaryKey(),
  spotNumber: text("spot_number").notNull().unique(),
  level: integer("level").notNull(),
  type: text("type", { enum: ['STANDARD', 'HANDICAPPED', 'ELECTRIC', 'COMPACT'] }).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  pricePerHour: doublePrecision("price_per_hour").notNull(),
});

// Bookings Table
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  spotId: integer("spot_id").references(() => parkingSpots.id).notNull(),
  date: text("date").notNull(), // Store as ISO date string YYYY-MM-DD
  startTime: text("start_time").notNull(), // Store as 24hr time HH:MM
  endTime: text("end_time").notNull(), // Store as 24hr time HH:MM
  duration: integer("duration").notNull(), // In hours
  totalPrice: doublePrecision("total_price").notNull(),
  status: text("status", { enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertParkingSpotSchema = createInsertSchema(parkingSpots).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ id: true, createdAt: true });

// Custom Auth Schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUserDto = z.infer<typeof loginSchema>;
export type RegisterUserDto = z.infer<typeof registerSchema>;

export type ParkingSpot = typeof parkingSpots.$inferSelect;
export type InsertParkingSpot = z.infer<typeof insertParkingSpotSchema>;

export type Booking = typeof bookings.$inferSelect & {
  user?: User;
  spot?: ParkingSpot;
};
export type InsertBooking = z.infer<typeof insertBookingSchema>;
