import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowAuditEntry } from "@/services/types";
import {
  FileText,
  TrendingUp,
  CheckCircle,
  Upload,
  Edit3,
  XCircle,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
  items?: WorkflowAuditEntry[];
  isLoading?: boolean;
}

const activityIcon = (action: string) => {
  switch (action) {
    case "CREATE":
      return {
        icon: Edit3,
        color: "text-blue-600",
        background: "bg-blue-100/60",
      };
    case "SUBMIT":
      return {
        icon: FileText,
        color: "text-primary",
        background: "bg-primary/10",
      };
    case "APPROVE":
      return {
        icon: CheckCircle,
        color: "text-emerald-600",
        background: "bg-emerald-100/60",
      };
    case "REJECT":
      return {
        icon: XCircle,
        color: "text-destructive",
        background: "bg-destructive/20",
      };
    case "IMPORT":
      return {
        icon: Upload,
        color: "text-purple-600",
        background: "bg-purple-100/60",
      };
    case "UPDATE":
      return {
        icon: TrendingUp,
        color: "text-orange-500",
        background: "bg-orange-100/60",
      };
    default:
      return {
        icon: Activity,
        color: "text-muted-foreground",
        background: "bg-muted",
      };
  }
};

const ActivitySkeleton = () => (
  <div className="flex items-start gap-4 p-3 rounded-lg">
    <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

const RecentActivity = ({ items = [], isLoading }: RecentActivityProps) => {
  const renderTimestamp = (value: string) => {
    if (!value) return "";
    try {
      return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch (_error) {
      return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest workflow actions across the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <ActivitySkeleton key={index} />
              ))
            : items.map((entry) => {
                const {
                  icon: Icon,
                  color,
                  background,
                } = activityIcon(entry.action);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/40 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${background}`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {entry.actionDisplay}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[0.65rem]">
                          {entry.unit.name}
                        </Badge>
                        <span>•</span>
                        <span>
                          {entry.actor.firstName || entry.actor.username}
                        </span>
                        {entry.message ? (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[12rem]">
                              {entry.message}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {renderTimestamp(entry.createdAt)}
                    </span>
                  </div>
                );
              })}

          {!isLoading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-6">
              No recent activity yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
