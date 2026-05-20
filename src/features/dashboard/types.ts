export interface DashboardWorkspace {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  teamSize: string | null;
}

export interface DashboardStats {
  issuesCompleted: number;
  activeProjects: number;
  teamMembers: number;
  openIssues: number;
  unreadNotifications: number;
}

export interface DashboardChartPoint {
  name?: string;
  date?: string;
  completed?: number;
  opened?: number;
  open?: number;
}

export interface DashboardIssueSummary {
  id: string;
  key?: string;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
}

export interface DashboardProjectSummary {
  id: string;
  name: string;
  progress?: number;
  issueCount?: number;
}

export interface DashboardActivityItem {
  id: string;
  description: string;
  timestamp?: string;
}

export interface DashboardData {
  workspace: DashboardWorkspace;
  stats: DashboardStats;
  charts: {
    velocity: DashboardChartPoint[];
    sprintProgress: DashboardChartPoint[];
  };
  assignedToMe: DashboardIssueSummary[];
  activeProjects: DashboardProjectSummary[];
  upcomingDeadlines: DashboardIssueSummary[];
  teamActivity: DashboardActivityItem[];
}
