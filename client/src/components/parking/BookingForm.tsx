import { useAuth } from "@/contexts/AuthContext";
import { ParkingSpot } from "@shared/schema";
import { format, parseISO } from "date-fns";

interface BookingFormProps {
  spot: ParkingSpot;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  onBook: () => void;
}

export function BookingForm({ spot, date, startTime, endTime, price, onBook }: BookingFormProps) {
  const { isAuthenticated } = useAuth();

  const formattedDate = (() => {
    try {
      return format(parseISO(date), "MMMM dd, yyyy");
    } catch (e) {
      return date;
    }
  })();

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Booking Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Spot Selected:</p>
          <p className="font-semibold">{spot.spotNumber}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Date:</p>
          <p className="font-semibold">{formattedDate}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Time:</p>
          <p className="font-semibold">{startTime} - {endTime}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price:</p>
          <p className="font-semibold">${price.toFixed(2)}</p>
        </div>
      </div>
      <button 
        className={`w-full bg-primary text-white font-medium py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
          !isAuthenticated ? "opacity-50 cursor-not-allowed" : ""
        }`}
        onClick={onBook}
        disabled={!isAuthenticated}
      >
        {isAuthenticated ? "Book Now" : "Please Log In to Book"}
      </button>
    </div>
  );
}
