import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getUsers, createUser, updateUser, deleteUser, CreateUserData, UpdateUserData } from "@/services/users-service";
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
import { Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  STRATEGIC_AFFAIRS: "Strategic Affairs",
  STATE_MINISTER: "State Minister",
  ADVISOR: "State Minister Advisor",
};

const Users = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "STATE_MINISTER",
    unit_id: 0,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: !checking && !!session,
  });

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setIsCreateDialogOpen(false);
      setFormData({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "STATE_MINISTER",
        unit_id: 0,
      });
      toast.success("User created successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                          error.message || 
                          "Failed to create user";
      toast.error(errorMessage);
      console.error("Create user error:", error.response?.data || error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserData }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
      setFormData({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "STATE_MINISTER",
        unit_id: 0,
      });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                          error.message || 
                          "Failed to update user";
      toast.error(errorMessage);
      console.error("Update user error:", error.response?.data || error);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      updateUser(userId, { is_active: isActive }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const action = variables.isActive ? "activated" : "deactivated";
      toast.success(`User ${action} successfully`);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                          error.message || 
                          "Failed to update user status";
      toast.error(errorMessage);
      console.error("Toggle user status error:", error.response?.data || error);
    },
  });

  const handleCreate = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.unit_id || formData.unit_id === 0) {
      toast.error("Please fill in all required fields (username, email, password, and unit)");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = (user: any) => {
    if (!editingUser) return;
    
    if (!formData.email || !formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    
    const updateData: UpdateUserData = {
      first_name: formData.first_name || undefined,
      last_name: formData.last_name || undefined,
      email: formData.email.trim(),
    };
    
    // Only include password if it's provided and not empty
    if (formData.password && formData.password.trim()) {
      updateData.password = formData.password.trim();
    }
    
    updateMutation.mutate({ id: user.user.id, data: updateData });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.user.username,
      email: user.user.email,
      password: "",
      first_name: user.user.firstName,
      last_name: user.user.lastName,
      role: user.profile?.role || "STATE_MINISTER",
      unit_id: user.profile?.unit?.id || 0,
    });
  };

  const handleToggleUserStatus = (user: any) => {
    const newStatus = !user.user.isActive;
    const action = newStatus ? "activate" : "deactivate";
    const confirmMessage = `Are you sure you want to ${action} this user?`;
    
    if (confirm(confirmMessage)) {
      toggleUserStatusMutation.mutate({
        userId: user.user.id,
        isActive: newStatus,
      });
    }
  };

  const canCreateUsers = session?.user?.role === "SUPERADMIN" || session?.user?.role === "STRATEGIC_AFFAIRS";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users and their roles within the system.
            </p>
          </div>
          {canCreateUsers && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              List of all users in the system with their roles and units.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersQuery.data && usersQuery.data.length > 0 ? (
                    usersQuery.data.map((user) => (
                      <TableRow key={user.user.id}>
                        <TableCell className="font-medium">
                          {user.user.username}
                        </TableCell>
                        <TableCell>
                          {user.user.firstName} {user.user.lastName}
                        </TableCell>
                        <TableCell>{user.user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {roleLabels[user.profile?.role || ""] || user.profile?.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.profile?.unit?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={user.user.isActive ? "outline" : "destructive"}>
                            {user.user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canCreateUsers && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user)}
                                disabled={toggleUserStatusMutation.isPending}
                                title={user.user.isActive ? "Deactivate User" : "Activate User"}
                              >
                                {user.user.isActive ? (
                                  <UserX className="h-4 w-4 text-red-600" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {usersQuery.error ? (
              <p className="text-sm text-destructive mt-4">
                Unable to load users. Please try again later.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role and unit assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_id">Unit *</Label>
                <Select
                  value={String(formData.unit_id)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a unit" />
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
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_password">New Password (leave blank to keep current)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_first_name">First Name</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_last_name">Last Name</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdate(editingUser)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Users;
