import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  ExternalLink,
  Filter,
  Inbox,
  Loader2,
  MoreHorizontal,
  Search,
  CheckCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/AppContext';
import { getApiErrorMessage } from '@shared/services';
import {
  type NotificationCategory,
  type NotificationItem,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsBatchRead,
  useNotifications,
} from '@features/notifications';
import {
  getNotificationIcon,
  normalizeNotificationMessageForDisplay,
  relativeNotificationTime,
} from '../notificationDisplay';

type NotificationPopoverTab = 'all' | 'mentions' | 'assignments' | 'updates' | 'comments';

const categoryFromTab = (tab: NotificationPopoverTab): NotificationCategory | undefined => {
  switch (tab) {
    case 'mentions':
      return 'mention';
    case 'assignments':
      return 'assignment';
    case 'updates':
      return 'update';
    case 'comments':
      return 'comment';
    default:
      return undefined;
  }
};

const tabLabel: Array<{ id: NotificationPopoverTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'updates', label: 'Updates' },
  { id: 'comments', label: 'Comments' },
];

export const NotificationsPopover: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { setSelectedIssueId, showToast } = useApp();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationPopoverTab>('all');
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const notificationsQuery = useNotifications(
    {
      limit: 12,
      q: deferredSearch.trim() || undefined,
      unreadOnly: unreadOnly || undefined,
      category: categoryFromTab(activeTab),
    },
    { enabled: open }
  );
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markBatchRead = useMarkNotificationsBatchRead();

  useEffect(() => {
    if (!open) {
      setIsMenuOpen(false);
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (
        distanceFromBottom < 56
        && notificationsQuery.hasNextPage
        && !notificationsQuery.isFetchingNextPage
      ) {
        void notificationsQuery.fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [notificationsQuery.fetchNextPage, notificationsQuery.hasNextPage, notificationsQuery.isFetchingNextPage, open]);

  const notifications = useMemo(() => {
    const items = notificationsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
  }, [notificationsQuery.data]);

  const unreadIds = notifications.filter((item) => !item.readAt).map((item) => item.id);

  const handleOpenNotification = async (notification: NotificationItem) => {
    if (!notification.readAt) {
      try {
        await markRead.mutateAsync({ notificationId: notification.id, input: { read: true } });
      } catch (error) {
        showToast(getApiErrorMessage(error) || 'Failed to mark notification as read.', 'error');
      }
    }

    onClose();

    if (notification.target.type === 'issue' && notification.target.publicId) {
      setSelectedIssueId(notification.target.publicId);
      return;
    }

    navigate(notification.target.url || '/inbox');
  };

  const handleMarkVisibleRead = async () => {
    if (unreadIds.length === 0) return;
    try {
      await markBatchRead.mutateAsync({ ids: unreadIds });
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to mark notifications as read.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (error) {
      showToast(getApiErrorMessage(error) || 'Failed to mark all notifications as read.', 'error');
    }
  };

  const handleOpenInbox = () => {
    onClose();
    navigate('/inbox');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute right-0 top-12 z-[95] w-[430px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-border-dark dark:bg-card-dark"
        >
          <div className="border-b border-gray-200 px-4 py-4 dark:border-border-dark">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                <p className="mt-1 text-xs text-gray-400">Stay on top of assignments, mentions, and updates.</p>
              </div>
              <div className="relative z-20">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                  <MoreHorizontal size={16} />
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 top-10 z-30 min-w-[180px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl dark:border-border-dark dark:bg-card-dark">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void handleMarkVisibleRead();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <CheckCheck size={15} />
                      Mark visible read
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        void handleMarkAllRead();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <CheckCheck size={15} />
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleOpenInbox();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <ExternalLink size={15} />
                      Open inbox
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-primary/40 focus:ring-1 focus:ring-primary/10 dark:border-border-dark dark:bg-white/5"
                />
              </div>
              <button
                type="button"
                onClick={() => setUnreadOnly((current) => !current)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  unreadOnly
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-primary/20 hover:text-primary dark:border-border-dark dark:text-gray-300'
                }`}
              >
                <Filter size={14} />
                Unread
              </button>
            </div>

            <div className="mt-4 flex gap-5 border-b border-gray-200 dark:border-border-dark">
              {tabLabel.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="max-h-[520px] overflow-y-auto">
            {notificationsQuery.isLoading ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-border-dark">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleOpenNotification(notification)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] ${
                      !notification.readAt ? 'bg-primary/[0.04] dark:bg-primary/10' : ''
                    }`}
                  >
                    <div className="relative mt-0.5 shrink-0">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                          {normalizeNotificationMessageForDisplay(notification)}
                        </p>
                        {!notification.readAt && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        {notification.target.publicId ? <span className="font-medium text-gray-500 dark:text-gray-300">{notification.target.publicId}</span> : null}
                        <span>{relativeNotificationTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {notificationsQuery.isFetchingNextPage && (
                  <div className="flex items-center justify-center px-4 py-4 text-xs text-gray-400">
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Loading more...
                  </div>
                )}

                {!notificationsQuery.hasNextPage && notifications.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-4 text-center text-[11px] font-medium text-gray-400 dark:border-border-dark">
                    No more notifications
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5">
                  <Inbox size={24} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nothing new here</h3>
                <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-gray-400">
                  {unreadOnly ? 'No unread notifications match the current view.' : 'Your latest notifications will appear here.'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
