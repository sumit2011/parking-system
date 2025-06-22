import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { User, Clock, Calendar, IndianRupee } from "lucide-react";
import { format, parseISO } from "date-fns";

interface DashboardData {
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
}

export function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return <div className="p-4 text-center">Loading dashboard data...</div>;
  }

  if (!data) {
    return <div className="p-4 text-center">Could not load dashboard data</div>;
  }

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "UPCOMING":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card */}
        {[
          {
            icon: <User className="h-6 w-6" />,
            bg: "bg-blue-100 text-primary",
            label: "Total Users",
            value: data.totalUsers,
          },
          {
            icon: <Calendar className="h-6 w-6" />,
            bg: "bg-green-100 text-green-500",
            label: "Active Bookings",
            value: data.activeBookings,
          },
          {
            icon: <Clock className="h-6 w-6" />,
            bg: "bg-red-100 text-red-500",
            label: "Occupied Spots",
            value: data.occupiedSpots,
          },
          {
            icon: <IndianRupee className="h-6 w-6" />,
            bg: "bg-yellow-100 text-yellow-500",
            label: "Revenue Today",
            value: `₹${data.revenueToday}`,
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow p-4 sm:p-6 flex items-center"
          >
            <div className={`p-3 rounded-full ${card.bg}`}>{card.icon}</div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-xl font-semibold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Occupancy Overview</h2>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.occupancyByHour}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings Table */}
        <div className="bg-white rounded-xl shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Spot</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-2 text-gray-900">{booking.userName}</td>
                    <td className="px-4 py-2 text-gray-500">{booking.spotNumber}</td>
                    <td className="px-4 py-2 text-gray-500">{booking.time}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right">
            <a href="#" className="text-primary hover:underline text-sm font-medium">
              View all bookings
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
