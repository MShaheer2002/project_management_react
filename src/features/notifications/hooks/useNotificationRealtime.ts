import { useAuth } from '@clerk/clerk-react';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/app/stores/useAuthStore';
import { useToastStore } from '@/app/stores/useToastStore';
import { issueQueryKeys } from '@features/issues';
import { dashboardQueryKeys } from '@features/dashboard';
import { roadmapQueryKeys } from '@features/roadmap';
import { sidebarQueryKeys } from '@features/sidebar';
import { notificationQueryKeys } from './useNotificationData';
import type { NotificationItem, NotificationsListResult } from '../types';
import { realtimeSocket } from '@/shared/services/realtimeSocket';

type RealtimeEnvelope<TPayload> = {
  id: string;
  type: string;
  workspaceId: string;
  createdAt: string;
  dedupeKey?: string;
  payload: TPayload;
};

type NotificationCreatedPayload = {
  notification: NotificationItem;
  unread: number;
  ui?: {
    toast?: boolean;
    soundKey?: 'default' | 'mention' | 'assignment' | 'warning';
    priority?: 'low' | 'normal' | 'high';
  };
};

type NotificationReadPayload = {
  workspaceId: string;
  id: string;
  readAt: string | null;
};

type NotificationReadAllPayload = {
  workspaceId: string;
  updated: number;
  readAt: string;
};

const LOG_PREFIX = '[NotificationRealtime]';

const log = (message: string, payload?: unknown) => {
  if (!import.meta.env.DEV) return;
  if (payload === undefined) {
    console.info(`${LOG_PREFIX} ${message}`);
    return;
  }
  console.info(`${LOG_PREFIX} ${message}`, payload);
};

const isInfiniteNotificationCache = (
  value: unknown
): value is InfiniteData<NotificationsListResult> => {
  if (!value || typeof value !== 'object') return false;
  const maybe = value as { pages?: unknown };
  return Array.isArray(maybe.pages);
};

const patchInfiniteNotifications = (
  queryClient: QueryClient,
  workspaceId: string,
  updater: (item: NotificationItem) => NotificationItem
) => {
  queryClient.setQueriesData<InfiniteData<NotificationsListResult>>(
    { queryKey: notificationQueryKeys.workspace(workspaceId) },
    (previous) => {
      if (!isInfiniteNotificationCache(previous)) return previous;
      return {
        ...previous,
        pages: previous.pages.map((page) => ({
          ...page,
          items: page.items.map(updater),
        })),
      };
    }
  );
};

const prependNotificationToLists = (queryClient: QueryClient, workspaceId: string, notification: NotificationItem) => {
  queryClient.setQueriesData<InfiniteData<NotificationsListResult>>(
    { queryKey: notificationQueryKeys.workspace(workspaceId) },
    (previous) => {
      if (!isInfiniteNotificationCache(previous)) return previous;
      const alreadyExists = previous.pages.some((page) => page.items.some((item) => item.id === notification.id));
      if (alreadyExists) return previous;
      if (!previous.pages.length) return previous;
      const [firstPage, ...rest] = previous.pages;
      return {
        ...previous,
        pages: [
          {
            ...firstPage,
            items: [notification, ...firstPage.items],
            meta: {
              ...firstPage.meta,
              total: (firstPage.meta.total ?? firstPage.items.length) + 1,
            },
          },
          ...rest,
        ],
      };
    }
  );
};

const extractSoundFrequency = (soundKey: NotificationCreatedPayload['ui']['soundKey']) => {
  switch (soundKey) {
    case 'mention':
      return 980;
    case 'assignment':
      return 820;
    case 'warning':
      return 620;
    default:
      return 740;
  }
};

const tryPlaySound = (soundKey: NotificationCreatedPayload['ui']['soundKey']) => {
  try {
    const audioContext = new window.AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = extractSoundFrequency(soundKey);
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.12);
    oscillator.onended = () => {
      void audioContext.close();
    };
  } catch {
    log('sound playback blocked by browser');
  }
};

export const useNotificationRealtime = () => {
  const { getToken, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const workspaceId = useAuthStore((state) => state.workspace?.id);
  const currentUserId = useAuthStore((state) => state.currentUser?.id);
  const showToast = useToastStore((state) => state.showToast);
  const processedEnvelopeIdsRef = useRef<Set<string>>(new Set());
  const processedNotificationIdsRef = useRef<Set<string>>(new Set());
  const allowSoundRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);

  useEffect(() => {
    const enableSound = () => {
      allowSoundRef.current = true;
    };
    window.addEventListener('pointerdown', enableSound, { once: true });
    window.addEventListener('keydown', enableSound, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enableSound);
      window.removeEventListener('keydown', enableSound);
    };
  }, []);

  useEffect(() => {
    if (!isSignedIn || !workspaceId) {
      realtimeSocket.disconnect();
      return;
    }

    let active = true;
    let reconnectingForAuth = false;

    const connectSocket = async () => {
      const token = await getToken();
      if (!token || !active) return;

      const socket = realtimeSocket.connect({ token, workspaceId, clientVersion: 'phase10-web' });

      const handleNotificationCreated = (envelope: RealtimeEnvelope<NotificationCreatedPayload>) => {
        if (envelope.workspaceId !== workspaceId) return;
        if (processedEnvelopeIdsRef.current.has(envelope.id)) return;
        processedEnvelopeIdsRef.current.add(envelope.id);

        const payload = envelope.payload;
        if (!payload?.notification) return;
        if (processedNotificationIdsRef.current.has(payload.notification.id)) return;
        processedNotificationIdsRef.current.add(payload.notification.id);

        prependNotificationToLists(queryClient, workspaceId, payload.notification);
        queryClient.setQueryData(notificationQueryKeys.unread(workspaceId), { unread: payload.unread });
        queryClient.invalidateQueries({ queryKey: sidebarQueryKeys.byWorkspace(workspaceId) });
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.byWorkspace(workspaceId) });

        const isSelfOriginated = payload.notification.actor?.id === currentUserId;

        if (payload.ui?.toast && !isSelfOriginated) {
          showToast(payload.notification.message, 'info', payload.notification.title);
        }
        if (allowSoundRef.current && payload.ui?.soundKey && !isSelfOriginated) {
          tryPlaySound(payload.ui.soundKey);
        }

        log('notification:created', {
          envelopeId: envelope.id,
          notificationId: payload.notification.id,
          type: payload.notification.type,
        });
      };

      const handleNotificationRead = (envelope: RealtimeEnvelope<NotificationReadPayload>) => {
        if (envelope.workspaceId !== workspaceId) return;
        if (processedEnvelopeIdsRef.current.has(envelope.id)) return;
        processedEnvelopeIdsRef.current.add(envelope.id);

        patchInfiniteNotifications(queryClient, workspaceId, (item) =>
          item.id === envelope.payload.id ? { ...item, readAt: envelope.payload.readAt } : item
        );
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(workspaceId) });
        log('notification:read', envelope.payload);
      };

      const handleNotificationReadAll = (envelope: RealtimeEnvelope<NotificationReadAllPayload>) => {
        if (envelope.workspaceId !== workspaceId) return;
        if (processedEnvelopeIdsRef.current.has(envelope.id)) return;
        processedEnvelopeIdsRef.current.add(envelope.id);

        patchInfiniteNotifications(queryClient, workspaceId, (item) => ({ ...item, readAt: envelope.payload.readAt }));
        queryClient.setQueryData(notificationQueryKeys.unread(workspaceId), { unread: 0 });
        queryClient.invalidateQueries({ queryKey: notificationQueryKeys.workspace(workspaceId) });
        log('notification:read-all', envelope.payload);
      };

      const handleWorkspaceIssueChange = (envelope: RealtimeEnvelope<{ issueId?: string; actorUserId?: string }>) => {
        if (envelope.workspaceId !== workspaceId) return;
        // The actor's own change already updated their cache directly (optimistic
        // patch on the mutation's onSuccess) — this broadcast is for OTHER clients.
        // Without this check, every status change re-invalidated all 7+ board
        // columns for the very user who just made the change, on top of the
        // optimistic update that had already applied correctly.
        if (envelope.payload?.actorUserId === currentUserId) return;
        queryClient.invalidateQueries({ queryKey: issueQueryKeys.workspace(workspaceId) });
      };

      const handleIssueCommentChange = (envelope: RealtimeEnvelope<{ issueId?: string }>) => {
        if (envelope.workspaceId !== workspaceId) return;
        const issueId = envelope.payload?.issueId;
        if (!issueId) return;
        queryClient.invalidateQueries({ queryKey: issueQueryKeys.comments(workspaceId, issueId) });
        queryClient.invalidateQueries({ queryKey: issueQueryKeys.activity(workspaceId, issueId) });
      };

      const handleRoadmapChange = (envelope: RealtimeEnvelope<{ projectId?: string }>) => {
        if (envelope.workspaceId !== workspaceId) return;
        queryClient.invalidateQueries({ queryKey: roadmapQueryKeys.workspace(workspaceId) });
        const projectId = envelope.payload?.projectId;
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: roadmapQueryKeys.project(workspaceId, projectId) });
        }
      };

      const handleConnect = async () => {
        // The first connect of a session lands right after the notification list and
        // unread-count queries already did their own natural initial fetch — resyncing
        // again immediately is redundant. Only actual reconnects (a dropped connection
        // that may have missed realtime events while it was down) need this.
        if (!hasConnectedOnceRef.current) {
          hasConnectedOnceRef.current = true;
          log('socket connected (first time this session): skipping redundant resync');
          return;
        }
        log('socket reconnected: triggering notification resync');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.workspace(workspaceId) }),
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unread(workspaceId) }),
        ]);
      };

      const handleReconnectAttempt = async () => {
        const refreshedToken = await getToken({ skipCache: true });
        if (!refreshedToken) return;
        socket.auth = {
          token: refreshedToken,
          workspaceId,
          clientVersion: 'phase10-web',
        };
        log('reconnect_attempt: refreshed auth token');
      };

      const handleConnectError = async (error: Error) => {
        const msg = error.message.toLowerCase();
        const authLikelyFailed = msg.includes('auth') || msg.includes('token') || msg.includes('unauthorized');
        if (!authLikelyFailed || reconnectingForAuth) return;

        reconnectingForAuth = true;
        log('connect_error auth failure: refreshing token and reconnecting');
        const refreshedToken = await getToken({ skipCache: true });
        if (!refreshedToken || !active) {
          reconnectingForAuth = false;
          return;
        }
        socket.auth = {
          token: refreshedToken,
          workspaceId,
          clientVersion: 'phase10-web',
        };
        socket.connect();
        reconnectingForAuth = false;
      };

      socket.on('notification:created', handleNotificationCreated);
      socket.on('notification:read', handleNotificationRead);
      socket.on('notification:read-all', handleNotificationReadAll);
      socket.on('issue:created', handleWorkspaceIssueChange);
      socket.on('issue:updated', handleWorkspaceIssueChange);
      socket.on('issue:deleted', handleWorkspaceIssueChange);
      socket.on('comment:created', handleIssueCommentChange);
      socket.on('comment:updated', handleIssueCommentChange);
      socket.on('comment:deleted', handleIssueCommentChange);
      socket.on('roadmap:project-updated', handleRoadmapChange);
      socket.on('roadmap:milestone-created', handleRoadmapChange);
      socket.on('roadmap:milestone-updated', handleRoadmapChange);
      socket.on('roadmap:milestone-deleted', handleRoadmapChange);
      socket.on('roadmap:dependency-created', handleRoadmapChange);
      socket.on('roadmap:dependency-resolved', handleRoadmapChange);
      socket.on('roadmap:dependency-cancelled', handleRoadmapChange);
      socket.on('roadmap:dependency-deleted', handleRoadmapChange);
      socket.on('connect', handleConnect);
      socket.on('connect_error', handleConnectError);
      socket.io.on('reconnect_attempt', handleReconnectAttempt);

      const cleanup = () => {
        socket.off('notification:created', handleNotificationCreated);
        socket.off('notification:read', handleNotificationRead);
        socket.off('notification:read-all', handleNotificationReadAll);
        socket.off('issue:created', handleWorkspaceIssueChange);
        socket.off('issue:updated', handleWorkspaceIssueChange);
        socket.off('issue:deleted', handleWorkspaceIssueChange);
        socket.off('comment:created', handleIssueCommentChange);
        socket.off('comment:updated', handleIssueCommentChange);
        socket.off('comment:deleted', handleIssueCommentChange);
        socket.off('roadmap:project-updated', handleRoadmapChange);
        socket.off('roadmap:milestone-created', handleRoadmapChange);
        socket.off('roadmap:milestone-updated', handleRoadmapChange);
        socket.off('roadmap:milestone-deleted', handleRoadmapChange);
        socket.off('roadmap:dependency-created', handleRoadmapChange);
        socket.off('roadmap:dependency-resolved', handleRoadmapChange);
        socket.off('roadmap:dependency-cancelled', handleRoadmapChange);
        socket.off('roadmap:dependency-deleted', handleRoadmapChange);
        socket.off('connect', handleConnect);
        socket.off('connect_error', handleConnectError);
        socket.io.off('reconnect_attempt', handleReconnectAttempt);
      };

      return cleanup;
    };

    let teardown: (() => void) | undefined;
    void connectSocket().then((cleanup) => {
      teardown = cleanup;
    });

    return () => {
      active = false;
      if (teardown) teardown();
    };
  }, [currentUserId, getToken, isSignedIn, queryClient, showToast, workspaceId]);
};

export const useIssueSocketRoom = (issueId: string | undefined) => {
  useEffect(() => {
    if (!issueId) return;
    let detachSocketListeners: (() => void) | null = null;

    const bindSocket = (socket: ReturnType<typeof realtimeSocket.getSocket>) => {
      detachSocketListeners?.();
      detachSocketListeners = null;

      if (!socket) return;

      const joinRoom = () => {
        socket.emit('issue:join', { issueId });
        log('issue:join', { issueId });
      };

      if (socket.connected) {
        joinRoom();
      }
      socket.on('connect', joinRoom);

      detachSocketListeners = () => {
        socket.off('connect', joinRoom);
        socket.emit('issue:leave', { issueId });
        log('issue:leave', { issueId });
      };
    };

    const unsubscribe = realtimeSocket.subscribe(bindSocket);

    return () => {
      unsubscribe();
      detachSocketListeners?.();
    };
  }, [issueId]);
};
