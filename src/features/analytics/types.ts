// ── Shared metric types ──

export type TrendDirection = 'up' | 'down' | 'flat';

export interface MetricWithTrend {
  value: number;
  trend: number;
  direction: TrendDirection;
}

export interface ResolutionMetric {
  value: number;
  unit: string;
  trend: number;
  direction: TrendDirection;
}

export interface PeriodInfo {
  period: string;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
}

// ── Chart data types ──

export interface VelocityPoint {
  date: string;
  created: number;
  completed: number;
}

export interface BurndownPoint {
  date: string;
  remaining: number;
}

export interface GroupCountItem {
  count: number;
  [key: string]: string | number;
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

// ── Workspace Analytics ──

export interface WorkspaceAnalyticsData {
  period: PeriodInfo;
  summary: {
    tasksCompleted: MetricWithTrend;
    avgResolutionTime: ResolutionMetric;
    activeProjects: MetricWithTrend;
    teamWorkload: MetricWithTrend;
    overdueIssues: MetricWithTrend;
    progress: number;
    totalIssues: number;
    openVsClosed: { open: number; closed: number };
  };
  charts: {
    completionVelocity: VelocityPoint[];
    issuesByStatus: GroupCountItem[];
    issuesByPriority: GroupCountItem[];
    issuesByType: GroupCountItem[];
  };
  tables: {
    teamPerformance: TeamPerformanceRow[];
    topContributors: ContributorRow[];
    bottlenecks: BottleneckRow[];
  };
}

export interface TeamPerformanceRow {
  teamId: string;
  teamName: string;
  memberCount: number;
  completed: number;
  efficiency: number;
}

export interface ContributorRow {
  userId: string;
  name: string;
  avatar: string | null;
  assigned: number;
  completed: number;
  open: number;
  overdue: number;
  completionRate: number;
  avgResolutionHours: number;
}

export interface BottleneckRow {
  issueId: string;
  publicId: string;
  title: string;
  status: string;
  stuckDays: number;
  assignee: { id: string; name: string } | null;
}

// ── Project Analytics ──

export interface ProjectAnalyticsData {
  project: {
    id: string;
    name: string;
    startDate: string | null;
    targetDate: string | null;
    teamId: string;
  };
  summary: {
    progress: number;
    totalIssues: number;
    completedIssues: number;
    openIssues: number;
    scopeChanges: number;
    timelineHealth: 'on-track' | 'at-risk' | 'behind' | 'unknown';
  };
  charts: {
    burndown: BurndownPoint[];
    completionVelocity: VelocityPoint[];
    statusBreakdown: GroupCountItem[];
    priorityBreakdown: GroupCountItem[];
  };
  tables: {
    memberWorkload: MemberWorkloadRow[];
  };
}

export interface MemberWorkloadRow {
  userId: string;
  name: string;
  avatar: string | null;
  assigned: number;
  completed: number;
  open: number;
  overdue: number;
  completionRate: number;
  avgResolutionHours: number;
}

// ── Team Analytics ──

export interface TeamAnalyticsData {
  team: { id: string; name: string };
  summary: {
    velocity: MetricWithTrend;
    avgResolutionTime: ResolutionMetric;
    progress: number;
    totalIssues: number;
    completedIssues: number;
  };
  charts: {
    completionVelocity: VelocityPoint[];
    workloadDistribution: { userId: string; name: string; assigned: number; open: number }[];
    completionRatePerMember: { userId: string; name: string; completionRate: number }[];
    overduePerMember: { userId: string; name: string; overdue: number }[];
    cycleComparison: CycleComparisonItem[];
  };
  tables: {
    memberPerformance: MemberWorkloadRow[];
  };
}

export interface CycleComparisonItem {
  cycleId: string;
  cycleName: string;
  cycleNumber: number;
  completed: number;
  total: number;
  completionRate: number;
}

// ── Member Analytics ──

export interface MemberAnalyticsData {
  member: { id: string; name: string; email: string; avatar: string | null };
  summary: {
    assigned: number;
    completed: number;
    inProgress: number;
    overdue: number;
    completionRate: MetricWithTrend;
    avgResolutionTime: ResolutionMetric;
  };
  charts: {
    activityHeatmap: HeatmapPoint[];
    breakdownByProject: { projectId: string; projectName: string; assigned: number; completed: number }[];
    breakdownByTeam: { teamId: string; teamName: string; assigned: number; completed: number }[];
  };
  tables: {
    teams: { id: string; name: string }[];
    recentActivity: ActivityItem[];
  };
}

export interface ActivityItem {
  id: string;
  type: string;
  targetId: string;
  targetType: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ── Cycle Analytics ──

export interface CycleAnalyticsData {
  cycle: {
    id: string;
    name: string;
    teamId: string;
    startsAt: string;
    endsAt: string;
    status: string;
    completedAt: string | null;
  };
  summary: {
    totalIssues: number;
    completedIssues: number;
    openIssues: number;
    progress: number;
    avgResolutionTime: ResolutionMetric;
  };
  charts: {
    burndown: BurndownPoint[];
    dailyVelocity: VelocityPoint[];
    statusBreakdown: GroupCountItem[];
    priorityBreakdown: GroupCountItem[];
    typeBreakdown: GroupCountItem[];
  };
}

// ── Query params ──

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsQueryParams {
  period: AnalyticsPeriod;
  from?: string;
  to?: string;
}

export type ExportFormat = 'csv' | 'json' | 'pdf';
export type ExportScope = 'workspace' | 'project' | 'team' | 'member' | 'cycle';
