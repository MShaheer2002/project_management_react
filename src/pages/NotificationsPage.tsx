import React, { useDeferredValue, useMemo, useState } from 'react';
import {
  Inbox,
  CheckCircle2,
  Filter,
  Search,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsBatchRead,
  useNotifications,
  useUnreadNotificationsCount,
  type NotificationCategory,
  type NotificationItem,
} from '@features/notifications';
import {
  extractNotificationEntityId,
  getNotificationIcon,
  normalizeNotificationMessageForDisplay,
  relativeNotificationTime,
} from '@features/notifications/notificationDisplay';
import { getApiErrorMessage } from '@shared/services';
import { useApp } from '@/AppContext';

type NotificationTab = 'all' | 'mentions' | 'assignments' | 'updates' | 'membership' | 'comments';

const categoryFromTab = (tab: NotificationTab): NotificationCategory | undefined => {
  switch (tab) {
    case 'mentions':
      return 'mention';
    case 'assignments':
      return 'assignment';
    case 'updates':
      return 'update';
    case 'membership':
      return 'membership';
    case 'comments':
      return 'comment';
    default:
      return undefined;
  }
};

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedIssueId, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const notificationsQuery = useNotifications(
    {
      limit: 30,
      q: deferredSearch.trim() || undefined,
      category: categoryFromTab(activeTab),
    },
    { enabled: true }
  );
  const unreadQuery = useUnreadNotificationsCount({ enabled: true });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markBatchRead = useMarkNotificationsBatchRead();

  const notifications = useMemo(() => {
    const items = notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }, [notificationsQuery.data]);

  const unreadCount = unreadQuery.data?.unread ?? notifications.filter((item) => !item.readAt).length;

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      try {
        await markRead.mutateAsync({ notificationId: notification.id, input: { read: true } });
      } catch (error) {
        showToast(getApiErrorMessage(error) || 'Failed to mark notification as read.', 'error');
      }
    }

    if (notification.target.type === 'issue' && notification.target.publicId) {
      setSelectedIssueId(notification.target.publicId);
      return;
    }

    navigate(notification.target.url || '/inbox');
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to mark all notifications as read.', 'error');
    }
  };

  const handleMarkVisibleRead = async () => {
    const unreadIds = notifications.filter((item) => !item.readAt).map((item) => item.id);
    if (unreadIds.length === 0) return;

    try {
      await markBatchRead.mutateAsync({ ids: unreadIds });
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to mark notifications as read.', 'error');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400 dark:bg-gray-800">
            {unreadCount} unread
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-64 rounded-md border-none bg-gray-100 py-1.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:bg-white/5"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleMarkVisibleRead()}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
          >
            Mark visible read
          </button>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5"
          >
            Mark all read
          </button>
          <button className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50 dark:border-border-dark dark:hover:bg-white/5">
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className="flex gap-8 border-b border-gray-200 bg-gray-50/50 px-6 dark:border-border-dark dark:bg-black/10">
        {[
          { id: 'all', label: 'All' },
          { id: 'mentions', label: 'Mentions' },
          { id: 'assignments', label: 'Assignments' },
          { id: 'updates', label: 'Updates' },
          { id: 'membership', label: 'Membership' },
          { id: 'comments', label: 'Comments' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as NotificationTab)}
            className={`relative py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {notificationsQuery.isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            <Loader2 size={16} className="mr-2 animate-spin" /> Loading notifications...
          </div>
        ) : notificationsQuery.isError ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
              <Inbox size={32} />
            </div>
            <h1 className="text-xl font-bold">Failed to load inbox</h1>
            <p className="mt-2 max-w-xs text-sm text-gray-400">Please retry to load your notifications.</p>
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="mt-4 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                  !notification.readAt ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
                onClick={() => void handleOpenNotification(notification)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {notification.actor?.avatar ? (
                        <img
                          src={notification.actor.avatar}
                          className="h-10 w-10 rounded-full object-cover"
                          alt={notification.actor.name}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                          {(notification.actor?.name || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm dark:bg-bg-dark">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {notification.actor?.name && (
                        <span className="text-sm font-semibold">{notification.actor.name}</span>
                      )}
                      <span className="truncate text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {normalizeNotificationMessageForDisplay(notification)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase text-gray-400">
                        {extractNotificationEntityId(notification) && <span>{extractNotificationEntityId(notification)}</span>}
                        {extractNotificationEntityId(notification) && <span>•</span>}
                        <span>{relativeNotificationTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
                </div>

                <div className="ml-4 flex items-center gap-4">
                  {!notification.readAt && <div className="h-2 w-2 rounded-full bg-primary" />}
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!notification.readAt && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void markRead.mutateAsync({ notificationId: notification.id, input: { read: true } });
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleOpenNotification(notification);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {notificationsQuery.hasNextPage && (
              <div className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => notificationsQuery.fetchNextPage()}
                  disabled={notificationsQuery.isFetchingNextPage}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-border-dark dark:bg-white/[0.03] dark:text-gray-300"
                >
                  {notificationsQuery.isFetchingNextPage ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5">
              <Inbox size={32} />
            </div>
            <h1 className="text-xl font-bold">Your inbox is empty</h1>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
              When you are mentioned, assigned, or updated on work, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
