import { ParkingSpot as ParkingSpotType } from "@shared/schema";
import { ParkingSpot } from "./ParkingSpot";

interface ParkingGridProps {
  spots: ParkingSpotType[];
  selectedSpot: ParkingSpotType | null;
  onSelectSpot: (spot: ParkingSpotType) => void;
}

export function ParkingGrid({ spots, selectedSpot, onSelectSpot }: ParkingGridProps) {
  if (!spots || spots.length === 0) {
    return <div className="text-center py-4 text-gray-500">No parking spots available for this level.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {spots.map((spot) => (
        <ParkingSpot
          key={spot.id}
          spot={spot}
          isSelected={selectedSpot?.id === spot.id}
          onSelect={onSelectSpot}
        />
      ))}
    </div>
  );
}
