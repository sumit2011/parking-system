import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ParkingSpot } from "@shared/schema";
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Find Available Parking</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label htmlFor="parking-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Date
            </label>
            <input
              id="parking-date"
              type="date"
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div>
            <label htmlFor="parking-time" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Start Time
            </label>
            <input
              id="parking-time"
              type="time"
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="parking-duration" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Duration (hours)
            </label>
            <select
              id="parking-duration"
              className="w-full rounded-xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 24].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold text-sm transition duration-150"
          onClick={handleSearch}
        >
          Search Available Spots
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Parking Map</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span> Available
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500 rounded-full"></span> Occupied
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-500 rounded-full"></span> Selected
            </div>
          </div>
        </div>

        <div >
          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading parking spots...</div>
          ) : spots && spots.length > 0 ? (
            <div className="space-y-6">
              {[
                { level: 1, title: "Main Parking Area - Srinagar" },
                { level: 2, title: "Main Parking Area - Pahalgam" },
                { level: 3, title: "Main Parking Area - Sonmarg" },
              ].map(({ level, title }) => (
                <div key={level}>
                  <h3 className="text-md font-medium mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
                  <ParkingGrid
                    spots={spots.filter((spot) => spot.level === level)}
                    selectedSpot={selectedSpot}
                    onSelectSpot={handleSelectSpot}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {spots?.length === 0
                ? "No parking spots available for the selected time and date."
                : "Please select a date and time to view available parking spots."}
            </div>
          )}
        </div>

        {selectedSpot && (
          <div className="mt-8">
            <BookingForm
              spot={selectedSpot}
              date={date}
              startTime={startTime}
              endTime={endTime}
              price={selectedSpot.pricePerHour * parseInt(duration)}
              onBook={handleBook}
            />
          </div>
        )}
      </div>
    </div>
  );
}
