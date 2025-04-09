import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Dashboard } from "@/components/admin/Dashboard";
import { BookingsManagement } from "@/components/admin/BookingsManagement";
import { ParkingSpotsManagement } from "@/components/admin/ParkingSpotsManagement";
import { UsersManagement } from "@/components/admin/UsersManagement";

export default function AdminApp() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if explicitly not authenticated (after loading)
    if (!isLoading && (!isAuthenticated || !user?.isAdmin)) {
      setLocation("/");
    }
  }, [isAuthenticated, user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // While we're loading, show a loading screen
  if (!isAuthenticated && isLoading) {
    return <div className="flex items-center justify-center h-screen">Checking authentication...</div>;
  }

  // If explicitly not authenticated or not admin, don't render the admin content
  if (!isAuthenticated || !user?.isAdmin) {
    return <div className="flex items-center justify-center h-screen">Access denied</div>;
  }

  return (
    <AdminLayout>
      {({ activeTab }) => (
        <>
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "bookings" && <BookingsManagement />}
          {activeTab === "spots" && <ParkingSpotsManagement />}
          {activeTab === "users" && <UsersManagement />}
        </>
      )}
    </AdminLayout>
  );
}
