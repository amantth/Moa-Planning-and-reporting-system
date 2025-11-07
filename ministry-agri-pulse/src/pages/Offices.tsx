import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getUnits } from "@/services/units-service";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const typeLabels: Record<string, string> = {
  STRATEGIC: "Strategic Affairs Office",
  STATE_MINISTER: "State Minister Office",
  ADVISOR: "State Minister Advisor Office",
};

const Offices = () => {
  const { session, checking } = useAuthGuard();
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const filteredUnits = unitsQuery.data?.filter((unit) =>
    typeFilter === "all" ? true : unit.type === typeFilter
  );

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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
      </div>
    </DashboardLayout>
  );
};

export default Offices;
