import React from 'react';
import { ActivityPage as ActivityFeaturePage } from '@features/activity';
import type { Activity } from '@/types';
import type { ActivityScope } from '@features/activity';

interface ActivityPageProps {
  activities?: Activity[];
  title?: string;
  scope?: ActivityScope;
  scopeId?: string;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({
  title = 'Activity',
  scope = 'workspace',
  scopeId,
}) => <ActivityFeaturePage title={title} scope={scope} scopeId={scopeId} />;
