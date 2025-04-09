declare module 'bcrypt';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Override the User type to allow string for createdAt when using in-memory storage
import { User as OriginalUser, Booking as OriginalBooking } from '../shared/schema';

declare global {
  interface User extends Omit<OriginalUser, 'createdAt'> {
    createdAt: string | Date;
  }
  
  interface Booking extends Omit<OriginalBooking, 'createdAt'> {
    createdAt: string | Date;
    user?: User;
    spot?: ParkingSpot;
  }
}