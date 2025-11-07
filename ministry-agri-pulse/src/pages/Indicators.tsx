import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getIndicators } from "@/services/indicators-service";
import { getUnits } from "@/services/units-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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

const Indicators = () => {
  const { session, checking } = useAuthGuard();
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

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
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
      </div>
    </DashboardLayout>
  );
};

export default Indicators;
