export type UnitType = "STRATEGIC" | "STATE_MINISTER" | "ADVISOR";

export interface UnitSummary {
  id: number;
  name: string;
  type: UnitType;
  parentName?: string | null;
  childrenCount?: number;
  usersCount?: number;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

export type UserRole =
  | "SUPERADMIN"
  | "STRATEGIC_AFFAIRS"
  | "STATE_MINISTER"
  | "ADVISOR";

export interface UserProfileSummary {
  id: number;
  role: UserRole;
  unit: UnitSummary | null;
}

export type PlanStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface AnnualPlanSummary {
  id: number;
  year: number;
  unit: UnitSummary;
  status: PlanStatus;
  createdBy: UserSummary;
  submittedAt: string | null;
  approvedAt: string | null;
  targetsCount: number;
}

export interface IndicatorSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  ownerUnit: UnitSummary;
  unitOfMeasure: string;
  active: boolean;
}

export type ReportStatus = PlanStatus;

export interface QuarterlyReportSummary {
  id: number;
  year: number;
  quarter: number;
  quarterLabel: string;
  unit: UnitSummary;
  status: ReportStatus;
  createdBy: UserSummary;
  submittedAt: string | null;
  approvedAt: string | null;
  entriesCount: number;
}

export interface DashboardStats {
  totalUnits: number;
  totalIndicators: number;
  submittedPlans: number;
  approvedPlans: number;
  pendingApprovals: number;
  performanceReports: number;
}

export interface PerformanceSummary {
  year: number;
  totalPlans: number;
  approvedPlans: number;
  totalReports: number;
  approvedReports: number;
  planApprovalRate: number;
  reportApprovalRate: number;
}

export interface WorkflowAuditEntry {
  id: number;
  action: string;
  actionDisplay: string;
  message: string | null;
  createdAt: string;
  actor: UserSummary;
  unit: UnitSummary;
  contextPlan: AnnualPlanSummary | null;
  contextReport: QuarterlyReportSummary | null;
}

const mapUnit = (payload: any): UnitSummary => ({
  id: payload?.id ?? 0,
  name: payload?.name ?? "",
  type: payload?.type ?? "STRATEGIC",
  parentName: payload?.parent_name ?? null,
  childrenCount: payload?.children_count ?? 0,
  usersCount: payload?.users_count ?? 0,
});

const mapUser = (payload: any): UserSummary => ({
  id: payload?.id ?? 0,
  username: payload?.username ?? "",
  email: payload?.email ?? "",
  firstName: payload?.first_name ?? "",
  lastName: payload?.last_name ?? "",
  isActive: payload?.is_active ?? false,
});

export const mapAnnualPlanSummary = (payload: any): AnnualPlanSummary => ({
  id: payload?.id ?? 0,
  year: payload?.year ?? 0,
  unit: mapUnit(payload?.unit),
  status: payload?.status ?? "DRAFT",
  createdBy: mapUser(payload?.created_by),
  submittedAt: payload?.submitted_at ?? null,
  approvedAt: payload?.approved_at ?? null,
  targetsCount: payload?.targets_count ?? 0,
});

export const mapIndicatorSummary = (payload: any): IndicatorSummary => ({
  id: payload?.id ?? 0,
  code: payload?.code ?? "",
  name: payload?.name ?? "",
  description: payload?.description ?? null,
  ownerUnit: mapUnit(payload?.owner_unit),
  unitOfMeasure: payload?.unit_of_measure ?? "",
  active: payload?.active ?? false,
});

export const mapQuarterlyReportSummary = (
  payload: any
): QuarterlyReportSummary => ({
  id: payload?.id ?? 0,
  year: payload?.year ?? 0,
  quarter: payload?.quarter ?? 0,
  quarterLabel: payload?.quarter_display ?? "",
  unit: mapUnit(payload?.unit),
  status: payload?.status ?? "DRAFT",
  createdBy: mapUser(payload?.created_by),
  submittedAt: payload?.submitted_at ?? null,
  approvedAt: payload?.approved_at ?? null,
  entriesCount: payload?.entries_count ?? 0,
});

export const mapWorkflowAuditEntry = (payload: any): WorkflowAuditEntry => ({
  id: payload?.id ?? 0,
  action: payload?.action ?? "",
  actionDisplay: payload?.action_display ?? payload?.action ?? "",
  message: payload?.message ?? null,
  createdAt: payload?.created_at ?? "",
  actor: mapUser(payload?.actor),
  unit: mapUnit(payload?.unit),
  contextPlan: payload?.context_plan
    ? mapAnnualPlanSummary(payload.context_plan)
    : null,
  contextReport: payload?.context_report
    ? mapQuarterlyReportSummary(payload.context_report)
    : null,
});

export const mapDashboardStats = (payload: any): DashboardStats => ({
  totalUnits: payload?.total_units ?? 0,
  totalIndicators: payload?.total_indicators ?? 0,
  submittedPlans: payload?.submitted_plans ?? payload?.annual_plans_submitted ?? 0,
  approvedPlans: payload?.approved_plans ?? payload?.annual_plans_approved ?? 0,
  pendingApprovals: payload?.pending_approvals ?? payload?.plans_pending_approval ?? 0,
  performanceReports: payload?.performance_reports ?? payload?.quarterly_reports_current ?? 0,
});

export const mapPerformanceSummary = (payload: any): PerformanceSummary => ({
  year: Number(payload?.year || 0),
  totalPlans: payload?.total_plans ?? 0,
  approvedPlans: payload?.approved_plans ?? 0,
  totalReports: payload?.total_reports ?? 0,
  approvedReports: payload?.approved_reports ?? 0,
  planApprovalRate:
    payload?.plan_approval_rate ?? payload?.completion_percentage ?? 0,
  reportApprovalRate: payload?.report_approval_rate ?? 0,
});

export const mapUserProfileSummary = (payload: any): UserProfileSummary => ({
  id: payload?.id ?? 0,
  role: payload?.role ?? "STATE_MINISTER",
  unit: payload?.unit ? mapUnit(payload.unit) : null,
});

export const mapUnitSummary = mapUnit;
export const mapUserSummary = mapUser;
