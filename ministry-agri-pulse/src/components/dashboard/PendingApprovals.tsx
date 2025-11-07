import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnualPlanSummary } from "@/services/types";
import { format } from "date-fns";

interface PendingApprovalsProps {
  items?: AnnualPlanSummary[];
  isLoading?: boolean;
}

const ApprovalSkeleton = () => (
  <div className="flex flex-col gap-2 p-4 bg-accent/30 rounded-lg border border-border">
    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
  </div>
);

const PendingApprovals = ({ items = [], isLoading }: PendingApprovalsProps) => {
  const formatSubmittedAt = (value: string | null) => {
    if (!value) return "Not yet submitted";
    try {
      return format(new Date(value), "MMM d, yyyy p");
    } catch (_error) {
      return value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>
          Annual plans waiting for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => <ApprovalSkeleton key={index} />)
            : items.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 bg-accent/40 rounded-lg border border-border"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Annual Plan {plan.year}</Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {plan.unit.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Submitted by {plan.createdBy.firstName || plan.createdBy.username} on {" "}
                    {formatSubmittedAt(plan.submittedAt)}
                  </p>
                </div>
              ))}

          {!isLoading && items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No pending approvals
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingApprovals;
