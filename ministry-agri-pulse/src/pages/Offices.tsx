import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getUnits, createUnit, updateUnit, deleteUnit, forceDeleteUnit, CreateUnitData } from "@/services/units-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { checkOfficeUsage } from "@/services/validation-service";

const typeLabels: Record<string, string> = {
  STRATEGIC: "Strategic Affairs Office",
  STATE_MINISTER: "State Minister Office",
  ADVISOR: "State Minister Advisor Office",
};

const Offices = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [deletingUnit, setDeletingUnit] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<string[]>([]);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [formData, setFormData] = useState<CreateUnitData>({
    name: "",
    type: "STRATEGIC",
    parent: null,
  });

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const filteredUnits = unitsQuery.data?.filter((unit) =>
    typeFilter === "all" ? true : unit.type === typeFilter
  );

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: (data) => {
      console.log("Office created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", type: "STRATEGIC", parent: null });
      toast.success("Office created successfully");
    },
    onError: (error: any) => {
      console.error("Create office error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Failed to create office";
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.name && Array.isArray(errorData.name)) {
          errorMessage = `Name: ${errorData.name.join(', ')}`;
        } else if (errorData.type && Array.isArray(errorData.type)) {
          errorMessage = `Type: ${errorData.type.join(', ')}`;
        } else if (errorData.parent && Array.isArray(errorData.parent)) {
          errorMessage = `Parent: ${errorData.parent.join(', ')}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const fieldErrors = Object.entries(errorData).map(([field, errors]) => {
            const errorList = Array.isArray(errors) ? errors : [errors];
            return `${field}: ${errorList.join(', ')}`;
          });
          errorMessage = fieldErrors.join('; ');
        }
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to create offices";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while creating office. Please contact your administrator.";
      } else {
        errorMessage = error.response?.data?.error || 
                     error.response?.data?.detail ||
                     error.message || 
                     "Failed to create office";
      }
      
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CreateUnitData }) =>
      updateUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setEditingUnit(null);
      toast.success("Office updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update office");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Office deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingUnit(null);
      setDeleteDependencies([]);
    },
    onError: (error: any) => {
      console.error("Delete office error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Failed to delete office";
      
      // Check if it's a server crash (HTML response) or ServerCrashError
      if ((error.response?.data && typeof error.response.data === 'string' && 
          error.response.data.includes('<!DOCTYPE html>')) || error.name === 'ServerCrashError') {
        errorMessage = "Server crashed while deleting office. The backend returned an HTML error page, indicating a server-side issue. This usually happens when the office has associated data (users, plans, reports). Try using 'Force Delete' instead to handle dependencies automatically.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to delete this office";
      } else if (error.response?.status === 404) {
        errorMessage = "Office not found";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 
                     error.response?.data?.error || 
                     "Cannot delete office - it may have associated data";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while deleting office. This may be due to the office having associated users, plans, or reports. Try using 'Force Delete' to handle dependencies automatically.";
      } else {
        errorMessage = 
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
          error.message ||
          "Failed to delete office";
      }
      
      toast.error(errorMessage, {
        duration: 8000, // Show longer for complex error messages
      });
    },
  });

  const forceDeleteMutation = useMutation({
    mutationFn: forceDeleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast.success("Office and all associated data removed successfully! Dependencies were handled automatically.");
      setDeleteDialogOpen(false);
      setDeletingUnit(null);
      setDeleteDependencies([]);
    },
    onError: (error: any) => {
      console.error("Force delete office error:", error);
      let errorMessage = "Failed to force delete office";
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to force delete this office";
      } else if (error.response?.status === 404) {
        errorMessage = "Office not found";
      } else if (error.name === 'CascadeDeleteNotSupported') {
        errorMessage = "The backend doesn't support automatic cascade deletion. You may need to manually remove the associated users, plans, and reports first, then try deleting the office again.";
      } else if (error.name === 'AllDeletionMethodsFailed') {
        errorMessage = "All deletion methods failed. This office has complex dependencies that require manual intervention. Please contact your administrator or manually remove the associated data first.";
      } else if (error.message && error.message.includes('Attempted endpoints')) {
        errorMessage = `Force delete not supported by the backend. ${error.message}`;
      } else {
        errorMessage = error.response?.data?.detail || 
                     error.response?.data?.error || 
                     error.message ||
                     "Force delete failed. The backend may not support cascade deletion.";
      }
      
      toast.error(errorMessage, {
        duration: 8000, // Show longer for complex error messages
      });
    },
  });

  const handleCreate = () => {
    console.log("Creating office with data:", formData);
    console.log("Current session:", session?.user);
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      toast.error("Please enter a valid office name");
      return;
    }
    if (!formData.type) {
      toast.error("Please select an office type");
      return;
    }
    
    // Prepare the data to send
    const dataToSend = {
      name: formData.name.trim(),
      type: formData.type,
      parent: formData.parent || null,
    };
    
    console.log("Sending office data:", dataToSend);
    createMutation.mutate(dataToSend);
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      type: unit.type,
      parent: unit.parent || null,
    });
  };

  const handleUpdate = () => {
    if (!editingUnit) return;
    updateMutation.mutate({ id: editingUnit.id, data: formData });
  };

  const handleDeleteClick = async (unit: any) => {
    setDeletingUnit(unit);
    setCheckingUsage(true);
    setDeleteDialogOpen(true);
    
    try {
      const usage = await checkOfficeUsage(unit.id);
      const dependencies: string[] = [];
      
      if (usage.hasUsers > 0) {
        dependencies.push(`Has ${usage.hasUsers} associated user(s)`);
      }
      if (usage.hasPlans > 0) {
        dependencies.push(`Has ${usage.hasPlans} annual plan(s)`);
      }
      if (usage.hasReports > 0) {
        dependencies.push(`Has ${usage.hasReports} quarterly report(s)`);
      }
      if (usage.hasChildOffices > 0) {
        dependencies.push(`Has ${usage.hasChildOffices} child office(s)`);
      }
      
      setDeleteDependencies(dependencies);
    } catch (error) {
      console.error("Error checking office usage:", error);
      // Continue with deletion dialog even if usage check fails
      setDeleteDependencies([]);
    } finally {
      setCheckingUsage(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingUnit) {
      deleteMutation.mutate(deletingUnit.id);
      setDeleteDialogOpen(false);
      setDeletingUnit(null);
      setDeleteDependencies([]);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingUnit(null);
    setDeleteDependencies([]);
  };

  const handleForceDelete = () => {
    if (deletingUnit) {
      forceDeleteMutation.mutate(deletingUnit.id);
    }
  };

  // Allow all authenticated users to create offices for now
  const canCreateOffices = !!session?.user;

  // Show loading state while checking authentication
  if (checking) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Offices</h1>
            <p className="text-muted-foreground mt-1">
              Explore the organisational structure of the Ministry and its
              reporting offices.
            </p>
          </div>
          <div className="flex gap-2">
            {canCreateOffices && (
              <Button onClick={() => {
                console.log("Create Office button clicked");
                console.log("Current session:", session?.user);
                console.log("Can create offices:", canCreateOffices);
                setIsCreateDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Office
              </Button>
            )}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-64">
              <SelectValue placeholder="Filter by office type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Office Types</SelectItem>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organisational Units</CardTitle>
            <CardDescription>
              Units are grouped by their role within the ministry hierarchy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unitsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Child Offices</TableHead>
                    <TableHead>Assigned Users</TableHead>
                    {canCreateOffices && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnits && filteredUnits.length > 0 ? (
                    filteredUnits.map((unit) => (
                      <TableRow key={unit.id}>
                        <TableCell className="font-medium">
                          {unit.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeLabels[unit.type] ?? unit.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{unit.parentName ?? "—"}</TableCell>
                        <TableCell>{unit.childrenCount ?? 0}</TableCell>
                        <TableCell>{unit.usersCount ?? 0}</TableCell>
                        {canCreateOffices && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(unit)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(unit)}
                                disabled={deleteMutation.isPending || checkingUsage}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={canCreateOffices ? 6 : 5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No offices match the selected filter.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {unitsQuery.error ? (
              <p className="text-sm text-destructive mt-4">
                Unable to load offices. Please try again later.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Create Office Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Office</DialogTitle>
              <DialogDescription>
                Create a new organizational unit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parent">Parent Office (Optional)</Label>
                <Select
                  value={formData.parent ? String(formData.parent) : "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent: value === "none" ? null : Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {unitsQuery.data?.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  console.log("Create Office form button clicked");
                  handleCreate();
                }} 
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Office"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Office Dialog */}
        <Dialog open={!!editingUnit} onOpenChange={() => setEditingUnit(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Office</DialogTitle>
              <DialogDescription>
                Update office information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_parent">Parent Office (Optional)</Label>
                <Select
                  value={formData.parent ? String(formData.parent) : "none"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent: value === "none" ? null : Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {unitsQuery.data?.filter(u => u.id !== editingUnit?.id).map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUnit(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Office"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          onForceDelete={handleForceDelete}
          title="Delete Office"
          description="Are you sure you want to delete this office? This action cannot be undone."
          itemName={deletingUnit ? `${deletingUnit.name} (${typeLabels[deletingUnit.type] || deletingUnit.type})` : ""}
          isLoading={deleteMutation.isPending || forceDeleteMutation.isPending}
          dependencies={deleteDependencies}
          warningMessage={deleteDependencies.length > 0 ? "Deleting this office may cause data integrity issues for associated users, plans, and reports." : undefined}
          allowForceDelete={deleteDependencies.length > 0}
        />
      </div>
    </DashboardLayout>
  );
};

export default Offices;
