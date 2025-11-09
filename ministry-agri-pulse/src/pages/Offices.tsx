import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getUnits, createUnit, updateUnit, deleteUnit, CreateUnitData } from "@/services/units-service";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", type: "STRATEGIC", parent: null });
      toast.success("Office created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create office");
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
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete office");
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.type) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      type: unit.type,
      parent: unit.parentName ? unitsQuery.data?.find(u => u.name === unit.parentName)?.id || null : null,
    });
  };

  const handleUpdate = () => {
    if (!editingUnit) return;
    updateMutation.mutate({ id: editingUnit.id, data: formData });
  };

  const canCreateOffices = session?.user?.role === "SUPERADMIN";

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
              <Button onClick={() => setIsCreateDialogOpen(true)}>
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
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this office?")) {
                                    deleteMutation.mutate(unit.id);
                                  }
                                }}
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
                  value={formData.parent ? String(formData.parent) : ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent: value ? Number(value) : null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
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
                  value={formData.parent ? String(formData.parent) : ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent: value ? Number(value) : null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent office" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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
      </div>
    </DashboardLayout>
  );
};

export default Offices;
