import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Calendar, Tag, MoreHorizontal, MessageSquare, History, Paperclip, CheckCircle2, AlertCircle, Clock, Trash2, ExternalLink, ChevronDown, Send, Plus, CheckSquare, Bug, Zap, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '@/AppContext';
import { MOCK_ISSUES, MOCK_USERS, PRIORITY_COLORS, STATUS_LABELS, ISSUE_TYPE_CONFIG } from '@/constants';
import { Status, Priority, IssueType } from '@/types';
import { getStoredIssues, updateStoredIssue } from '@/lib/issue-storage';
import { SubtaskList } from '@/features/issues/components/SubtaskList';

const TypeBadge: React.FC<{ type: IssueType }> = ({ type }) => {
  const config = ISSUE_TYPE_CONFIG[type];
  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
      {type === 'task' && <CheckSquare size={12} />}
      {type === 'bug' && <Bug size={12} />}
      {type === 'issue' && <Zap size={12} />}
      {config.label}
    </span>
  );
};

export const ContextPanel: React.FC = () => {
  const { selectedIssueId, setSelectedIssueId, showToast } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [comment, setComment] = useState('');
  
  const issue = React.useMemo(() => {
    const all = [...MOCK_ISSUES, ...getStoredIssues()];
    return all.find(i => i.id === selectedIssueId);
  }, [selectedIssueId]);

  const assignee = MOCK_USERS.find(u => u.id === issue?.assigneeId);

  if (!selectedIssueId) return null;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      showToast('Issue deleted successfully');
      setSelectedIssueId(null);
    }
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    showToast('Comment added');
    setComment('');
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 w-[450px] h-full bg-white dark:bg-sidebar-dark border-l border-gray-200 dark:border-border-dark shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
            <span>{issue?.id}</span>
          </div>
          <div className="h-4 w-px bg-gray-200 dark:bg-border-dark" />
          <button 
            onClick={() => {
              navigate(`/issues/${issue?.id}`);
              setSelectedIssueId(null);
            }}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-primary transition-colors"
          >
            <Maximize2 size={12} />
            Open Full Page
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDelete}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete issue"
          >
            <Trash2 size={18} />
          </button>
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
            <MoreHorizontal size={18} />
          </button>
          <button 
            onClick={() => setSelectedIssueId(null)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Title & Description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TypeBadge type={issue?.type || 'task'} />
          </div>
          <div className="group relative">
            <h2 className="text-xl font-semibold leading-tight pr-8 group-hover:text-primary transition-colors cursor-pointer">
              {issue?.title}
            </h2>
          </div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed min-h-[60px] hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg transition-all cursor-text">
            {issue?.description || 'No description provided.'}
          </div>

          {issue?.type === 'bug' && (
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-border-dark">
              {issue.stepsToReproduce && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Steps to Reproduce</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{issue.stepsToReproduce}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {issue.expectedBehavior && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Expected</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{issue.expectedBehavior}</p>
                  </div>
                )}
                {issue.actualBehavior && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Actual</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{issue.actualBehavior}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {issue?.type === 'issue' && issue.acceptanceCriteria && (
            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-border-dark">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Acceptance Criteria</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{issue.acceptanceCriteria}</p>
            </div>
          )}

          {issue && (
            <div className="pt-4 border-t border-gray-100 dark:border-border-dark">
              <SubtaskList issue={issue} />
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-y-6 text-sm">
          <div className="text-gray-400 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Status
          </div>
          <div className="relative group">
            <select 
              value={issue?.status}
              onChange={(e) => showToast(`Status updated to ${STATUS_LABELS[e.target.value as Status]}`)}
              className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1 text-xs font-medium outline-none appearance-none cursor-pointer transition-all"
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
          </div>

          <div className="text-gray-400 flex items-center gap-2">
            <AlertCircle size={14} />
            Priority
          </div>
          <div className="relative group">
            <select 
              value={issue?.priority}
              onChange={(e) => showToast(`Priority updated to ${e.target.value}`)}
              className={`w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1 text-xs font-medium outline-none appearance-none cursor-pointer transition-all ${PRIORITY_COLORS[issue?.priority || 'low']}`}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
          </div>

          <div className="text-gray-400 flex items-center gap-2">
            <User size={14} />
            Assignee
          </div>
          <div className="relative group">
            <select 
              value={issue?.assigneeId || ''}
              onChange={(e) => showToast(`Assignee updated`)}
              className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1 text-xs font-medium outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="">Unassigned</option>
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
          </div>

          <div className="text-gray-400 flex items-center gap-2">
            <Calendar size={14} />
            Due Date
          </div>
          <div className="relative group">
            <input 
              type="date"
              value={issue?.dueDate || ''}
              onChange={(e) => showToast(`Due date updated to ${e.target.value}`)}
              className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1 text-xs font-medium outline-none cursor-pointer transition-all"
            />
          </div>

          <div className="text-gray-400 flex items-center gap-2">
            <Tag size={14} />
            Labels
          </div>
          <div className="flex flex-wrap gap-1">
            {issue?.labels.map(label => (
              <span key={label} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                {label}
              </span>
            ))}
            <button className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary transition-colors">
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="pt-6">
          <div className="flex gap-6 border-b border-gray-200 dark:border-border-dark mb-4">
            <button 
              onClick={() => setActiveTab('comments')}
              className={`pb-2 text-sm font-medium transition-all relative ${activeTab === 'comments' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Comments
              {activeTab === 'comments' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
            <button 
              onClick={() => setActiveTab('activity')}
              className={`pb-2 text-sm font-medium transition-all relative ${activeTab === 'activity' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Activity
              {activeTab === 'activity' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {activeTab === 'comments' ? (
              <motion.div
                key="comments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    SC
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Sarah Chen</span>
                      <span className="text-[10px] text-gray-400">2h ago</span>
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      I've started working on the OAuth implementation. Will update the PR soon.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">
                    JD
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">John Doe</span>
                      <span className="text-[10px] text-gray-400">5h ago</span>
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      Looks good! Make sure to handle the token refresh logic properly.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-0 relative"
              >
                {/* Vertical Line - More subtle and aesthetic */}
                <div className="absolute left-[7px] top-3 bottom-3 w-[1.5px] bg-gray-100 dark:bg-white/[0.06] rounded-full" />

                {[
                  { user: 'Sarah Chen', action: 'changed status to', value: 'In Progress', time: '2h ago' },
                  { user: 'John Doe', action: 'assigned to', value: 'Sarah Chen', time: '5h ago' },
                  { user: 'John Doe', action: 'created issue', value: '', time: '1d ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-6 relative pb-8 last:pb-0">
                    {/* Timeline Node */}
                    <div className="mt-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-sidebar-dark border-2 border-gray-200 dark:border-white/10 shrink-0 relative z-10 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    </div>

                    <div className="flex-1 flex items-center justify-between pt-0.5">
                      <div className="text-xs">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{item.user}</span>
                        <span className="text-gray-400 mx-2">{item.action}</span>
                        {item.value && <span className="font-bold text-primary">{item.value}</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">{item.time}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Comment Input */}
      <div className="p-4 border-t border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-black/20">
        <div className="relative group">
          <textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-border-dark rounded-xl p-3 pb-12 text-sm min-h-[100px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-sm"
          />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
              <Paperclip size={16} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
              <Tag size={16} />
            </button>
          </div>
          <div className="absolute bottom-3 right-3">
            <button 
              onClick={handleCommentSubmit}
              disabled={!comment.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={14} />
              Comment
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
