import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import {
  integrationService,
  githubService,
  slackService,
  discordService,
  figmaService,
} from '../services/integrationService';
import { integrationQueryKeys } from './useIntegrationData';
import type {
  GitHubSettings,
  SlackSettings,
  AddSlackChannelInput,
  ConnectDiscordInput,
  DiscordSettings,
  AddDiscordWebhookInput,
  ConnectFigmaInput,
  FigmaSettings,
} from '../types';
import type { ApiAxiosError } from '@shared/services/types';

// ── Shared ──────────────────────────────────────────────────────

export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (provider: string) => integrationService.disconnect(provider),
    onSuccess: (_d, provider) => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(wId),
      });
      showToast(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} disconnected`,
        'success',
      );
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to disconnect',
        'error',
      );
    },
  });
};

// ── GitHub ───────────────────────────────────────────────────────

export const useConnectGitHub = () =>
  useMutation({ mutationFn: githubService.connect });

export const useUpdateGitHubSettings = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (settings: Partial<GitHubSettings>) =>
      githubService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.githubSettings(wId),
      });
      showToast('Settings updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to update settings',
        'error',
      );
    },
  });
};

// ── Slack ────────────────────────────────────────────────────────

export const useConnectSlack = () =>
  useMutation({ mutationFn: slackService.connect });

export const useUpdateSlackSettings = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (settings: Partial<SlackSettings>) =>
      slackService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.slackSettings(wId),
      });
      showToast('Settings updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to update settings',
        'error',
      );
    },
  });
};

export const useAddSlackChannel = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: AddSlackChannelInput) =>
      slackService.addChannel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.slackSettings(wId),
      });
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to add channel',
        'error',
      );
    },
  });
};

export const useRemoveSlackChannel = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (channelDbId: string) =>
      slackService.removeChannel(channelDbId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.slackSettings(wId),
      });
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to remove channel',
        'error',
      );
    },
  });
};

// ── Discord ─────────────────────────────────────────────────────

export const useConnectDiscord = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: ConnectDiscordInput) =>
      discordService.connect(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(wId),
      });
    },
  });
};

export const useUpdateDiscordSettings = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (settings: Partial<DiscordSettings>) =>
      discordService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.discordSettings(wId),
      });
      showToast('Settings updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to update settings',
        'error',
      );
    },
  });
};

export const useAddDiscordWebhook = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: AddDiscordWebhookInput) =>
      discordService.addWebhook(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.discordSettings(wId),
      });
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to add webhook',
        'error',
      );
    },
  });
};

export const useRemoveDiscordWebhook = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (webhookDbId: string) =>
      discordService.removeWebhook(webhookDbId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.discordSettings(wId),
      });
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to remove webhook',
        'error',
      );
    },
  });
};

// ── Figma ────────────────────────────────────────────────────────

export const useConnectFigma = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);

  return useMutation({
    mutationFn: (input: ConnectFigmaInput) => figmaService.connect(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.list(wId),
      });
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.figmaSettings(wId),
      });
    },
  });
};

export const useUpdateFigmaSettings = () => {
  const queryClient = useQueryClient();
  const wId = useAuthStore((s) => s.workspace?.id);
  const showToast = useToastStore((s) => s.showToast);

  return useMutation({
    mutationFn: (settings: Partial<FigmaSettings>) =>
      figmaService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: integrationQueryKeys.figmaSettings(wId),
      });
      showToast('Settings updated', 'success');
    },
    onError: (err: ApiAxiosError) => {
      showToast(
        err.response?.data?.error?.message || 'Failed to update settings',
        'error',
      );
    },
  });
};
