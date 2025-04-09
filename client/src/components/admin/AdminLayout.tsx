import { useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { PlusCircle, LayoutDashboard, Calendar, MapPin, Users, LogOut } from "lucide-react";

type Tab = "dashboard" | "bookings" | "spots" | "users";

interface AdminLayoutProps {
  children: ReactNode;
  defaultTab?: Tab;
}

export function AdminLayout({ children, defaultTab = "dashboard" }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const tabTitle = {
    dashboard: "Dashboard",
    bookings: "Bookings",
    spots: "Parking Spots",
    users: "Users",
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <div className="flex items-center">
            <PlusCircle className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-semibold">ParkSmart</span>
          </div>
          <div className="mt-2 text-gray-400 text-sm">Admin Panel</div>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
            Management
          </div>
          <a 
            href="#" 
            className={`block px-4 py-2 ${activeTab === "dashboard" ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
            onClick={(e) => { 
              e.preventDefault();
              handleTabChange("dashboard");
            }}
          >
            <div className="flex items-center">
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Dashboard
            </div>
          </a>
          <a 
            href="#" 
            className={`block px-4 py-2 ${activeTab === "bookings" ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
            onClick={(e) => { 
              e.preventDefault();
              handleTabChange("bookings");
            }}
          >
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Bookings
            </div>
          </a>
          <a 
            href="#" 
            className={`block px-4 py-2 ${activeTab === "spots" ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
            onClick={(e) => { 
              e.preventDefault();
              handleTabChange("spots");
            }}
          >
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Parking Spots
            </div>
          </a>
          <a 
            href="#" 
            className={`block px-4 py-2 ${activeTab === "users" ? "text-white bg-gray-700" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
            onClick={(e) => { 
              e.preventDefault();
              handleTabChange("users");
            }}
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users
            </div>
          </a>
          
          <div className="px-4 py-2 mt-6 text-xs text-gray-400 uppercase tracking-wider">
            Account
          </div>
          <a 
            href="#" 
            className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={(e) => { 
              e.preventDefault();
              handleLogout();
            }}
          >
            <div className="flex items-center">
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </div>
          </a>
        </nav>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">{tabTitle[activeTab]}</h1>
            <div className="flex items-center">
              <span className="mr-2 text-gray-600">Admin User</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        {children({ activeTab })}
      </div>
    </div>
  );
}
