import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Booking } from "@shared/schema";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

export function MyBookingsTab() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings/my-bookings"],
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest("DELETE", `/api/bookings/${bookingId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/my-bookings"] });
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "Could not cancel booking",
        variant: "destructive",
      });
    },
  });

  const handleCancelBooking = (id: number) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      cancelMutation.mutate(id);
    }
  };

  const formatBookingTime = (booking: Booking) => {
    if (!booking.startTime || !booking.endTime) return "";
    return `${booking.startTime} - ${booking.endTime}`;
  };

  const formatBookingDate = (date: string) => {
    return format(parseISO(date), "MMM dd, yyyy");
  };

  if (!isAuthenticated) {
    return (
      <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your bookings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold">My Bookings</h2>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading your bookings...</div>
        ) : bookings && bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">B{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.spot?.spotNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBookingDate(booking.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBookingTime(booking)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === "CONFIRMED" 
                          ? "bg-green-100 text-green-800" 
                          : booking.status === "COMPLETED" 
                          ? "bg-gray-100 text-gray-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.status === "CONFIRMED" ? (
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-gray-500">
            You don't have any bookings yet.
          </div>
        )}
        
        {bookings && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
            Showing {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </div>
        )}
      </div>
    </div>
  );
}
