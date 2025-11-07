import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getAnnualPlans } from "@/services/plans-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const Plans = () => {
  const { session, checking } = useAuthGuard();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [year, setYear] = useState<number>(currentYear);

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const plansQuery = useQuery({
    queryKey: ["annual-plans", year],
    queryFn: () => getAnnualPlans({ year }),
    enabled: !checking && !!session,
  });

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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
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
      </div>
    </DashboardLayout>
  );
};

export default Plans;
