import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@shared/schema";
import { Search, Eye, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function BookingsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return await apiRequest("DELETE", `/api/admin/bookings/${bookingId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully",
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

  const viewBooking = (booking: Booking) => {
    setViewingBooking(booking);
  };

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = 
      booking.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      booking.spot?.spotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `B${booking.id}`.includes(searchTerm);
    
    const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatBookingDate = (date: string) => {
    return format(parseISO(date), "MMM dd, yyyy");
  };

  return (
    <main className="p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Bookings</h2>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 text-gray-400 absolute top-3 left-3" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">Loading bookings...</div>
          ) : filteredBookings && filteredBookings.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spot</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">B{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.user?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.spot?.spotNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBookingDate(booking.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.startTime} - {booking.endTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        booking.status === "CONFIRMED" 
                          ? "bg-green-100 text-green-800" 
                          : booking.status === "COMPLETED" 
                          ? "bg-gray-100 text-gray-800" 
                          : booking.status === "PENDING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        onClick={() => viewBooking(booking)}
                      >
                        <Eye className="h-4 w-4 inline" /> View
                      </button>
                      {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
                        <button 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-4 w-4 inline" /> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              No bookings found matching your criteria.
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredBookings?.length || 0}</span> bookings
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={!!viewingBooking} onOpenChange={() => setViewingBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {viewingBooking && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Booking ID</div>
                  <div>B{viewingBooking.id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      viewingBooking.status === "CONFIRMED" 
                        ? "bg-green-100 text-green-800" 
                        : viewingBooking.status === "COMPLETED" 
                        ? "bg-gray-100 text-gray-800" 
                        : viewingBooking.status === "PENDING"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {viewingBooking.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">User</div>
                  <div>{viewingBooking.user?.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div>{viewingBooking.user?.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Spot</div>
                  <div>{viewingBooking.spot?.spotNumber}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Spot Type</div>
                  <div>{viewingBooking.spot?.type}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Date</div>
                  <div>{formatBookingDate(viewingBooking.date)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Time</div>
                  <div>{viewingBooking.startTime} - {viewingBooking.endTime}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Duration</div>
                  <div>{viewingBooking.duration} hours</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Price</div>
                  <div>₹{viewingBooking.totalPrice.toFixed(2)}</div>
                </div>
              </div>
              
              {(viewingBooking.status === "CONFIRMED" || viewingBooking.status === "PENDING") && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    handleCancelBooking(viewingBooking.id);
                    setViewingBooking(null);
                  }}
                  disabled={cancelMutation.isPending}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
