import { ParkingSpot as ParkingSpotType } from "@shared/schema";

interface ParkingSpotProps {
  spot: ParkingSpotType;
  isSelected: boolean;
  onSelect: (spot: ParkingSpotType) => void;
}

export function ParkingSpot({ spot, isSelected, onSelect }: ParkingSpotProps) {
  const handleClick = () => {
    if (spot.isAvailable) {
      onSelect(spot);
    }
  };

  const getBackgroundColor = () => {
    if (isSelected) return "bg-yellow-500";
    if (spot.isAvailable) return "bg-green-500";
    return "bg-red-500 opacity-75";
  };

  return (
    <div
      className={`parking-spot ${getBackgroundColor()} text-white rounded-lg shadow p-3 text-center ${
        spot.isAvailable ? "cursor-pointer hover:bg-green-600" : ""
      } transition-all duration-200`}
      onClick={handleClick}
    >
      <div className="font-bold">{spot.spotNumber}</div>
      <div className="text-xs">
        {isSelected 
          ? "Selected" 
          : spot.isAvailable 
          ? "Available" 
          : "Occupied"}
      </div>
    </div>
  );
}
