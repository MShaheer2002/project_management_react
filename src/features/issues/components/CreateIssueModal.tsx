import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Modal } from '@/src/components/modals/Modal';
import { useApp } from '@/src/AppContext';
import { MOCK_PROJECTS, MOCK_USERS } from '@/src/constants';
import { Priority } from '@/src/types';
import { Tag, Paperclip, ChevronDown, Loader2, CheckSquare } from 'lucide-react';
import { RichTextEditor } from '@/src/components/RichTextEditor';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'Project is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export const CreateIssueModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: MOCK_PROJECTS[0].id,
      priority: 'medium',
      assigneeId: '',
      title: '',
      description: '',
      dueDate: '',
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    // Simulate API call
    console.log('Submitting task:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showToast('Task added successfully');
    setActiveModal(null);
    reset();
  };

  return (
    <Modal
      isOpen={activeModal === 'create-task'}
      onClose={() => setActiveModal(null)}
      title="Create new task"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
            errors.title ? 'bg-red-50 border-red-200' : 'bg-primary/5 border-primary/20'
          }`}>
            <CheckSquare size={20} className={errors.title ? 'text-red-500' : 'text-primary'} />
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
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
                placeholder="Add some details..."
                minHeight="100px"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Project</label>
            <div className="relative">
              <select
                {...register('projectId')}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                {MOCK_PROJECTS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-[white]"
              style={{ colorScheme: 'dark' }}
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
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-primary transition-colors">
            <Tag size={18} />
          </button>
          <button type="button" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-primary transition-colors">
            <Paperclip size={18} />
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
            Create Task
          </button>
        </div>
      </form>
    </Modal>
  );
};
