import React from 'react';
import { useApp } from '../../AppContext';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateIssueModal } from '../../features/issues/components/CreateIssueModal';
import { CreateCycleModal } from './CreateCycleModal';
import { CreateTeamModal } from './CreateTeamModal';
import { InviteMemberModal } from './InviteMemberModal';
import { GenerateApiKeyModal } from './GenerateApiKeyModal';

import { CreateDepartmentModal } from './CreateDepartmentModal';

export const ModalManager: React.FC = () => {
  const { activeModal } = useApp();

  if (!activeModal) return null;

  return (
    <>
      {activeModal === 'create-project' && <CreateProjectModal />}
      {activeModal === 'create-issue' && <CreateIssueModal />}
      {activeModal === 'create-cycle' && <CreateCycleModal />}
      {activeModal === 'create-team' && <CreateTeamModal />}
      {activeModal === 'create-department' && <CreateDepartmentModal />}
      {activeModal === 'invite-member' && <InviteMemberModal />}
      {activeModal === 'generate-api-key' && <GenerateApiKeyModal />}
    </>
  );
};
