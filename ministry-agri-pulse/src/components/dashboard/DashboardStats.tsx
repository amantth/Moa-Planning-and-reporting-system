import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats as DashboardStatsType } from "@/services/types";
import { FileText, TrendingUp, Target, Users2 } from "lucide-react";

interface DashboardStatsProps {
  stats?: DashboardStatsType | null;
  isLoading?: boolean;
}

const StatSkeleton = () => (
  <Card>
    <CardHeader className="space-y-0 pb-2">
      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="h-6 w-16 bg-muted rounded animate-pulse" />
      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
      <div className="h-3 w-14 bg-muted rounded animate-pulse" />
    </CardContent>
  </Card>
);

const DashboardStats = ({ stats, isLoading }: DashboardStatsProps) => {
  const items = [
    {
      title: "Total Units",
      value: stats?.totalUnits ?? 0,
      icon: Users2,
      description: "Active ministerial offices",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Indicators",
      value: stats?.totalIndicators ?? 0,
      icon: Target,
      description: "Performance indicators being tracked",
      color: "text-purple-600",
      bgColor: "bg-purple-100/60",
    },
    {
      title: "Annual Plans (Current Year)",
      value: stats?.annualPlansCurrent ?? 0,
      icon: FileText,
      description: "Plans submitted for this year",
      color: "text-blue-600",
      bgColor: "bg-blue-100/60",
    },
    {
      title: "Quarterly Reports (Current Quarter)",
      value: stats?.quarterlyReportsCurrent ?? 0,
      icon: TrendingUp,
      description: "Reports submitted this quarter",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/60",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {isLoading
        ? items.map((_, index) => <StatSkeleton key={index} />)
        : items.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
    </div>
  );
};

export default DashboardStats;
