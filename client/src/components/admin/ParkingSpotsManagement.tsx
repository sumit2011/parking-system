import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ParkingSpot } from "@shared/schema";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash } from "lucide-react";

const spotFormSchema = z.object({
  spotNumber: z.string().min(1, "Spot number is required"),
  level: z.number().min(1, "Level must be at least 1"),
  type: z.string().min(1, "Type is required"),
  pricePerHour: z.number().min(0, "Price must be non-negative"),
  isAvailable: z.boolean().default(true),
});

type SpotFormValues = z.infer<typeof spotFormSchema>;

export function ParkingSpotsManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<ParkingSpot | null>(null);
  const { toast } = useToast();

  const { data: spots, isLoading } = useQuery<ParkingSpot[]>({
    queryKey: ["/api/admin/spots"],
  });

  const form = useForm<SpotFormValues>({
    resolver: zodResolver(spotFormSchema),
    defaultValues: {
      spotNumber: "",
      level: 1,
      type: "STANDARD",
      pricePerHour: 3.0,
      isAvailable: true,
    },
  });

  const addSpotMutation = useMutation({
    mutationFn: async (data: SpotFormValues) => {
      return await apiRequest("POST", "/api/admin/spots", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spots"] });
      setIsAddModalOpen(false);
      form.reset();
      toast({
        title: "Spot Added",
        description: "The parking spot has been added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Spot",
        description: error instanceof Error ? error.message : "Could not add parking spot",
        variant: "destructive",
      });
    },
  });

  const updateSpotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SpotFormValues }) => {
      return await apiRequest("PUT", `/api/admin/spots/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spots"] });
      setEditingSpot(null);
      form.reset();
      toast({
        title: "Spot Updated",
        description: "The parking spot has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Update Spot",
        description: error instanceof Error ? error.message : "Could not update parking spot",
        variant: "destructive",
      });
    },
  });

  const deleteSpotMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/spots/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spots"] });
      toast({
        title: "Spot Deleted",
        description: "The parking spot has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Spot",
        description: error instanceof Error ? error.message : "Could not delete parking spot",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: SpotFormValues) => {
    if (editingSpot) {
      updateSpotMutation.mutate({ id: editingSpot.id, data: values });
    } else {
      addSpotMutation.mutate(values);
    }
  };

  const handleEditSpot = (spot: ParkingSpot) => {
    setEditingSpot(spot);
    form.reset({
      spotNumber: spot.spotNumber,
      level: spot.level,
      type: spot.type,
      pricePerHour: spot.pricePerHour,
      isAvailable: spot.isAvailable,
    });
  };

  const handleDeleteSpot = (id: number) => {
    if (window.confirm("Are you sure you want to delete this parking spot?")) {
      deleteSpotMutation.mutate(id);
    }
  };

  const openAddModal = () => {
    form.reset();
    setIsAddModalOpen(true);
  };

  const renderParkingGrid = (level: number) => {
    const levelSpots = spots?.filter(spot => spot.level === level) || [];
    
    return (
      <div className="grid grid-cols-8 gap-3 mb-6">
        {levelSpots.map(spot => (
          <div 
            key={spot.id}
            className={`rounded-lg shadow p-2 text-center text-white ${
              spot.isAvailable ? "bg-green-500" : "bg-red-500 opacity-75"
            }`}
          >
            <div className="font-bold">{spot.spotNumber}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="p-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Parking Spots Management</h2>
          <Button onClick={openAddModal}>
            Add New Spot
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">Loading parking spots...</div>
          ) : spots && spots.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Hour</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {spots.map((spot) => (
                  <tr key={spot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{spot.spotNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Level {spot.level}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{spot.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        spot.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {spot.isAvailable ? "Available" : "Occupied"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${spot.pricePerHour.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        onClick={() => handleEditSpot(spot)}
                      >
                        <Pencil className="h-4 w-4 inline mr-1" /> Edit
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteSpot(spot.id)}
                        disabled={deleteSpotMutation.isPending}
                      >
                        <Trash className="h-4 w-4 inline mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              No parking spots found. Add some spots to get started.
            </div>
          )}
        </div>
      </div>

      {/* Parking Map Overview */}
      {spots && spots.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Parking Map Overview</h2>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium mb-4">Level 1</h3>
            {renderParkingGrid(1)}

            <h3 className="text-md font-medium mb-4">Level 2</h3>
            {renderParkingGrid(2)}
          </div>
        </div>
      )}

      {/* Add/Edit Spot Modal */}
      <Dialog 
        open={isAddModalOpen || !!editingSpot} 
        onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingSpot(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSpot ? "Edit Parking Spot" : "Add New Parking Spot"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="spotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Spot Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. A1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Level 1</SelectItem>
                            <SelectItem value="2">Level 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STANDARD">Standard</SelectItem>
                            <SelectItem value="HANDICAPPED">Handicapped</SelectItem>
                            <SelectItem value="ELECTRIC">Electric Vehicle</SelectItem>
                            <SelectItem value="COMPACT">Compact</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pricePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Hour ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          value={field.value}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Available</FormLabel>
                      </div>
                      <FormControl>
                        <Select 
                          value={field.value ? "true" : "false"} 
                          onValueChange={(value) => field.onChange(value === "true")}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addSpotMutation.isPending || updateSpotMutation.isPending}
                >
                  {addSpotMutation.isPending || updateSpotMutation.isPending
                    ? "Saving..."
                    : editingSpot
                    ? "Update Spot"
                    : "Add Spot"
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
