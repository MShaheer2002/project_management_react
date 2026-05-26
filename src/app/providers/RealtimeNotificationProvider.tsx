import React from 'react';
import { useNotificationRealtime } from '@features/notifications';

export const RealtimeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useNotificationRealtime();
  return <>{children}</>;
};
