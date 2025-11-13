import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import {
  getIndicators,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  CreateIndicatorData,
} from "@/services/indicators-service";
import { getUnits } from "@/services/units-service";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { checkIndicatorUsage } from "@/services/validation-service";

const Indicators = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);
  const [deletingIndicator, setDeletingIndicator] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<string[]>([]);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [formData, setFormData] = useState<CreateIndicatorData>({
    code: "",
    name: "",
    description: "",
    owner_unit_id: 0,
    unit_of_measure: "",
    active: true,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const selectedUnitId = useMemo(() => {
    return unitFilter === "all" ? undefined : Number(unitFilter);
  }, [unitFilter]);

  const indicatorsQuery = useQuery({
    queryKey: ["indicators", selectedUnitId, debouncedSearch],
    queryFn: () =>
      getIndicators({
        unitId: selectedUnitId,
        search: debouncedSearch || undefined,
      }),
    enabled: !checking && !!session,
  });

  const createMutation = useMutation({
    mutationFn: createIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
      setIsCreateDialogOpen(false);
      setFormData({
        code: "",
        name: "",
        description: "",
        owner_unit_id: 0,
        unit_of_measure: "",
        active: true,
      });
      toast.success("Indicator created successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          (error.response?.data?.code && error.response.data.code[0]) ||
                          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                          error.message || 
                          "Failed to create indicator";
      toast.error(errorMessage);
      console.error("Create indicator error:", error.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateIndicatorData>;
    }) => updateIndicator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
      setEditingIndicator(null);
      toast.success("Indicator updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update indicator");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIndicator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicators"] });
      toast.success("Indicator deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete indicator error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Failed to delete indicator";
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to delete this indicator";
      } else if (error.response?.status === 404) {
        errorMessage = "Indicator not found";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 
                     error.response?.data?.error || 
                     "Cannot delete indicator - it may be in use";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while deleting indicator. This may be due to the indicator being referenced by other data (plans, reports, etc.). Please contact your administrator.";
      } else {
        errorMessage = 
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.response?.data?.message ||
          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
          error.message ||
          "Failed to delete indicator";
      }
      
      toast.error(errorMessage);
    },
  });

  const handleCreate = () => {
    if (!formData.code || !formData.name || !formData.owner_unit_id || formData.owner_unit_id === 0) {
      toast.error("Please fill in all required fields (code, name, and owner unit)");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (indicator: any) => {
    setEditingIndicator(indicator);
    setFormData({
      code: indicator.code,
      name: indicator.name,
      description: indicator.description || "",
      owner_unit_id: indicator.ownerUnit.id,
      unit_of_measure: indicator.unitOfMeasure || "",
      active: indicator.active,
    });
  };

  const handleUpdate = () => {
    if (!editingIndicator) return;
    updateMutation.mutate({ id: editingIndicator.id, data: formData });
  };

  const handleDeleteClick = async (indicator: any) => {
    setDeletingIndicator(indicator);
    setCheckingUsage(true);
    setDeleteDialogOpen(true);
    
    try {
      const usage = await checkIndicatorUsage(indicator.id);
      const dependencies: string[] = [];
      
      if (usage.usedInPlans > 0) {
        dependencies.push(`Used in ${usage.usedInPlans} annual plan(s)`);
      }
      if (usage.usedInReports > 0) {
        dependencies.push(`Used in ${usage.usedInReports} quarterly report(s)`);
      }
      if (usage.usedInPerformanceData > 0) {
        dependencies.push(`Has ${usage.usedInPerformanceData} performance data entries`);
      }
      
      setDeleteDependencies(dependencies);
    } catch (error) {
      console.error("Error checking indicator usage:", error);
      // Continue with deletion dialog even if usage check fails
      setDeleteDependencies([]);
    } finally {
      setCheckingUsage(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingIndicator) {
      deleteMutation.mutate(deletingIndicator.id);
      setDeleteDialogOpen(false);
      setDeletingIndicator(null);
      setDeleteDependencies([]);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeletingIndicator(null);
    setDeleteDependencies([]);
  };

  const canCreateIndicators = !!session?.user;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Indicators</h1>
            <p className="text-muted-foreground mt-1">
              Browse key performance indicators and their measuring units.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by code or name"
              className="md:w-64"
            />
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="md:w-56">
                <SelectValue placeholder="Filter by unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {unitsQuery.data?.map((unit) => (
                  <SelectItem key={unit.id} value={String(unit.id)}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canCreateIndicators && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Indicator
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Indicator Catalogue</CardTitle>
            <CardDescription>
              {selectedUnitId
                ? "Filtered by selected unit."
                : "Showing indicators you are permitted to access."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {indicatorsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Status</TableHead>
                    {canCreateIndicators && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indicatorsQuery.data && indicatorsQuery.data.length > 0 ? (
                    indicatorsQuery.data.map((indicator) => (
                      <TableRow key={indicator.id}>
                        <TableCell className="font-medium">
                          {indicator.code}
                        </TableCell>
                        <TableCell>{indicator.name}</TableCell>
                        <TableCell>{indicator.unitOfMeasure || "—"}</TableCell>
                        <TableCell>{indicator.ownerUnit.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              indicator.active ? "outline" : "destructive"
                            }
                          >
                            {indicator.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {canCreateIndicators && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(indicator)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(indicator)}
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
                        colSpan={canCreateIndicators ? 6 : 5}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No indicators match the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {indicatorsQuery.error ? (
              <p className="text-sm text-destructive mt-4">
                Unable to load indicators. Please try again later.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Create Indicator Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Indicator</DialogTitle>
              <DialogDescription>
                Create a new key performance indicator.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="e.g., IND-001"
                />
              </div>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner_unit_id">Owner Unit *</Label>
                <Select
                  value={String(formData.owner_unit_id)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, owner_unit_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsQuery.data?.map((unit) => (
                      <SelectItem key={unit.id} value={String(unit.id)}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                <Input
                  id="unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_of_measure: e.target.value,
                    })
                  }
                  placeholder="e.g., Percentage, Number, etc."
                />
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
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Indicator"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Indicator Dialog */}
        <Dialog
          open={!!editingIndicator}
          onOpenChange={() => setEditingIndicator(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Indicator</DialogTitle>
              <DialogDescription>
                Update indicator information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_code">Code *</Label>
                <Input
                  id="edit_code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
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
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_unit_of_measure">Unit of Measure</Label>
                <Input
                  id="edit_unit_of_measure"
                  value={formData.unit_of_measure}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      unit_of_measure: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingIndicator(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Indicator"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Indicator"
          description="Are you sure you want to delete this indicator? This action cannot be undone."
          itemName={deletingIndicator ? `${deletingIndicator.code} - ${deletingIndicator.name}` : ""}
          isLoading={deleteMutation.isPending}
          dependencies={deleteDependencies}
          warningMessage={deleteDependencies.length > 0 ? "Deleting this indicator may cause data integrity issues in related plans and reports." : undefined}
        />
      </div>
    </DashboardLayout>
  );
};

export default Indicators;
