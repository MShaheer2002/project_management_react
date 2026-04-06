import React, { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Clock, AlertCircle, Plus, Filter, Search, MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_ISSUES, MOCK_PROJECTS, PRIORITY_COLORS, STATUS_LABELS } from '../constants';
import { CreatedTask } from '../types';
import { getStoredTasks } from '../lib/task-storage';

export const MyTasksPage: React.FC = () => {
  const { currentUser, setSelectedIssueId } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'assigned' | 'created' | 'completed'>('assigned');
  const [search, setSearch] = useState('');
  const [storedTasks, setStoredTasks] = useState<CreatedTask[]>([]);

  useEffect(() => {
    setStoredTasks(getStoredTasks());
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'created_tasks') {
        setStoredTasks(getStoredTasks());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const allTasks = useMemo(() => {
    return [...storedTasks, ...MOCK_ISSUES];
  }, [storedTasks]);

  const myIssues = allTasks.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || 
                         issue.id.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === 'assigned') return issue.assigneeId === currentUser?.id && issue.status !== 'done' && matchesSearch;
    if (activeTab === 'created') return issue.creatorId === currentUser?.id && matchesSearch;
    if (activeTab === 'completed') return issue.assigneeId === currentUser?.id && issue.status === 'done' && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">My Tasks</h1>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">{myIssues.length} tasks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button 
            onClick={() => navigate('/tasks/new')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      <div className="flex gap-8 px-6 border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-black/10">
        <button 
          onClick={() => setActiveTab('assigned')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'assigned' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Assigned to Me
          {activeTab === 'assigned' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('created')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'created' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Created by Me
          {activeTab === 'created' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('completed')}
          className={`py-3 text-sm font-medium transition-colors relative ${activeTab === 'completed' ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Completed
          {activeTab === 'completed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {myIssues.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-border-dark">
            {myIssues.map(issue => {
              const project = MOCK_PROJECTS.find(p => p.id === issue.projectId);
              return (
                <div 
                  key={issue.id}
                  onClick={() => {
                    if (MOCK_ISSUES.some(mockIssue => mockIssue.id === issue.id)) {
                      setSelectedIssueId(issue.id);
                    }
                  }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${issue.priority === 'urgent' ? 'bg-red-500' : 'bg-primary'}`} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{issue.title}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-mono uppercase">
                        <span>{issue.id}</span>
                        <span>•</span>
                        <span>{project?.name}</span>
                        <span>•</span>
                        <span>{STATUS_LABELS[issue.status]}</span>
                        {'subtasks' in issue && issue.subtasks.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{issue.subtasks.filter(subtask => subtask.completed).length}/{issue.subtasks.length} subtasks</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${PRIORITY_COLORS[issue.priority]}`}>
                      {issue.priority}
                    </span>
                    <span className="text-xs text-gray-400 w-24 text-right">
                      {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'No due date'}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                        <CheckCircle2 size={16} />
                      </button>
                      <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <CheckSquare size={32} />
            </div>
            <h1 className="text-xl font-bold">No tasks found</h1>
            <p className="text-sm text-gray-400 mt-2 max-w-xs">You're all caught up! Enjoy your free time or create a new task.</p>
          </div>
        )}
      </div>
    </div>
  );
};
