import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  Save, 
  Plus, 
  User, 
  Calendar, 
  Tag, 
  Flag, 
  Layers, 
  RotateCcw, 
  Hash,
  Paperclip,
  CheckSquare,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Code,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../AppContext';
import { MOCK_PROJECTS, MOCK_USERS, PRIORITY_COLORS, STATUS_LABELS } from '../constants';
import { Priority, Status } from '../types';
import { motion } from 'motion/react';

export const CreateIssuePage: React.FC = () => {
  const { setView, showToast } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(MOCK_PROJECTS[0].id);
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) {
      showToast('Please enter an issue title', 'error');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Issue created successfully');
      setView('issues');
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-bg-dark">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-10 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('issues')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-gray-200 dark:border-border-dark" />
          <input 
            type="text" 
            placeholder="Issue title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold bg-transparent border-none outline-none w-96 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium text-gray-500 transition-colors">
            <Save size={16} />
            <span>Save draft</span>
          </button>
          <button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            <span>Create Issue</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Section - Editor */}
        <div className="flex-1 overflow-y-auto p-8 border-r border-gray-200 dark:border-border-dark scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Rich Text Editor Mock */}
            <div className="space-y-4">
              <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-border-dark">
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Bold size={16} /></button>
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Italic size={16} /></button>
                <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><List size={16} /></button>
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><LinkIcon size={16} /></button>
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Code size={16} /></button>
                <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><ImageIcon size={16} /></button>
              </div>
              <textarea 
                placeholder="Add description..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-64 bg-transparent border-none outline-none resize-none text-gray-700 dark:text-gray-300 leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Subtasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <CheckSquare size={14} />
                  Subtasks
                </h3>
                <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                  <Plus size={12} /> Add subtask
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-border-dark p-4 text-center text-sm text-gray-400 border-dashed">
                No subtasks yet.
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Paperclip size={14} />
                Attachments
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <button className="aspect-square rounded-xl border-2 border-dashed border-gray-200 dark:border-border-dark flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary/50 hover:text-primary transition-all group">
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase">Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Metadata */}
        <div className="w-80 bg-gray-50/50 dark:bg-black/10 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Project</span>
              <div className="relative">
                <select 
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {MOCK_PROJECTS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Priority</span>
                <div className="relative">
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Status</span>
                <div className="relative">
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Assignee</span>
              <div className="relative">
                <select 
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Unassigned</option>
                  {MOCK_USERS.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Due Date</span>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </label>

            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Estimate</span>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="Points"
                  className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </label>

            <div className="pt-4 border-t border-gray-200 dark:border-border-dark">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {['bug', 'feature', 'ui', 'backend'].map(label => (
                  <button key={label} className="px-2 py-1 rounded bg-gray-100 dark:bg-white/5 text-[10px] font-bold uppercase text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors">
                    {label}
                  </button>
                ))}
                <button className="p-1 rounded bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-primary transition-colors">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
