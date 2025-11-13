import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getQuarterlyReports, createQuarterlyReport, deleteQuarterlyReport, submitQuarterlyReport, approveQuarterlyReport, rejectQuarterlyReport, addQuarterlyEntry, CreateQuarterlyReportData, CreateQuarterlyEntryData } from "@/services/reports-service";
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
import { Plus, Send, Check, X, FileText, Trash2 } from "lucide-react";
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

const Reports = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportFormData, setReportFormData] = useState<CreateQuarterlyReportData>({
    year: currentYear,
    quarter: 1,
    unit_id: 0,
  });
  const [entryFormData, setEntryFormData] = useState<CreateQuarterlyEntryData>({
    report_id: 0,
    indicator_id: 0,
    achieved_value: 0,
    remarks: "",
  });

  const quarters = [
    { value: "all", label: "All Quarters" },
    { value: "1", label: "Quarter 1" },
    { value: "2", label: "Quarter 2" },
    { value: "3", label: "Quarter 3" },
    { value: "4", label: "Quarter 4" },
  ];

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const reportsQuery = useQuery({
    queryKey: ["quarterly-reports", year, quarter],
    queryFn: () =>
      getQuarterlyReports({
        year,
        quarter: quarter === "all" ? undefined : Number(quarter),
      }),
    enabled: !checking && !!session,
  });

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const indicatorsQuery = useQuery({
    queryKey: ["indicators", selectedReport?.unit?.id],
    queryFn: () => getIndicators({ unitId: selectedReport?.unit?.id }),
    enabled: !checking && !!session && !!selectedReport,
  });

  const createMutation = useMutation({
    mutationFn: createQuarterlyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      setIsCreateDialogOpen(false);
      setReportFormData({ year: currentYear, quarter: 1, unit_id: 0 });
      toast.success("Quarterly report created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create quarterly report");
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitQuarterlyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      toast.success("Report submitted for approval");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to submit report");
    },
  });

  const approveMutation = useMutation({
    mutationFn: approveQuarterlyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      toast.success("Report approved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to approve report");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectQuarterlyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      toast.success("Report rejected");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reject report");
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: ({ reportId, data }: { reportId: number; data: CreateQuarterlyEntryData }) =>
      addQuarterlyEntry(reportId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      setIsEntryDialogOpen(false);
      setEntryFormData({
        report_id: 0,
        indicator_id: 0,
        achieved_value: 0,
        remarks: "",
      });
      toast.success("Entry added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to add entry");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQuarterlyReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      toast.success("Quarterly report deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete quarterly report");
    },
  });

  const handleCreateReport = () => {
    if (!reportFormData.unit_id) {
      toast.error("Please select a unit");
      return;
    }
    createMutation.mutate(reportFormData);
  };

  const handleAddEntry = () => {
    if (!entryFormData.indicator_id || entryFormData.achieved_value === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    addEntryMutation.mutate({
      reportId: selectedReport.id,
      data: entryFormData,
    });
  };

  const handleOpenEntryDialog = (report: any) => {
    setSelectedReport(report);
    setEntryFormData({
      report_id: report.id,
      indicator_id: 0,
      achieved_value: 0,
      remarks: "",
    });
    setIsEntryDialogOpen(true);
  };

  const canCreateReports = !!session?.user;
  const canApprove = session?.user?.role === "SUPERADMIN" || session?.user?.role === "STRATEGIC_AFFAIRS";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quarterly Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor quarterly performance submissions and approval status.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
            {canCreateReports && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            )}
            <Select
              value={String(year)}
              onValueChange={(value) => setYear(Number(value))}
            >
              <SelectTrigger className="md:w-32">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((optionYear) => (
                  <SelectItem key={optionYear} value={String(optionYear)}>
                    {optionYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quarter} onValueChange={setQuarter}>
              <SelectTrigger className="md:w-40">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quarterly Reports</CardTitle>
            <CardDescription>
              {quarter === "all"
                ? `Showing reports for ${year}.`
                : `Filtered to ${quarters
                    .find((option) => option.value === quarter)
                    ?.label?.toLowerCase()} ${year}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit</TableHead>
                    <TableHead>Quarter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entries</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportsQuery.data && reportsQuery.data.length > 0 ? (
                    reportsQuery.data.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          {report.unit.name}
                        </TableCell>
                        <TableCell>
                          {report.quarterLabel || `Q${report.quarter}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusVariantMap[report.status] ?? "secondary"
                            }
                          >
                            {report.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.entriesCount}</TableCell>
                        <TableCell>{formatDate(report.submittedAt)}</TableCell>
                        <TableCell>{formatDate(report.approvedAt)}</TableCell>
                        <TableCell>
                          {report.createdBy.firstName ||
                            report.createdBy.username}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {report.status === "DRAFT" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEntryDialog(report)}
                                  title="Add Entry"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => submitMutation.mutate(report.id)}
                                  title="Submit for Approval"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm("Are you sure you want to delete this quarterly report?")) {
                                      deleteMutation.mutate(report.id);
                                    }
                                  }}
                                  title="Delete Report"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                            {report.status === "SUBMITTED" && canApprove && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveMutation.mutate(report.id)}
                                  title="Approve"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => rejectMutation.mutate(report.id)}
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
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No quarterly reports found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {reportsQuery.error ? (
              <p className="text-sm text-destructive mt-4">
                Unable to load quarterly reports. Please try again later.
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Create Report Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Quarterly Report</DialogTitle>
              <DialogDescription>
                Create a new quarterly performance report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="report_year">Year *</Label>
                <Select
                  value={String(reportFormData.year)}
                  onValueChange={(value) =>
                    setReportFormData({ ...reportFormData, year: Number(value) })
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
                <Label htmlFor="report_quarter">Quarter *</Label>
                <Select
                  value={String(reportFormData.quarter)}
                  onValueChange={(value) =>
                    setReportFormData({ ...reportFormData, quarter: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((q) => (
                      <SelectItem key={q} value={String(q)}>
                        Quarter {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="report_unit_id">Unit *</Label>
                <Select
                  value={String(reportFormData.unit_id)}
                  onValueChange={(value) =>
                    setReportFormData({ ...reportFormData, unit_id: Number(value) })
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
              <Button onClick={handleCreateReport} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Entry Dialog */}
        <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Entry to Report</DialogTitle>
              <DialogDescription>
                Add a performance entry for an indicator.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="entry_indicator_id">Indicator *</Label>
                <Select
                  value={String(entryFormData.indicator_id)}
                  onValueChange={(value) =>
                    setEntryFormData({ ...entryFormData, indicator_id: Number(value) })
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
                <Label htmlFor="achieved_value">Achieved Value *</Label>
                <Input
                  id="achieved_value"
                  type="number"
                  step="0.01"
                  value={entryFormData.achieved_value}
                  onChange={(e) =>
                    setEntryFormData({ ...entryFormData, achieved_value: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry_remarks">Remarks</Label>
                <Textarea
                  id="entry_remarks"
                  value={entryFormData.remarks}
                  onChange={(e) =>
                    setEntryFormData({ ...entryFormData, remarks: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEntryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddEntry} disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
