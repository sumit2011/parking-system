import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Booking, ParkingSpot } from "@shared/schema";
import { ParkingGrid } from "../parking/ParkingGrid";
import { BookingForm } from "../parking/BookingForm";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export function FindParkingTab() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState<string>("10:00");
  const [duration, setDuration] = useState<string>("1");
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

  const { data: spots, isLoading, refetch } = useQuery<ParkingSpot[]>({
    queryKey: ["/api/parking/spots", date, startTime, duration],
    enabled: !!date && !!startTime && !!duration,
  });

  // Update time to current time when component loads
  useEffect(() => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setStartTime(`${hours}:${minutes}`);
  }, []);

  const handleSearch = () => {
    if (!date || !startTime || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to search for available spots",
        variant: "destructive",
      });
      return;
    }
    
    refetch();
    setSelectedSpot(null);
  };

  const handleSelectSpot = (spot: ParkingSpot) => {
    setSelectedSpot(spot);
  };

  const handleBook = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a parking spot",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSpot) {
      toast({
        title: "No Spot Selected",
        description: "Please select a parking spot first",
        variant: "destructive",
      });
      return;
    }

    try {
      const bookingData = {
        spotId: selectedSpot.id,
        date,
        startTime,
        duration: parseInt(duration),
      };

      await apiRequest("POST", "/api/bookings", bookingData);
      
      toast({
        title: "Booking Successful",
        description: `You've successfully booked spot ${selectedSpot.spotNumber} on ${date}`,
      });

      // Reset selection and refresh available spots
      setSelectedSpot(null);
      refetch();
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Could not complete booking",
        variant: "destructive",
      });
    }
  };

  const endTime = (() => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes, 0);
    endDate.setHours(endDate.getHours() + parseInt(duration || "0"));
    return `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  })();

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Find Available Parking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="parking-date">
              Date
            </label>
            <input
              className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              id="parking-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="parking-time">
              Start Time
            </label>
            <input
              className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              id="parking-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="parking-duration">
              Duration (hours)
            </label>
            <select
              className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              id="parking-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="24">24</option>
            </select>
          </div>
        </div>
        
        <button
          className="w-full bg-primary text-white font-medium py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={handleSearch}
        >
          Search Available Spots
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Parking Map</h2>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Occupied</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Selected</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: "500px" }}>
          {isLoading ? (
            <div className="text-center py-8">Loading parking spots...</div>
          ) : spots && spots.length > 0 ? (
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-medium mb-4">Main Parking Area - Level 1</h3>
              <ParkingGrid 
                spots={spots.filter(spot => spot.level === 1)} 
                selectedSpot={selectedSpot} 
                onSelectSpot={handleSelectSpot} 
              />

              <h3 className="text-lg font-medium mb-4 mt-6">Main Parking Area - Level 2</h3>
              <ParkingGrid 
                spots={spots.filter(spot => spot.level === 2)} 
                selectedSpot={selectedSpot} 
                onSelectSpot={handleSelectSpot} 
              />
            </div>
          ) : (
            <div className="text-center py-8">
              {spots?.length === 0 
                ? "No parking spots available for the selected time and date." 
                : "Please select a date and time to view available parking spots."}
            </div>
          )}
        </div>

        {selectedSpot && (
          <BookingForm
            spot={selectedSpot}
            date={date}
            startTime={startTime}
            endTime={endTime}
            price={selectedSpot.pricePerHour * parseInt(duration)}
            onBook={handleBook}
          />
        )}
      </div>
    </div>
  );
}
