import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  User, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  ExternalLink, 
  ChevronDown, 
  Send, 
  Plus, 
  CheckSquare, 
  Bug, 
  Zap,
  MessageSquare,
  History,
  Paperclip,
  Share2,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { MOCK_ISSUES, MOCK_USERS, MOCK_PROJECTS, PRIORITY_COLORS, STATUS_LABELS, ISSUE_TYPE_CONFIG } from '../constants';
import { Status, Priority, IssueType, Issue } from '../types';
import { getStoredIssues, updateStoredIssue } from '../lib/issue-storage';
import { SubtaskList } from '../features/issues/components/SubtaskList';

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

export const IssueDetailPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { showToast, setSelectedIssueId } = useApp();
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const [comment, setComment] = useState('');

  // Close side panel when entering full page
  useEffect(() => {
    setSelectedIssueId(null);
  }, [setSelectedIssueId]);

  const issue = useMemo(() => {
    const all = [...MOCK_ISSUES, ...getStoredIssues()];
    return all.find(i => i.id === issueId);
  }, [issueId]);

  const project = useMemo(() => 
    MOCK_PROJECTS.find(p => p.id === issue?.projectId), 
  [issue?.projectId]);

  const assignee = useMemo(() => 
    MOCK_USERS.find(u => u.id === issue?.assigneeId), 
  [issue?.assigneeId]);

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-xl font-bold">Issue not found</h1>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 text-primary font-medium hover:underline flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          Go back
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      showToast('Issue deleted successfully');
      navigate(-1);
    }
  };

  const handleCommentSubmit = () => {
    if (!comment.trim()) return;
    showToast('Comment added');
    setComment('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-white dark:bg-bg-dark overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-6 shrink-0 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 truncate">
            <span className="hover:text-primary cursor-pointer transition-colors truncate">{project?.name || 'No Project'}</span>
            <span className="shrink-0">/</span>
            <span className="font-mono shrink-0">{issue.id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
            <Share2 size={18} />
          </button>
          <div className="relative group">
            <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
              <MoreHorizontal size={18} />
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-xl py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button 
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={16} />
                Delete Issue
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area (Left) */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Title & Type */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <TypeBadge type={issue.type || 'task'} />
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <span>Created by</span>
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
                    <img src={MOCK_USERS.find(u => u.id === issue.creatorId)?.avatar} className="w-4 h-4 rounded-full" alt="" />
                    <span>{MOCK_USERS.find(u => u.id === issue.creatorId)?.name}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 leading-tight">
                {issue.title}
              </h1>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 leading-relaxed min-h-[100px] p-4 -mx-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-text">
                {issue.description || 'No description provided.'}
              </div>
            </div>

            {/* Dynamic Fields based on Type */}
            {issue.type === 'bug' && (
              <div className="space-y-8 pt-8 border-t border-gray-100 dark:border-border-dark">
                {issue.stepsToReproduce && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Steps to Reproduce</h4>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                      {issue.stepsToReproduce}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {issue.expectedBehavior && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Expected Behavior</h4>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {issue.expectedBehavior}
                      </div>
                    </div>
                  )}
                  {issue.actualBehavior && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Actual Behavior</h4>
                      <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {issue.actualBehavior}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {issue.type === 'issue' && issue.acceptanceCriteria && (
              <div className="space-y-4 pt-8 border-t border-gray-100 dark:border-border-dark">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Acceptance Criteria</h4>
                <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                  {issue.acceptanceCriteria}
                </div>
              </div>
            )}

            {/* Subtasks */}
            <div className="pt-8 border-t border-gray-100 dark:border-border-dark">
              <SubtaskList issue={issue} />
            </div>

            {/* Discussion & Activity Section */}
            <div className="pt-10 space-y-8">
              <div className="flex gap-8 border-b border-gray-100 dark:border-border-dark">
                <button 
                  onClick={() => setActiveTab('comments')}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'comments' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Discussion
                  {activeTab === 'comments' && <motion.div layoutId="activeTabDetail" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'activity' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Activity
                  {activeTab === 'activity' && <motion.div layoutId="activeTabDetail" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'comments' ? (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Comment Input */}
                    <div className="flex gap-4">
                      <img src={MOCK_USERS[0].avatar} className="w-8 h-8 rounded-full shrink-0" alt="" />
                      <div className="flex-1 space-y-3">
                        <textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                              <Paperclip size={18} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                              <Plus size={18} />
                            </button>
                          </div>
                          <button 
                            onClick={handleCommentSubmit}
                            disabled={!comment.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                          >
                            <Send size={16} />
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mock Comments */}
                    <div className="space-y-8">
                      <div className="flex gap-4">
                        <img src={MOCK_USERS[1].avatar} className="w-8 h-8 rounded-full shrink-0" alt="" />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">Sarah Chen</span>
                            <span className="text-xs text-gray-400">2 hours ago</span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            I've reviewed the requirements and started the initial implementation. The core logic should be ready by tomorrow.
                          </div>
                          <div className="flex items-center gap-4 pt-1">
                            <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors">Reply</button>
                            <button className="text-xs font-bold text-gray-400 hover:text-primary transition-colors">React</button>
                          </div>
                        </div>
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
                      { user: 'Alex Rivera', action: 'assigned to', value: 'Sarah Chen', time: '5h ago' },
                      { user: 'Alex Rivera', action: 'created issue', value: '', time: '1d ago' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-6 relative pb-8 last:pb-0">
                        {/* Timeline Node */}
                        <div className="mt-2 w-3.5 h-3.5 rounded-full bg-white dark:bg-bg-dark border-2 border-gray-200 dark:border-white/10 shrink-0 relative z-10 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        </div>
                        
                        <div className="flex-1 flex items-center justify-between pt-1">
                          <div className="text-sm">
                            <span className="font-bold text-gray-900 dark:text-gray-100">{item.user}</span>
                            <span className="text-gray-400 mx-2">{item.action}</span>
                            {item.value && <span className="font-bold text-primary">{item.value}</span>}
                          </div>
                          <span className="text-xs text-gray-400">{item.time}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Metadata Panel (Right) */}
        <aside className="w-[320px] border-l border-gray-200 dark:border-border-dark bg-gray-50/30 dark:bg-black/10 overflow-y-auto hidden xl:block">
          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Properties</h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    Status
                  </span>
                  <div className="relative group">
                    <select 
                      value={issue.status}
                      onChange={(e) => showToast(`Status updated to ${STATUS_LABELS[e.target.value as Status]}`)}
                      className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none appearance-none cursor-pointer transition-all"
                    >
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Priority
                  </span>
                  <div className="relative group">
                    <select 
                      value={issue.priority}
                      onChange={(e) => showToast(`Priority updated to ${e.target.value}`)}
                      className={`w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none appearance-none cursor-pointer transition-all ${PRIORITY_COLORS[issue.priority]}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <User size={14} />
                    Assignee
                  </span>
                  <div className="relative group">
                    <select 
                      value={issue.assigneeId || ''}
                      onChange={() => showToast(`Assignee updated`)}
                      className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Unassigned</option>
                      {MOCK_USERS.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none opacity-0 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                  <span className="text-xs text-gray-400 flex items-center gap-2">
                    <Calendar size={14} />
                    Due Date
                  </span>
                  <input 
                    type="date"
                    value={issue.dueDate || ''}
                    onChange={(e) => showToast(`Due date updated`)}
                    className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer transition-all"
                  />
                </div>

                <div className="grid grid-cols-[100px_1fr] items-start gap-4">
                  <span className="text-xs text-gray-400 flex items-center gap-2 mt-1.5">
                    <Tag size={14} />
                    Labels
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {issue.labels.map(label => (
                      <span key={label} className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-500 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                        {label}
                      </span>
                    ))}
                    <button className="p-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary transition-colors">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};
