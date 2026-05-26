import React from 'react';
import { ActivityTimeline } from '../components/ActivityTimeline';
import type { ActivityScope } from '../types';

type ActivityPageProps = {
  scope?: ActivityScope;
  scopeId?: string;
  title?: string;
};

export const ActivityPage: React.FC<ActivityPageProps> = ({
  scope = 'workspace',
  scopeId,
  title = 'Activity',
}) => <ActivityTimeline scope={scope} scopeId={scopeId} title={title} />;
