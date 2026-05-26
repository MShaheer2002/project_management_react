export {
  notificationQueryKeys,
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useMarkNotificationsBatchRead,
} from './hooks/useNotificationData';
export { useNotificationRealtime, useIssueSocketRoom } from './hooks/useNotificationRealtime';

export type {
  ListNotificationsInput,
  MarkNotificationReadInput,
  MarkNotificationsBatchReadInput,
  NotificationActor,
  NotificationCategory,
  NotificationItem,
  NotificationTarget,
  NotificationTargetType,
  NotificationType,
  NotificationsListResult,
  UnreadNotificationsCount,
} from './types';
