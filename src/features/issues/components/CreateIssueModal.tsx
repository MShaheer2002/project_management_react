import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Modal } from '@/components/modals/Modal';
import { useApp } from '@/AppContext';
import { ISSUE_TYPE_CONFIG } from '@/constants';
import { Priority, IssueType, Severity, IssueAttachment } from '@/types';
import { Tag, ChevronDown, Loader2, CheckSquare, Bug, Zap } from 'lucide-react';
import { getApiErrorMessage } from '@shared/services';
import { useCycles } from '@features/cycles';
import { useProjectOptions } from '@features/projects';
import { useWorkspaceMemberOptions } from '@features/workspace';
import { RichTextEditor } from '@/components/RichTextEditor';
import { IssueAttachmentsField } from './IssueAttachmentsField';
import { useCheckIssueAssignmentEligibility, useCreateIssue } from '../hooks/useIssueData';
import { useProjectAssignmentGuard } from '../hooks/useProjectAssignmentGuard';

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'issue']),
  projectId: z.string().min(1, 'Project is required'),
  cycleId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

export const CreateIssueModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [attachments, setAttachments] = useState<IssueAttachment[]>([]);
  const projectOptionsQuery = useProjectOptions({
    sort: 'name:asc',
    limit: 100,
  });
  const assigneeOptionsQuery = useWorkspaceMemberOptions(
    {
      sort: 'name:asc',
      limit: 100,
    },
    { enabled: activeModal === 'create-issue' }
  );
  const createIssue = useCreateIssue();
  const checkAssignmentEligibility = useCheckIssueAssignmentEligibility();
  const projectOptions = projectOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const selectedProject = projectOptions.find((project) => project.id === watch('projectId'));
  const cyclesQuery = useCycles(
    {
      teamId: selectedProject?.teamId,
      sort: 'number:desc',
      limit: 50,
    },
    { enabled: activeModal === 'create-issue' && Boolean(selectedProject?.teamId) }
  );
  const availableCycles = (cyclesQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((cycle) => cycle.status !== 'COMPLETED');
  const assigneeOptions = assigneeOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const { dialog: projectAssignmentDialog, openAssignmentDialog, handleAssignmentError } = useProjectAssignmentGuard();
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      projectId: '',
      cycleId: '',
      priority: 'medium',
      assigneeId: '',
      title: '',
      description: '',
      dueDate: '',
      type: 'task',
      severity: 'medium',
    },
  });

  const selectedType = watch('type');

  React.useEffect(() => {
    const currentCycleId = watch('cycleId');
    if (!currentCycleId) return;
    if (availableCycles.some((cycle) => cycle.id === currentCycleId)) return;
    setValue('cycleId', '');
  }, [availableCycles, setValue, watch]);

  React.useEffect(() => {
    if (projectOptions.length === 0) return;
    if (watch('projectId')) return;
    setValue('projectId', projectOptions[0].id, { shouldValidate: true });
  }, [projectOptions, setValue, watch]);

  const onSubmit = async (data: IssueFormData) => {
    const payload = {
      title: data.title,
      description: data.description || '',
      type: data.type,
      status: 'todo' as const,
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      projectId: data.projectId,
      cycleId: data.cycleId || null,
      severity: data.type === 'bug' ? data.severity : undefined,
      dueDate: data.dueDate || null,
      attachments: attachments.map((attachment) => ({
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        size: attachment.size,
        kind: attachment.kind,
        key: attachment.key,
        assetUrl: attachment.assetUrl ?? null,
        reference: attachment.reference,
      })),
    };

    try {
      if (data.assigneeId) {
        const eligibility = await checkAssignmentEligibility.mutateAsync({
          projectId: data.projectId,
          assigneeId: data.assigneeId,
        });

        if (!eligibility.projectMember) {
          openAssignmentDialog({
            assigneeId: data.assigneeId,
            assigneeName: assigneeOptions.find((member) => member.id === data.assigneeId)?.name ?? 'Selected member',
            projectId: data.projectId,
            projectName: eligibility.projectName,
            canAutoAdd: eligibility.canAutoAdd,
            confirmLabel: 'Add to project and create issue',
            retry: async () => {
              await createIssue.mutateAsync(payload);
              showToast('Issue added successfully');
              setActiveModal(null);
              reset();
              setAttachments([]);
            },
          });
          return;
        }
      }

      await createIssue.mutateAsync(payload);

      showToast('Issue added successfully');
      setActiveModal(null);
      reset();
      setAttachments([]);
    } catch (error) {
      const nextAssignee = assigneeOptions.find((member) => member.id === data.assigneeId);
      const didHandleProjectMembership = Boolean(
        data.assigneeId
          && data.projectId
          && handleAssignmentError(error, {
            assigneeId: data.assigneeId,
            assigneeName: nextAssignee?.name ?? 'Selected member',
            projectId: data.projectId,
            projectName: projectOptions.find((project) => project.id === data.projectId)?.name ?? 'this project',
            retry: async () => {
              await createIssue.mutateAsync(payload);
              showToast('Issue added successfully');
              setActiveModal(null);
              reset();
              setAttachments([]);
            },
          }),
      );

      if (didHandleProjectMembership) {
        return;
      }

      showToast(getApiErrorMessage(error) || 'Failed to create issue.', 'error');
    }
  };

  return (
    <Modal
      isOpen={activeModal === 'create-issue'}
      onClose={() => {
        setActiveModal(null);
        setAttachments([]);
      }}
      title="Create new issue"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Type Selector */}
          <div className="flex gap-2 mb-4">
            {(['task', 'bug', 'issue'] as IssueType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue('type', t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${
                  selectedType === t 
                    ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                    : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {t === 'task' && <CheckSquare size={14} />}
                {t === 'bug' && <Bug size={14} />}
                {t === 'issue' && <Zap size={14} />}
                <span className="text-xs font-bold capitalize">{t}</span>
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            errors.title ? 'bg-red-50 border-red-200' : 'bg-primary/5 border-primary/20'
          }`}>
            {selectedType === 'task' && <CheckSquare size={20} className={errors.title ? 'text-red-500' : 'text-primary'} />}
            {selectedType === 'bug' && <Bug size={20} className={errors.title ? 'text-red-500' : 'text-primary'} />}
            {selectedType === 'issue' && <Zap size={20} className={errors.title ? 'text-red-500' : 'text-primary'} />}
            <input
              autoFocus
              type="text"
              placeholder={`What's the ${selectedType}?`}
              {...register('title')}
              className="flex-1 bg-transparent border-none outline-none text-base font-semibold placeholder:text-primary/30"
            />
          </div>
          {errors.title && <p className="text-xs text-red-500 ml-11">{errors.title.message}</p>}
          
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor 
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={`Add some ${selectedType} details...`}
                minHeight="100px"
              />
            )}
          />
        </div>

        {selectedType === 'bug' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Severity</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue('severity', s)}
                  className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                    watch('severity') === s 
                      ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm' 
                      : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Project</label>
            <div className="relative">
              <select
                {...register('projectId')}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Priority</label>
            <div className="relative">
              <select
                {...register('priority')}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cycle</label>
            <div className="relative">
              <select
                {...register('cycleId')}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
                disabled={!selectedProject || cyclesQuery.isLoading}
              >
                <option value="">
                  {cyclesQuery.isLoading
                    ? 'Loading cycles...'
                    : availableCycles.length > 0
                      ? 'Backlog / No cycle'
                      : 'No open cycles'}
                </option>
                {availableCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} · {cycle.status.toLowerCase()}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Assignee</label>
            <div className="relative">
              <select
                {...register('assigneeId')}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                <option value="">Unassigned</option>
                {assigneeOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <IssueAttachmentsField value={attachments} onChange={setAttachments} driveFolderContext={{}} />

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-primary transition-colors">
            <Tag size={18} />
          </button>
          
          <div className="flex-1" />
          
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Create Issue
          </button>
        </div>
      </form>
      {projectAssignmentDialog}
    </Modal>
  );
};
