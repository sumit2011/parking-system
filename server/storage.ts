import { User, InsertUser, ParkingSpot, InsertParkingSpot, Booking, InsertBooking } from "@shared/schema";
import * as bcrypt from "bcrypt";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Define session with userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export interface IStorage {
  sessionStore: ReturnType<typeof createMemoryStore>;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  getUserBookingCount(userId: number): Promise<number>;
  
  // Parking spot operations
  getParkingSpot(id: number): Promise<ParkingSpot | undefined>;
  getParkingSpotByNumber(spotNumber: string): Promise<ParkingSpot | undefined>;
  createParkingSpot(spot: InsertParkingSpot): Promise<ParkingSpot>;
  updateParkingSpot(id: number, spot: Partial<ParkingSpot>): Promise<ParkingSpot | undefined>;
  deleteParkingSpot(id: number): Promise<boolean>;
  listParkingSpots(): Promise<ParkingSpot[]>;
  getAvailableParkingSpots(date: string, startTime: string, duration: number): Promise<ParkingSpot[]>;
  
  // Booking operations
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  listBookings(): Promise<Booking[]>;
  getUserBookings(userId: number): Promise<Booking[]>;
  getBookingsForSpot(spotId: number, date: string): Promise<Booking[]>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalUsers: number;
    activeBookings: number;
    occupiedSpots: number;
    revenueToday: number;
    occupancyByHour: { hour: string; count: number }[];
    recentBookings: {
      id: number;
      userName: string;
      spotNumber: string;
      time: string;
      status: string;
    }[];
  }>;
}

export class MemStorage implements IStorage {
  public sessionStore: ReturnType<typeof createMemoryStore>;
  private users: Map<number, User>;
  private parkingSpots: Map<number, ParkingSpot>;
  private bookings: Map<number, Booking>;
  private userIdCounter: number;
  private spotIdCounter: number;
  private bookingIdCounter: number;

  constructor() {
    this.sessionStore = MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    this.users = new Map();
    this.parkingSpots = new Map();
    this.bookings = new Map();
    this.userIdCounter = 1;
    this.spotIdCounter = 1;
    this.bookingIdCounter = 1;
    
    // Initialize with admin user
    this.createUser({
      name: "Admin User",
      email: "admin@parksmart.com",
      password: "admin123",
      isAdmin: true,
      isActive: true,
    });
    
    // Initialize with some parking spots
    this.createInitialParkingSpots();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hashSync(password, 10);
  }

  public async comparePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compareSync(plain, hashed);
  }

  private async createInitialParkingSpots() {
    // Level 1 spots
    for (let i = 1; i <= 6; i++) {
      this.createParkingSpot({
        spotNumber: `A${i}`,
        level: 1,
        type: "STANDARD",
        isAvailable: true,
        pricePerHour: 3.0,
      });
    }
    
    // Level 2 spots
    for (let i = 1; i <= 6; i++) {
      this.createParkingSpot({
        spotNumber: `B${i}`,
        level: 2,
        type: i === 3 ? "HANDICAPPED" : "STANDARD",
        isAvailable: true,
        pricePerHour: i === 3 ? 2.5 : 3.0,
      });
    }
    
    // Set some spots as unavailable for demo purposes
    const spotA3 = await this.getParkingSpotByNumber("A3");
    const spotB2 = await this.getParkingSpotByNumber("B2");
    const spotB6 = await this.getParkingSpotByNumber("B6");
    
    if (spotA3) await this.updateParkingSpot(spotA3.id, { isAvailable: false });
    if (spotB2) await this.updateParkingSpot(spotB2.id, { isAvailable: false });
    if (spotB6) await this.updateParkingSpot(spotB6.id, { isAvailable: false });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email.toLowerCase() === email.toLowerCase());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const hashedPassword = await this.hashPassword(userData.password);
    
    const user: User = {
      id,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      isAdmin: userData.isAdmin || false,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      createdAt: new Date().toISOString(),
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...userData,
      // Don't overwrite these fields accidentally
      id: user.id,
      createdAt: user.createdAt,
      // Hash the password if it's being updated
      password: userData.password ? await this.hashPassword(userData.password) : user.password,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserBookingCount(userId: number): Promise<number> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId).length;
  }

  // Parking spot operations
  async getParkingSpot(id: number): Promise<ParkingSpot | undefined> {
    return this.parkingSpots.get(id);
  }

  async getParkingSpotByNumber(spotNumber: string): Promise<ParkingSpot | undefined> {
    return Array.from(this.parkingSpots.values()).find(spot => spot.spotNumber === spotNumber);
  }

  async createParkingSpot(spotData: InsertParkingSpot): Promise<ParkingSpot> {
    const id = this.spotIdCounter++;
    
    const spot: ParkingSpot = {
      id,
      spotNumber: spotData.spotNumber,
      level: spotData.level,
      type: spotData.type,
      isAvailable: spotData.isAvailable !== undefined ? spotData.isAvailable : true,
      pricePerHour: spotData.pricePerHour,
    };
    
    this.parkingSpots.set(id, spot);
    return spot;
  }

  async updateParkingSpot(id: number, spotData: Partial<ParkingSpot>): Promise<ParkingSpot | undefined> {
    const spot = await this.getParkingSpot(id);
    if (!spot) return undefined;
    
    const updatedSpot: ParkingSpot = {
      ...spot,
      ...spotData,
      // Don't overwrite this field accidentally
      id: spot.id,
    };
    
    this.parkingSpots.set(id, updatedSpot);
    return updatedSpot;
  }

  async deleteParkingSpot(id: number): Promise<boolean> {
    // Check if there are any bookings for this spot
    const hasBookings = Array.from(this.bookings.values()).some(booking => booking.spotId === id);
    if (hasBookings) {
      return false;
    }
    
    return this.parkingSpots.delete(id);
  }

  async listParkingSpots(): Promise<ParkingSpot[]> {
    return Array.from(this.parkingSpots.values());
  }

  async getAvailableParkingSpots(date: string, startTime: string, duration: number): Promise<ParkingSpot[]> {
    const allSpots = Array.from(this.parkingSpots.values());
    const allBookings = Array.from(this.bookings.values());
    
    // Calculate end time
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);
    
    const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
    
    // Filter out spots that are already booked for this time
    return allSpots.filter(spot => {
      // Skip spots that are marked as unavailable
      if (!spot.isAvailable) return false;
      
      // Check if there are any bookings that overlap with our time range
      const overlappingBookings = allBookings.filter(booking => {
        if (booking.spotId !== spot.id) return false;
        if (booking.date !== date) return false;
        if (booking.status === "CANCELLED") return false;
        
        const [bookingStartHours, bookingStartMinutes] = booking.startTime.split(":").map(Number);
        const bookingStart = new Date();
        bookingStart.setHours(bookingStartHours, bookingStartMinutes, 0, 0);
        
        const [bookingEndHours, bookingEndMinutes] = booking.endTime.split(":").map(Number);
        const bookingEnd = new Date();
        bookingEnd.setHours(bookingEndHours, bookingEndMinutes, 0, 0);
        
        // Check if the booking overlaps with our time range
        const ourStart = startDate.getTime();
        const ourEnd = endDate.getTime();
        const theirStart = bookingStart.getTime();
        const theirEnd = bookingEnd.getTime();
        
        return (ourStart < theirEnd && ourEnd > theirStart);
      });
      
      return overlappingBookings.length === 0;
    });
  }

  // Booking operations
  async getBooking(id: number): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    // Enrich with user and spot information
    const user = await this.getUser(booking.userId);
    const spot = await this.getParkingSpot(booking.spotId);
    
    return {
      ...booking,
      user,
      spot,
    };
  }

  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    
    const booking: Booking = {
      id,
      userId: bookingData.userId,
      spotId: bookingData.spotId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      duration: bookingData.duration,
      totalPrice: bookingData.totalPrice,
      status: bookingData.status,
      createdAt: new Date().toISOString(),
    };
    
    this.bookings.set(id, booking);
    
    // Enrich with user and spot information before returning
    const user = await this.getUser(booking.userId);
    const spot = await this.getParkingSpot(booking.spotId);
    
    return {
      ...booking,
      user,
      spot,
    };
  }

  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking: Booking = {
      ...booking,
      ...bookingData,
      // Don't overwrite these fields accidentally
      id: booking.id,
      createdAt: booking.createdAt,
    };
    
    this.bookings.set(id, updatedBooking);
    
    // Enrich with user and spot information before returning
    const user = await this.getUser(updatedBooking.userId);
    const spot = await this.getParkingSpot(updatedBooking.spotId);
    
    return {
      ...updatedBooking,
      user,
      spot,
    };
  }

  async deleteBooking(id: number): Promise<boolean> {
    // Instead of deleting, we'll just mark it as cancelled
    const booking = await this.getBooking(id);
    if (!booking) return false;
    
    await this.updateBooking(id, { status: "CANCELLED" });
    return true;
  }

  async listBookings(): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    const enrichedBookings: Booking[] = [];
    
    for (const booking of bookings) {
      const user = await this.getUser(booking.userId);
      const spot = await this.getParkingSpot(booking.spotId);
      
      enrichedBookings.push({
        ...booking,
        user,
        spot,
      });
    }
    
    return enrichedBookings;
  }

  async getUserBookings(userId: number): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
    const enrichedBookings: Booking[] = [];
    
    for (const booking of bookings) {
      const user = await this.getUser(booking.userId);
      const spot = await this.getParkingSpot(booking.spotId);
      
      enrichedBookings.push({
        ...booking,
        user,
        spot,
      });
    }
    
    return enrichedBookings;
  }

  async getBookingsForSpot(spotId: number, date: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(
      booking => booking.spotId === spotId && booking.date === date && booking.status !== "CANCELLED"
    );
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeBookings: number;
    occupiedSpots: number;
    revenueToday: number;
    occupancyByHour: { hour: string; count: number }[];
    recentBookings: {
      id: number;
      userName: string;
      spotNumber: string;
      time: string;
      status: string;
    }[];
  }> {
    const allUsers = await this.listUsers();
    const allBookings = await this.listBookings();
    const allSpots = await this.listParkingSpots();
    
    const today = new Date().toISOString().split('T')[0];
    
    const activeBookings = allBookings.filter(
      booking => booking.status === "CONFIRMED" || booking.status === "PENDING"
    );
    
    const occupiedSpots = allSpots.filter(spot => !spot.isAvailable).length;
    
    const todayBookings = allBookings.filter(
      booking => booking.date === today && booking.status !== "CANCELLED"
    );
    
    const revenueToday = todayBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    
    // Create occupancy by hour of day
    const occupancyByHour: { hour: string; count: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const hour = i.toString().padStart(2, "0");
      const count = allBookings.filter(booking => {
        if (booking.status === "CANCELLED") return false;
        const [startHour] = booking.startTime.split(":").map(Number);
        return startHour === i;
      }).length;
      
      occupancyByHour.push({ hour: `${hour}:00`, count });
    }
    
    // Get recent bookings
    const recentBookings = allBookings
      .filter(booking => booking.user && booking.spot)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(booking => ({
        id: booking.id,
        userName: booking.user?.name || "Unknown",
        spotNumber: booking.spot?.spotNumber || "Unknown",
        time: `${booking.date}, ${booking.startTime}`,
        status: booking.status === "CONFIRMED" 
          ? "Active" 
          : booking.status === "PENDING" 
          ? "Upcoming" 
          : booking.status === "COMPLETED" 
          ? "Completed"
          : "Cancelled",
      }));
    
    return {
      totalUsers: allUsers.length,
      activeBookings: activeBookings.length,
      occupiedSpots,
      revenueToday,
      occupancyByHour,
      recentBookings,
    };
  }
}

export const storage = new MemStorage();
