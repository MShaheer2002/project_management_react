import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { analyticsService } from '../services/analyticsService';
import type { AnalyticsQueryParams } from '../types';

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  workspace: (workspaceId: string | undefined, params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, 'workspace', workspaceId, params] as const,
  project: (workspaceId: string | undefined, projectId: string, params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, 'project', workspaceId, projectId, params] as const,
  team: (workspaceId: string | undefined, teamId: string, params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, 'team', workspaceId, teamId, params] as const,
  member: (workspaceId: string | undefined, memberId: string, params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, 'member', workspaceId, memberId, params] as const,
  cycle: (workspaceId: string | undefined, cycleId: string, params: AnalyticsQueryParams) =>
    [...analyticsQueryKeys.all, 'cycle', workspaceId, cycleId, params] as const,
};

export const useWorkspaceAnalytics = (params: AnalyticsQueryParams) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: analyticsQueryKeys.workspace(workspaceId, params),
    queryFn: () => analyticsService.getWorkspaceAnalytics(params),
    enabled: Boolean(workspaceId),
  });
};

export const useProjectAnalytics = (projectId: string, params: AnalyticsQueryParams) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: analyticsQueryKeys.project(workspaceId, projectId, params),
    queryFn: () => analyticsService.getProjectAnalytics(projectId, params),
    enabled: Boolean(workspaceId) && Boolean(projectId),
  });
};

export const useTeamAnalytics = (teamId: string, params: AnalyticsQueryParams) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: analyticsQueryKeys.team(workspaceId, teamId, params),
    queryFn: () => analyticsService.getTeamAnalytics(teamId, params),
    enabled: Boolean(workspaceId) && Boolean(teamId),
  });
};

export const useMemberAnalytics = (memberId: string, params: AnalyticsQueryParams) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: analyticsQueryKeys.member(workspaceId, memberId, params),
    queryFn: () => analyticsService.getMemberAnalytics(memberId, params),
    enabled: Boolean(workspaceId) && Boolean(memberId),
  });
};

export const useCycleAnalytics = (cycleId: string, params: AnalyticsQueryParams) => {
  const workspaceId = useAuthStore((s) => s.workspace?.id);
  return useQuery({
    queryKey: analyticsQueryKeys.cycle(workspaceId, cycleId, params),
    queryFn: () => analyticsService.getCycleAnalytics(cycleId, params),
    enabled: Boolean(workspaceId) && Boolean(cycleId),
  });
};
