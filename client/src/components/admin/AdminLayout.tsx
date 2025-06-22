import { useState, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Car, LayoutDashboard, Calendar, MapPin, Users, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type Tab = "dashboard" | "bookings" | "spots" | "users";

interface AdminLayoutProps {
  children: ({ activeTab }: { activeTab: Tab }) => ReactNode;
  defaultTab?: Tab;
}

export function AdminLayout({ children, defaultTab = "dashboard" }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setMobileOpen(false); // auto-close on mobile
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

  const menuItemClass = (tab: Tab) =>
    `flex items-center px-4 py-2 ${
      activeTab === tab
        ? "text-white bg-slate-800"
        : "text-gray-300 hover:bg-slate-800 hover:text-white"
    }`;

  const SidebarContent = () => (
    <div className="h-full bg-slate-900 text-white flex flex-col w-full">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          {/* <Car className="h-8 w-8 text-blue-400" /> */}
          {!collapsed && <span className="ml-2 text-xl font-semibold">🚘 QuickPark</span>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 ml-2 hidden md:block">
          <Menu className="h-5 w-5" />
        </button>
        <button onClick={() => setMobileOpen(false)} className="text-gray-400 ml-2 md:hidden">
          <X className="h-6 w-6" />
        </button>
      </div>
      {!collapsed && <div className="mt-2 px-4 text-gray-400 text-sm">Admin Panel</div>}

      <nav className="mt-6 flex-1">
        {!collapsed && (
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
            Management
          </div>
        )}

        <a href="#" className={menuItemClass("dashboard")} onClick={(e) => { e.preventDefault(); handleTabChange("dashboard"); }}>
          <LayoutDashboard className="h-5 w-5 mr-2" />
          {!collapsed && "Dashboard"}
        </a>

        <a href="#" className={menuItemClass("bookings")} onClick={(e) => { e.preventDefault(); handleTabChange("bookings"); }}>
          <Calendar className="h-5 w-5 mr-2" />
          {!collapsed && "Bookings"}
        </a>

        <a href="#" className={menuItemClass("spots")} onClick={(e) => { e.preventDefault(); handleTabChange("spots"); }}>
          <MapPin className="h-5 w-5 mr-2" />
          {!collapsed && "Parking Spots"}
        </a>

        <a href="#" className={menuItemClass("users")} onClick={(e) => { e.preventDefault(); handleTabChange("users"); }}>
          <Users className="h-5 w-5 mr-2" />
          {!collapsed && "Users"}
        </a>

        {!collapsed && (
          <div className="px-4 py-2 mt-6 text-xs text-gray-400 uppercase tracking-wider">
            Account
          </div>
        )}
        <a href="#" className="flex items-center px-4 py-2 text-gray-300 hover:bg-slate-800 hover:text-white" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
          <LogOut className="h-5 w-5 mr-2" />
          {!collapsed && "Logout"}
        </a>
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <div className={`hidden md:block transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
        <SidebarContent />
      </div>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-64 bg-slate-900">
            <SidebarContent />
          </div>
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setMobileOpen(false)}
          ></div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-background border-b shadow">
          <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button className="md:hidden" onClick={() => setMobileOpen(true)}>
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-foreground">{tabTitle[activeTab]}</h1>
            </div>
            <div className="flex items-center">
              <ThemeToggle />
              <span className="mx-2 text-muted-foreground hidden sm:block">Admin User</span>
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
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
