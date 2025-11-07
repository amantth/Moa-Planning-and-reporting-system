import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getQuarterlyReports } from "@/services/reports-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format } from "date-fns";

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
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<string>("all");

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Performance Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor quarterly performance submissions and approval status.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
      </div>
    </DashboardLayout>
  );
};

export default Reports;
