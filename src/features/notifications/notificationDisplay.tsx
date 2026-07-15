import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  MessageSquare,
  UserPlus,
  Users,
} from 'lucide-react';
import type { NotificationItem } from './types';

export const relativeNotificationTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absSec < 60) return rtf.format(diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  const diffDay = Math.round(diffHr / 24);
  return rtf.format(diffDay, 'day');
};

export const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'MENTION':
      return <MessageSquare size={14} className="text-orange-500" />;
    case 'ASSIGNMENT':
      return <UserPlus size={14} className="text-blue-500" />;
    case 'UPDATE':
      return <CheckCircle2 size={14} className="text-green-500" />;
    case 'COMMENT_REPLY':
      return <MessageSquare size={14} className="text-violet-500" />;
    case 'PROJECT_MEMBER':
    case 'TEAM_MEMBER':
      return <Users size={14} className="text-purple-500" />;
    case 'WORKSPACE_INVITE':
    case 'WORKSPACE_INVITATION':
      return <Bell size={14} className="text-sky-500" />;
    case 'ISSUE_DUE_SOON':
      return <Clock3 size={14} className="text-amber-500" />;
    case 'ISSUE_OVERDUE':
      return <AlertTriangle size={14} className="text-red-500" />;
    default:
      return <Bell size={14} className="text-gray-400" />;
  }
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISSUE_KEY_REGEX = /^[A-Z][A-Z0-9]*-\d+$/i;

const isUuid = (value: string) => UUID_REGEX.test(value.trim());

const asMeaningfulRef = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (isUuid(normalized)) return null;
  return normalized;
};

export const extractNotificationEntityId = (notification: NotificationItem): string | null => {
  const metadata = notification.metadata ?? {};
  const entityId = metadata.entityId;
  const issueId = metadata.issueId;
  const entityTitle = metadata.entityTitle;
  const projectId = metadata.projectId;
  const teamId = metadata.teamId;

  if (typeof notification.target.id === "string" && ISSUE_KEY_REGEX.test(notification.target.id.trim())) {
    return notification.target.id.trim();
  }
  if (typeof entityId === 'string' && ISSUE_KEY_REGEX.test(entityId.trim())) return entityId.trim();
  if (typeof issueId === 'string' && ISSUE_KEY_REGEX.test(issueId.trim())) return issueId.trim();
  if (notification.target.publicId?.trim() && ISSUE_KEY_REGEX.test(notification.target.publicId.trim())) {
    return notification.target.publicId.trim();
  }

  return (
    asMeaningfulRef(projectId) ??
    asMeaningfulRef(teamId) ??
    asMeaningfulRef(entityTitle) ??
    asMeaningfulRef(notification.target.id) ??
    asMeaningfulRef(notification.target.publicId)
  );
};

export const normalizeNotificationMessageForDisplay = (notification: NotificationItem): string => {
  const raw = notification.message || notification.title;
  const entityId = extractNotificationEntityId(notification);
  if (!entityId) return raw;

  return raw.replace(/issue\s+[0-9a-f]{8}-[0-9a-f-]{27}/gi, `issue ${entityId}`);
};
