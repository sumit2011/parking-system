import { useState } from "react";
import { FindParkingTab } from "./FindParkingTab";
import { MyBookingsTab } from "./MyBookingsTab";

export function UserTabs() {
  const [activeTab, setActiveTab] = useState("find-parking");

  return (
    <>
      <div className="bg-background shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-1 text-center font-medium ${
                activeTab === "find-parking"
                  ? "border-primary text-primary border-b-2"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("find-parking")}
            >
              Find Parking
            </button>
            <button
              className={`py-4 px-1 text-center font-medium ${
                activeTab === "my-bookings"
                  ? "border-primary text-primary border-b-2"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("my-bookings")}
            >
              My Bookings
            </button>
          </div>
        </div>
      </div>

      {activeTab === "find-parking" ? <FindParkingTab /> : <MyBookingsTab />}
    </>
  );
}
