import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats as DashboardStatsType } from "@/services/types";
import { FileText, TrendingUp, Target, CheckCircle, Clock, BarChart3 } from "lucide-react";

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
      title: "Total Indicators",
      value: stats?.totalIndicators ?? 0,
      icon: Target,
      description: "Performance indicators being tracked",
      color: "text-purple-600",
      bgColor: "bg-purple-100/60",
    },
    {
      title: "Submitted Plans",
      value: stats?.submittedPlans ?? 0,
      icon: FileText,
      description: "Annual plans submitted",
      color: "text-blue-600",
      bgColor: "bg-blue-100/60",
    },
    {
      title: "Approved Plans",
      value: stats?.approvedPlans ?? 0,
      icon: CheckCircle,
      description: "Plans approved and active",
      color: "text-green-600",
      bgColor: "bg-green-100/60",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: Clock,
      description: "Plans awaiting approval",
      color: "text-orange-600",
      bgColor: "bg-orange-100/60",
    },
    {
      title: "Quarterly Reports",
      value: stats?.performanceReports ?? 0,
      icon: BarChart3,
      description: "Quarterly performance reports",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/60",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
