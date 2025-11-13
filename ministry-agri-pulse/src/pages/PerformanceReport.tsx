import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { getIndicators } from "@/services/indicators-service";
import { 
  getPerformanceData, 
  createPerformanceData, 
  updatePerformanceData,
  deletePerformanceData,
  type PerformanceData as APIPerformanceData,
  type CreatePerformanceData 
} from "@/services/performance-service";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, FileDown, Trash2 } from "lucide-react";
import { toast } from "sonner";


interface DialogState {
  isOpen: boolean;
  type: 'plan' | 'performance' | null;
  indicatorId: number | null;
  quarter: number | null;
  currentValue: number | null;
}

const PerformanceReport = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null,
    indicatorId: null,
    quarter: null,
    currentValue: null,
  });
  const [inputValue, setInputValue] = useState<string>("");
  
  // Fetch performance data from API
  const performanceQuery = useQuery({
    queryKey: ["performance-data", selectedYear],
    queryFn: () => getPerformanceData({ year: selectedYear }),
    enabled: !checking && !!session,
  });

  const years = useMemo(
    () => Array.from({ length: 10 }, (_, index) => currentYear - index),
    [currentYear]
  );

  const quarters = [
    { value: 1, label: "Q1" },
    { value: 2, label: "Q2" },
    { value: 3, label: "Q3" },
    { value: 4, label: "Q4" },
  ];

  const indicatorsQuery = useQuery({
    queryKey: ["indicators"],
    queryFn: () => getIndicators({ includeInactive: false }),
    enabled: !checking && !!session,
  });

  const createPerformanceMutation = useMutation({
    mutationFn: createPerformanceData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-data"] });
    },
  });

  const updatePerformanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updatePerformanceData(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-data"] });
    },
  });

  const deletePerformanceMutation = useMutation({
    mutationFn: deletePerformanceData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-data"] });
      toast.success("Performance data deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete performance data");
    },
  });

  const filteredIndicators = useMemo(() => {
    if (!indicatorsQuery.data) return [];
    return indicatorsQuery.data.filter(indicator =>
      indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicator.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [indicatorsQuery.data, searchTerm]);

  const getPerformanceValue = (indicatorId: number, quarter: number, type: 'plan' | 'performance') => {
    if (!performanceQuery.data) return null;
    const data = performanceQuery.data.find(
      d => d.indicator_id === indicatorId && d.year === selectedYear && d.quarter === quarter
    );
    return type === 'plan' ? data?.plan_value : data?.performance_value;
  };

  const handleOpenDialog = (type: 'plan' | 'performance', indicatorId: number, quarter: number) => {
    const currentValue = getPerformanceValue(indicatorId, quarter, type);
    setDialogState({
      isOpen: true,
      type,
      indicatorId,
      quarter,
      currentValue,
    });
    setInputValue(currentValue?.toString() || "");
  };

  const handleSaveValue = async () => {
    if (!dialogState.indicatorId || !dialogState.quarter || !dialogState.type) return;

    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }

    try {
      // Find existing performance data entry
      const existingEntry = performanceQuery.data?.find(
        d => d.indicator_id === dialogState.indicatorId && 
             d.year === selectedYear && 
             d.quarter === dialogState.quarter
      );

      if (existingEntry) {
        // Update existing entry
        const updateData = {
          [dialogState.type === 'plan' ? 'plan_value' : 'performance_value']: value
        };
        await updatePerformanceMutation.mutateAsync({ id: existingEntry.id!, data: updateData });
      } else {
        // Create new entry
        const createData: CreatePerformanceData = {
          indicator_id: dialogState.indicatorId!,
          year: selectedYear,
          quarter: dialogState.quarter!,
          [dialogState.type === 'plan' ? 'plan_value' : 'performance_value']: value,
        };
        await createPerformanceMutation.mutateAsync(createData);
      }

      toast.success(`${dialogState.type === 'plan' ? 'Plan' : 'Performance'} value saved successfully`);
      setDialogState({ isOpen: false, type: null, indicatorId: null, quarter: null, currentValue: null });
      setInputValue("");
    } catch (error) {
      toast.error("Failed to save value. Please try again.");
      console.error("Error saving performance data:", error);
    }
  };

  const handleCloseDialog = () => {
    setDialogState({ isOpen: false, type: null, indicatorId: null, quarter: null, currentValue: null });
    setInputValue("");
  };

  const handleDeletePerformanceData = (indicatorId: number, quarter: number) => {
    if (!performanceQuery.data) return;
    
    const existingEntry = performanceQuery.data.find(
      d => d.indicator_id === indicatorId && 
           d.year === selectedYear && 
           d.quarter === quarter
    );

    if (existingEntry && existingEntry.id) {
      if (confirm("Are you sure you want to delete this performance data entry?")) {
        deletePerformanceMutation.mutate(existingEntry.id);
      }
    }
  };

  if (checking) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quarter and Annual planning</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance Report</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="search">Search:</Label>
                  <Input
                    id="search"
                    placeholder="Search indicators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="year">Year:</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[400px]">Indicator</TableHead>
                    <TableHead className="w-[100px] text-center">{selectedYear}</TableHead>
                    <TableHead className="w-[120px] text-center">Q1</TableHead>
                    <TableHead className="w-[120px] text-center">Q2</TableHead>
                    <TableHead className="w-[120px] text-center">Q3</TableHead>
                    <TableHead className="w-[120px] text-center">Q4</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Main category header */}
                  <TableRow className="bg-green-100 hover:bg-green-100">
                    <TableCell colSpan={6} className="font-semibold text-green-800">
                      Promoting Market-Oriented Crop and Horticultural Production and Productivity Growth
                    </TableCell>
                  </TableRow>
                  
                  {/* Sub-category header */}
                  <TableRow className="bg-green-50 hover:bg-green-50">
                    <TableCell colSpan={6} className="font-medium text-green-700 pl-6">
                      Expanding small-holder farmers' cultivated land and production (Meher season)
                    </TableCell>
                  </TableRow>

                  {indicatorsQuery.isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredIndicators.map((indicator) => (
                      <TableRow key={indicator.id}>
                        <TableCell className="pl-8">
                          <div>
                            <div className="font-medium">{indicator.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {indicator.code} • {indicator.unitOfMeasure}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm font-medium">{selectedYear}</span>
                        </TableCell>
                        {quarters.map((quarter) => {
                          const hasData = performanceQuery.data?.some(
                            d => d.indicator_id === indicator.id && 
                                 d.year === selectedYear && 
                                 d.quarter === quarter.value &&
                                 (d.plan_value !== null || d.performance_value !== null)
                          );
                          
                          return (
                            <TableCell key={quarter.value} className="text-center">
                              <div className="space-y-1">
                                <Button
                                  size="sm"
                                  className="w-16 h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                                  onClick={() => handleOpenDialog('plan', indicator.id, quarter.value)}
                                >
                                  {getPerformanceValue(indicator.id, quarter.value, 'plan') || 'N/A'}
                                </Button>
                                <Button
                                  size="sm"
                                  className="w-16 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                  onClick={() => handleOpenDialog('performance', indicator.id, quarter.value)}
                                >
                                  {getPerformanceValue(indicator.id, quarter.value, 'performance') || 'N/A'}
                                </Button>
                                {hasData && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-16 h-6 p-0"
                                    onClick={() => handleDeletePerformanceData(indicator.id, quarter.value)}
                                    title="Delete Entry"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Value Entry Dialog */}
        <Dialog open={dialogState.isOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                Enter {dialogState.type === 'plan' ? 'Plan' : 'Performance'} Value
              </DialogTitle>
              <DialogDescription>
                Enter the {dialogState.type === 'plan' ? 'planned' : 'actual performance'} value for Q{dialogState.quarter} {selectedYear}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">
                  Value
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter value..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveValue}>
                Save Value
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PerformanceReport;
