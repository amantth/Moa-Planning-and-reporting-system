import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getPendingApprovals,
  getRecentActivities,
} from "@/services/dashboard-service";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import DashboardStats from "@/components/dashboard/DashboardStats";
import PendingApprovals from "@/components/dashboard/PendingApprovals";
import RecentActivity from "@/components/dashboard/RecentActivity";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const Dashboard = () => {
  const { session, checking } = useAuthGuard();

  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    enabled: !checking && !!session,
  });

  const pendingApprovalsQuery = useQuery({
    queryKey: ["dashboard", "pending-approvals"],
    queryFn: getPendingApprovals,
    enabled: !checking && !!session,
  });

  const recentActivityQuery = useQuery({
    queryKey: ["dashboard", "recent-activities"],
    queryFn: getRecentActivities,
    enabled: !checking && !!session,
  });

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back
            {session
              ? `, ${session.user.firstName || session.user.username}`
              : ""}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's a snapshot of the ministry's planning and performance
            activity.
          </p>
        </div>

        <DashboardStats
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
        />

        <div className="grid gap-8 md:grid-cols-2">
          <PendingApprovals
            items={pendingApprovalsQuery.data}
            isLoading={pendingApprovalsQuery.isLoading}
          />

          <RecentActivity
            items={recentActivityQuery.data}
            isLoading={recentActivityQuery.isLoading}
          />
        </div>

        {statsQuery.error || pendingApprovalsQuery.error || recentActivityQuery.error ? (
          <Card>
            <CardContent className="py-6 text-sm text-destructive">
              There was a problem loading some dashboard data. Please refresh
              the page or try again later.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
