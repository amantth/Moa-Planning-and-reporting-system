import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { apiClient } from "@/services/api-client";
import { getUnits } from "@/services/units-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileSpreadsheet, Download } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

const Upload = () => {
  const { session, checking } = useAuthGuard();
  const queryClient = useQueryClient();
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>("ANNUAL");
  const [year, setYear] = useState<number>(currentYear);
  const [quarter, setQuarter] = useState<number>(1);
  const [unitId, setUnitId] = useState<number>(0);

  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
    enabled: !checking && !!session,
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await apiClient.post("/import-export/import_data/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-plans", "quarterly-reports"] });
      setSelectedFile(null);
      toast.success("File uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to upload file");
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "text/csv" ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".csv")
      ) {
        setSelectedFile(file);
      } else {
        toast.error("Please select an Excel (.xlsx, .xls) or CSV file");
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }
    if (!unitId) {
      toast.error("Please select a unit");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("source", uploadType);
    formData.append("unit_id", String(unitId));
    formData.append("year", String(year));
    if (uploadType === "QUARTERLY") {
      formData.append("quarter", String(quarter));
    }

    uploadMutation.mutate(formData);
  };

  const handleExport = async (type: string) => {
    try {
      const params: Record<string, string | number> = { year };
      if (type === "quarterly") {
        params.quarter = quarter;
      }

      const response = await apiClient.get(`/import-export/export_${type}/`, {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}_${year}${type === "quarterly" ? `_Q${quarter}` : ""}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Export started");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to export");
    }
  };

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear - index),
    [currentYear]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Upload Data</h1>
          <p className="text-muted-foreground">
            Upload Excel or CSV files to import annual plans or quarterly reports.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Upload Excel (.xlsx, .xls) or CSV files to import data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="upload_type">Import Type *</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Annual Plan</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="upload_unit">Unit *</Label>
                <Select
                  value={String(unitId)}
                  onValueChange={(value) => setUnitId(Number(value))}
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

              <div className="grid gap-2">
                <Label htmlFor="upload_year">Year *</Label>
                <Select
                  value={String(year)}
                  onValueChange={(value) => setYear(Number(value))}
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

              {uploadType === "QUARTERLY" && (
                <div className="grid gap-2">
                  <Label htmlFor="upload_quarter">Quarter *</Label>
                  <Select
                    value={String(quarter)}
                    onValueChange={(value) => setQuarter(Number(value))}
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
              )}

              <div className="grid gap-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending || !selectedFile || !unitId}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Export data as CSV files for backup or analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="export_year">Year</Label>
                <Select
                  value={String(year)}
                  onValueChange={(value) => setYear(Number(value))}
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
                <Label htmlFor="export_quarter">Quarter (for reports)</Label>
                <Select
                  value={String(quarter)}
                  onValueChange={(value) => setQuarter(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All Quarters</SelectItem>
                    {[1, 2, 3, 4].map((q) => (
                      <SelectItem key={q} value={String(q)}>
                        Quarter {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport("annual_plans")}
                  className="w-full"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Annual Plans
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("quarterly_reports")}
                  className="w-full"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Quarterly Reports
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("indicators")}
                  className="w-full"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Indicators
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>For Annual Plans:</strong> The Excel/CSV file should contain columns for
                indicator code, target value, baseline value, and remarks.
              </p>
              <p>
                <strong>For Quarterly Reports:</strong> The Excel/CSV file should contain columns for
                indicator code, achieved value, and remarks.
              </p>
              <p>
                <strong>Supported formats:</strong> .xlsx, .xls, .csv
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Upload;
