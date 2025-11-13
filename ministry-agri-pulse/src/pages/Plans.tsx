import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getAnnualPlans, createAnnualPlan, deleteAnnualPlan, submitAnnualPlan, approveAnnualPlan, rejectAnnualPlan, addAnnualPlanTarget, CreateAnnualPlanData, CreateAnnualPlanTargetData } from "@/services/plans-service";
import { getUnits } from "@/services/units-service";
import { getIndicators } from "@/services/indicators-service";
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
import { format } from "date-fns";
import { Plus, Send, Check, X, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusVariantMap: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "secondary",
  SUBMITTED: "default",
  APPROVED: "outline",
  REJECTED: "destructive",
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch (_error) {
    return value;
  }
};

const Plans = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planFormData, setPlanFormData] = useState<CreateAnnualPlanData>({
    year: currentYear,
    unit_id: 0,
  });
  const [targetFormData, setTargetFormData] = useState<CreateAnnualPlanTargetData>({
    plan_id: 0,
    indicator_id: 0,
    target_value: 0,
    baseline_value: 0,
    remarks: "",
  });

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const plansQuery = useQuery({
    queryKey: ["annual-plans", year],
    queryFn: () => getAnnualPlans({ year }),
    enabled: !checking && !!session,
  });

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const indicatorsQuery = useQuery({
    queryKey: ["indicators", selectedPlan?.unit?.id],
    queryFn: () => getIndicators({ unitId: selectedPlan?.unit?.id }),
    enabled: !checking && !!session && !!selectedPlan,
  });

  const createMutation = useMutation({
    mutationFn: createAnnualPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      setIsCreateDialogOpen(false);
      setPlanFormData({ year: currentYear, unit_id: 0 });
      toast.success("Annual plan created successfully");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          (error.response?.data?.non_field_errors && error.response.data.non_field_errors[0]) ||
                          error.message || 
                          "Failed to create annual plan";
      toast.error(errorMessage);
      console.error("Create annual plan error:", error.response?.data || error);
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitAnnualPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      toast.success("Plan submitted for approval");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to submit plan");
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveAnnualPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      toast.success("Plan approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve plan");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectAnnualPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      toast.success("Plan rejected");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reject plan");
    },
  });

  const addTargetMutation = useMutation({
    mutationFn: ({ planId, data }: { planId: number; data: CreateAnnualPlanTargetData }) =>
      addAnnualPlanTarget(planId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      setIsTargetDialogOpen(false);
      setTargetFormData({
        plan_id: 0,
        indicator_id: 0,
        target_value: 0,
        baseline_value: 0,
        remarks: "",
      });
      toast.success("Target added successfully");
    },
    onError: (error: any) => {
      console.error("Add target error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);
      
      let errorMessage = "Failed to add target";
      
      if (error.name === 'ServerCrashError') {
        errorMessage = "Server crashed while adding target. The backend returned an HTML error page, indicating a server-side issue. Please contact your administrator to check the server logs.";
      } else if (error.name === 'AllTargetEndpointsFailed') {
        errorMessage = "All target addition endpoints failed. The backend may not support adding targets to plans, or the API endpoints may be incorrect. Please contact your administrator.";
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.detail) {
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
        errorMessage = "You don't have permission to add targets to this plan. You can only add targets to your own draft plans or plans from your unit. Check if you're the plan creator or if the plan belongs to your organizational unit.";
      } else if (error.response?.status === 404) {
        errorMessage = "Plan not found or target addition endpoint not available";
      } else if (error.response?.status === 500) {
        // Check if it's an HTML response (server crash)
        if (error.response?.data && typeof error.response.data === 'string' && 
            error.response.data.includes('<!DOCTYPE html>')) {
          errorMessage = "Server crashed while adding target. The backend returned an HTML error page instead of JSON. Please contact your administrator to check the server logs.";
        } else {
          errorMessage = "Server error occurred while adding target. This may be due to a backend issue or missing API endpoint. Please contact your administrator.";
        }
      } else {
        errorMessage = error.response?.data?.error || error.message || "Failed to add target";
      }
      
      toast.error(errorMessage, {
        duration: 8000, // Show longer for complex error messages
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnualPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans"] });
      toast.success("Annual plan deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete annual plan");
    },
  });

  const handleCreatePlan = () => {
    if (!planFormData.unit_id || planFormData.unit_id === 0) {
      toast.error("Please select a unit");
      return;
    }
    if (!planFormData.year || planFormData.year === 0) {
      toast.error("Please select a year");
      return;
    }
    createMutation.mutate(planFormData);
  };

  const handleAddTarget = () => {
    console.log("Adding target with data:", targetFormData);
    console.log("Selected plan:", selectedPlan);
    console.log("Current user:", session?.user);
    console.log("User permissions check:", {
      canAddTargets: canAddTargets(selectedPlan),
      userRole: session?.user?.role,
      userId: session?.user?.id,
      planCreatedBy: selectedPlan?.createdBy?.id,
      userUnit: session?.user?.unit?.id,
      planUnit: selectedPlan?.unit?.id,
      planStatus: selectedPlan?.status
    });
    
    // Check permissions before attempting to add target
    if (!canAddTargets(selectedPlan)) {
      toast.error("You don't have permission to add targets to this plan. You can only add targets to your own draft plans or plans from your unit.");
      return;
    }
    
    // Validate required fields
    if (!targetFormData.indicator_id || targetFormData.indicator_id === 0) {
      toast.error("Please select an indicator");
      return;
    }
    
    if (!targetFormData.target_value || targetFormData.target_value <= 0) {
      toast.error("Please enter a valid target value greater than 0");
      return;
    }
    
    if (!selectedPlan || !selectedPlan.id) {
      toast.error("No plan selected");
      return;
    }
    
    // Prepare the data to send
    const dataToSend = {
      ...targetFormData,
      plan_id: selectedPlan.id, // Ensure plan_id is set correctly
      target_value: Number(targetFormData.target_value),
      baseline_value: Number(targetFormData.baseline_value) || 0,
    };
    
    console.log("Sending target data:", dataToSend);
    
    addTargetMutation.mutate({
      planId: selectedPlan.id,
      data: dataToSend,
    });
  };

  const handleOpenTargetDialog = (plan: any) => {
    setSelectedPlan(plan);
    setTargetFormData({
      plan_id: plan.id,
      indicator_id: 0,
      target_value: 0,
      baseline_value: 0,
      remarks: "",
    });
    setIsTargetDialogOpen(true);
  };

  const canCreatePlans = !!session?.user;
  const canApprove = session?.user?.role === "SUPERADMIN" || session?.user?.role === "STRATEGIC_AFFAIRS";
  
  // Check if user can add targets to a specific plan
  const canAddTargets = (plan: any) => {
    if (!session?.user) return false;
    
    // SUPERADMIN can add targets to any plan
    if (session.user.role === "SUPERADMIN") return true;
    
    // STRATEGIC_AFFAIRS can add targets to any plan
    if (session.user.role === "STRATEGIC_AFFAIRS") return true;
    
    // Plan must be in DRAFT status
    if (plan.status !== "DRAFT") return false;
    
    // User can add targets to their own plans
    if (plan.createdBy.id === session.user.id) return true;
    
    // User can add targets to plans from their unit (if they have the same unit)
    if (session.user.unit && plan.unit && session.user.unit.id === plan.unit.id) return true;
    
    return false;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Annual Plans</h1>
            <p className="text-muted-foreground mt-1">
              Review the status of annual plans submitted by each ministerial
              unit.
            </p>
          </div>
          <div className="flex gap-2">
            {canCreatePlans && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            )}
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((optionYear) => (
                  <SelectItem key={optionYear} value={String(optionYear)}>
                    {optionYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plan Submissions</CardTitle>
            <CardDescription>
              Data is limited to the year selected above and filtered based on
              your access level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plansQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Targets</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plansQuery.data && plansQuery.data.length > 0 ? (
                    plansQuery.data.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {plan.unit.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusVariantMap[plan.status] ?? "secondary"
                            }
                          >
                            {plan.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{plan.targetsCount}</TableCell>
                        <TableCell>{formatDate(plan.submittedAt)}</TableCell>
                        <TableCell>{formatDate(plan.approvedAt)}</TableCell>
                        <TableCell>
                          {plan.createdBy.firstName || plan.createdBy.username}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {canAddTargets(plan) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenTargetDialog(plan)}
                                title="Add Target"
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                            )}
                            {plan.status === "DRAFT" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => submitMutation.mutate(plan.id)}
                                  title="Submit for Approval"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this annual plan?")) {
                                      deleteMutation.mutate(plan.id);
                                    }
                                  }}
                                  title="Delete Plan"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {plan.status === "SUBMITTED" && canApprove && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(plan.id)}
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => rejectMutation.mutate(plan.id)}
                                  title="Reject"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
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
                        No annual plans found for {year}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {plansQuery.error ? (
              <p className="text-sm text-destructive mt-4">
                Unable to load annual plans. Please try again later.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Create Plan Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Annual Plan</DialogTitle>
              <DialogDescription>
                Create a new annual plan for a unit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Year *</Label>
                <Select
                  value={String(planFormData.year)}
                  onValueChange={(value) =>
                    setPlanFormData({ ...planFormData, year: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_id">Unit *</Label>
                <Select
                  value={String(planFormData.unit_id)}
                  onValueChange={(value) =>
                    setPlanFormData({ ...planFormData, unit_id: Number(value) })
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
              <Button onClick={handleCreatePlan} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Target Dialog */}
        <Dialog open={isTargetDialogOpen} onOpenChange={setIsTargetDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Target to Plan</DialogTitle>
              <DialogDescription>
                Add a performance target for an indicator.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="indicator_id">Indicator *</Label>
                <Select
                  value={String(targetFormData.indicator_id)}
                  onValueChange={(value) =>
                    setTargetFormData({ ...targetFormData, indicator_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    {indicatorsQuery.data?.map((indicator) => (
                      <SelectItem key={indicator.id} value={String(indicator.id)}>
                        {indicator.code} - {indicator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target_value">Target Value *</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  value={targetFormData.target_value || ""}
                  onChange={(e) =>
                    setTargetFormData({ 
                      ...targetFormData, 
                      target_value: e.target.value === "" ? 0 : Number(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="baseline_value">Baseline Value</Label>
                <Input
                  id="baseline_value"
                  type="number"
                  step="0.01"
                  value={targetFormData.baseline_value || ""}
                  onChange={(e) =>
                    setTargetFormData({ 
                      ...targetFormData, 
                      baseline_value: e.target.value === "" ? 0 : Number(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={targetFormData.remarks}
                  onChange={(e) =>
                    setTargetFormData({ ...targetFormData, remarks: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTargetDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddTarget} disabled={addTargetMutation.isPending}>
                {addTargetMutation.isPending ? "Adding..." : "Add Target"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Plans;
