import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Users,
  Calendar as CalendarIcon, 
  Tag, 
  Flag, 
  Layers, 
  RotateCcw, 
  Hash,
  Paperclip,
  CheckSquare,
  Link as LinkIcon,
  ChevronDown,
  Trash2,
  Building2,
  Clock,
  Settings,
  MoreVertical,
  ChevronRight,
  Search,
  Check,
  AlertCircle,
  Bug,
  FileText,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { MOCK_USERS, STATUS_LABELS, MOCK_DEPARTMENTS, MOCK_TEAMS, ISSUE_TYPE_CONFIG } from '../constants';
import { Issue, IssueType, Priority, Status, Severity, IssueSubtask } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { RichTextEditor } from '../components/RichTextEditor';
import { generateNextIssueId, saveCreatedIssue } from '../lib/issue-storage';
import { useProjectOptions } from '@features/projects';

interface Subtask extends IssueSubtask {
  isEditing?: boolean;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

const AVAILABLE_LABELS: Label[] = [
  { id: 'l1', name: 'Bug', color: '#ef4444' },
  { id: 'l2', name: 'Feature', color: '#5f72ea' },
  { id: 'l3', name: 'Design', color: '#ec4899' },
  { id: 'l4', name: 'Backend', color: '#10b981' },
  { id: 'l5', name: 'Frontend', color: '#f59e0b' },
];

export const CreateIssuePage: React.FC = () => {
  const { showToast, currentUser } = useApp();
  const navigate = useNavigate();
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('task');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('todo');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [departmentId, setDepartmentId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('12:00');
  const [estimate, setEstimate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  // Bug Specific State
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  
  // Feature/Issue Specific State
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [relatedIssues, setRelatedIssues] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI State
  const [errors, setErrors] = useState<{ project?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const labelRef = useRef<HTMLDivElement>(null);
  const projectOptionsQuery = useProjectOptions({
    sort: 'name:asc',
    limit: 100,
  });
  const projectOptions = projectOptionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const project = projectOptions.find((item) => item.id === projectId);

  // Click outside for label dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (labelRef.current && !labelRef.current.contains(event.target as Node)) {
        setShowLabelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (projectOptions.length === 0) return;

    setProjectId((current) => {
      if (current && projectOptions.some((option) => option.id === current)) {
        return current;
      }

      return projectOptions[0].id;
    });
  }, [projectOptions]);

  // Validation
  const validate = () => {
    const newErrors: { project?: string } = {};
    if (!projectId) newErrors.project = 'Project selection is required';
    setErrors(newErrors);
    if (!title.trim()) {
      showToast('Please enter an issue title', 'error');
    } else if (newErrors.project) {
      showToast('Please select a project', 'error');
    }
    return title.trim().length > 0 && Object.keys(newErrors).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const dueDateTime = dueDate
        ? `${dueDate}T${dueTime || '00:00'}:00`
        : undefined;
      const cleanSubtasks = subtasks
        .map(subtask => ({ ...subtask, title: subtask.title.trim(), isEditing: false }))
        .filter(subtask => subtask.title.length > 0)
        .map(({ isEditing, ...rest }) => rest);
      const selectedLabelNames = selectedLabels
        .map(labelId => AVAILABLE_LABELS.find(label => label.id === labelId)?.name.toLowerCase())
        .filter((label): label is string => Boolean(label));

      const createdIssue: Issue = {
        id: generateNextIssueId(),
        title: title.trim(),
        description,
        type,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        creatorId: currentUser?.id || MOCK_USERS[0].id,
        projectId,
        teamId: project?.teamId || currentUser?.teamId || MOCK_TEAMS[0].id,
        labels: selectedLabelNames,
        dueDate: dueDateTime,
        createdAt: now,
        updatedAt: now,
        subtasks: cleanSubtasks,
        estimate: estimate ? Number(estimate) : undefined,
        departmentId: departmentId || project?.departmentId,
        dueTime: dueTime || undefined,
        
        // Bug specific
        stepsToReproduce: type === 'bug' ? stepsToReproduce : undefined,
        expectedBehavior: type === 'bug' ? expectedBehavior : undefined,
        actualBehavior: type === 'bug' ? actualBehavior : undefined,
        severity: type === 'bug' ? severity : undefined,
        
        // Issue specific
        acceptanceCriteria: type === 'issue' ? acceptanceCriteria : undefined,
        relatedIssues: type === 'issue' ? relatedIssues.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        notes: type === 'issue' ? notes : undefined,
      };

      saveCreatedIssue(createdIssue);
      setIsSubmitting(false);
      showToast(
        cleanSubtasks.length > 0
          ? `Issue created with ${cleanSubtasks.length} subtask${cleanSubtasks.length > 1 ? 's' : ''}`
          : 'Issue created successfully'
      );
      localStorage.removeItem('issue_draft'); 
      navigate('/issues');
    }, 1200);
  };

  // Subtask Management
  const addSubtask = () => {
    if (!newSubtask.trim()) {
      showToast('Subtask title cannot be empty', 'error');
      return;
    }
    const newTask: Subtask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newSubtask.trim(),
      completed: false,
      order: subtasks.length,
      isEditing: false
    };
    setSubtasks([...subtasks, newTask]);
    setNewSubtask('');
  };

  const updateSubtaskTitle = (id: string, newTitle: string) => {
    const cleaned = newTitle.trim();
    if (!cleaned) {
      setSubtasks(subtasks.filter(s => s.id !== id));
      showToast('Empty subtask removed', 'info');
      return;
    }

    setSubtasks(subtasks.map(s => s.id === id ? { ...s, title: cleaned, isEditing: false } : s));
  };

  const toggleSubtaskEdit = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  // Draft Logic
  useEffect(() => {
    const savedDraft = localStorage.getItem('issue_draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setType(draft.type || 'task');
        setProjectId(draft.projectId || '');
        setPriority(draft.priority || 'medium');
        setStatus(draft.status || 'todo');
        setAssigneeId(draft.assigneeId || undefined);
        setDepartmentId(draft.departmentId || '');
        setDueDate(draft.dueDate || '');
        setDueTime(draft.dueTime || '12:00');
        setEstimate(draft.estimate || '');
        setSelectedLabels(draft.selectedLabels || []);
        setSubtasks(draft.subtasks || []);
        setStepsToReproduce(draft.stepsToReproduce || '');
        setExpectedBehavior(draft.expectedBehavior || '');
        setActualBehavior(draft.actualBehavior || '');
        setSeverity(draft.severity || 'medium');
        setAcceptanceCriteria(draft.acceptanceCriteria || '');
        setRelatedIssues(draft.relatedIssues || '');
        setNotes(draft.notes || '');
      } catch (e) {
        console.error('Failed to load draft');
      }
    }
  }, []);

  const saveDraft = useCallback(() => {
    setIsSaving(true);
    const draft = {
      title,
      description,
      type,
      projectId,
      priority,
      status,
      assigneeId,
      departmentId,
      dueDate,
      dueTime,
      estimate,
      selectedLabels,
      subtasks,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      severity,
      acceptanceCriteria,
      relatedIssues,
      notes
    };
    localStorage.setItem('issue_draft', JSON.stringify(draft));
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 800);
  }, [title, description, type, projectId, priority, status, assigneeId, departmentId, dueDate, dueTime, estimate, selectedLabels, subtasks, stepsToReproduce, expectedBehavior, actualBehavior, severity, acceptanceCriteria, relatedIssues, notes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || description) saveDraft();
    }, 5000);
    return () => clearTimeout(timer);
  }, [title, description, subtasks, saveDraft]);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleCreate();
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, projectId]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex flex-col h-full bg-white dark:bg-bg-dark selection:bg-primary/20 overflow-hidden"
    >
      {/* Precision Header */}
      <header className="h-14 border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-50 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-6 flex-1">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 transition-all hover:text-primary active:scale-95"
            title="Cancel and return (Esc)"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex-1 max-w-4xl relative">
            <input 
              autoFocus
              type="text" 
              placeholder="Issue title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none w-full placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-all text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
            {isSaving ? (
              <span className="flex items-center gap-1.5 text-primary">
                <RotateCcw size={10} className="animate-spin" />
                SAVING...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-1.5 opacity-60">
                SAVED {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="opacity-40">DRAFT</span>
            )}
          </div>
          
          <button 
            onClick={handleCreate}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 group"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={18} className="transition-transform duration-300" />
            )}
            <span>Create Issue</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Section - Unified Editing Surface */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-white dark:bg-bg-dark">
          <div className="max-w-4xl mx-auto px-10 py-12 space-y-12 pb-32">
            
            {/* Type Selector */}
            <div className="space-y-6">
              <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Issue Type</label>
              <div className="flex gap-4">
                {(['task', 'bug', 'issue'] as IssueType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all ${
                      type === t 
                        ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {t === 'task' && <CheckSquare size={18} />}
                    {t === 'bug' && <Bug size={18} />}
                    {t === 'issue' && <Zap size={18} />}
                    <span className="text-sm font-bold capitalize">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Fields based on Type */}
            <div className="space-y-8">
              <div className="space-y-6">
                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Description</label>
                <RichTextEditor 
                  value={description}
                  onChange={setDescription}
                  placeholder={`Describe this ${type}...`}
                  minHeight="300px"
                />
              </div>

              {type === 'bug' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-8 border-t border-gray-100 dark:border-border-dark"
                >
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Steps to Reproduce</label>
                    <textarea 
                      value={stepsToReproduce}
                      onChange={(e) => setStepsToReproduce(e.target.value)}
                      placeholder="1. Go to...&#10;2. Click on...&#10;3. Observe..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Expected Behavior</label>
                      <textarea 
                        value={expectedBehavior}
                        onChange={(e) => setExpectedBehavior(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Actual Behavior</label>
                      <textarea 
                        value={actualBehavior}
                        onChange={(e) => setActualBehavior(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Severity</label>
                    <div className="flex gap-4">
                      {(['low', 'medium', 'high'] as Severity[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSeverity(s)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                            severity === s 
                              ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm' 
                              : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {type === 'issue' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 pt-8 border-t border-gray-100 dark:border-border-dark"
                >
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Acceptance Criteria</label>
                    <textarea 
                      value={acceptanceCriteria}
                      onChange={(e) => setAcceptanceCriteria(e.target.value)}
                      placeholder="What defines this feature as complete?"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Related Issues</label>
                    <input 
                      type="text"
                      value={relatedIssues}
                      onChange={(e) => setRelatedIssues(e.target.value)}
                      placeholder="LIN-101, LIN-102..."
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 block px-1">Optional Notes</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Subtasks System */}
            <div className="space-y-6 pt-12 border-t border-gray-100 dark:border-border-dark">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CheckSquare size={16} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Subtasks</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="h-1.5 w-32 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary" 
                      animate={{ width: `${subtasks.length > 0 ? (subtasks.filter(s => s.completed).length / subtasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {subtasks.filter(s => s.completed).length} / {subtasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {subtasks.map(subtask => (
                    <motion.div 
                      key={subtask.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-border-dark"
                    >
                      <button 
                        onClick={() => setSubtasks(subtasks.map(s => s.id === subtask.id ? { ...s, completed: !s.completed } : s))}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${subtask.completed ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        {subtask.completed && <Check size={12} strokeWidth={4} />}
                      </button>
                      
                      {subtask.isEditing ? (
                        <input 
                          autoFocus
                          type="text"
                          defaultValue={subtask.title}
                          onBlur={(e) => updateSubtaskTitle(subtask.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && updateSubtaskTitle(subtask.id, (e.target as HTMLInputElement).value)}
                          className="flex-1 bg-transparent text-sm font-medium outline-none text-primary"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => toggleSubtaskEdit(subtask.id)}
                          className={`text-sm flex-1 cursor-text ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300 font-medium'}`}
                        >
                          {subtask.title}
                        </span>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => toggleSubtaskEdit(subtask.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-primary transition-colors">
                          <Settings size={14} />
                        </button>
                        <button onClick={() => setSubtasks(subtasks.filter(s => s.id !== subtask.id))} className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-100 dark:border-border-dark focus-within:border-primary focus-within:bg-primary/5 focus-within:shadow-xl focus-within:shadow-primary/5 transition-all group">
                  <div className="w-5 h-5 rounded-lg border-2 border-gray-200 dark:border-gray-800 flex items-center justify-center group-focus-within:border-primary transition-colors">
                    <Plus size={10} className="text-gray-300 group-focus-within:text-primary" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add a subtask (Enter)..." 
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                  <button 
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                    className="px-4 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase opacity-0 group-focus-within:opacity-100 transition-all disabled:opacity-30 shadow-lg shadow-primary/25"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-6 pt-12 border-t border-gray-100 dark:border-border-dark">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Paperclip size={16} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">Attachments</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="aspect-video rounded-2xl border border-dashed border-gray-200 dark:border-border-dark flex flex-col items-center justify-center gap-3 text-gray-300 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all group cursor-pointer p-4 text-center">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-border-dark flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-sm">
                    <Plus size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide">Upload</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Metadata Sidebar */}
        <div className="w-[380px] bg-gray-50/20 dark:bg-black/10 overflow-y-auto p-10 border-l border-gray-100 dark:border-border-dark scrollbar-hide relative z-40">
          
          <div className="space-y-12">
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 px-1">Context Parameters</span>
                <div className="space-y-8 mt-6">
                  {/* Project Selection */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Layers size={13} className="text-primary" /> Project Source
                    </label>
                    <div className="relative group">
                      <select 
                        value={projectId}
                        onChange={(e) => {
                          setProjectId(e.target.value);
                          if (errors.project) setErrors({ ...errors, project: undefined });
                        }}
                        className={`w-full bg-gray-50 dark:bg-white/5 border px-5 py-4 text-sm font-medium rounded-2xl outline-none appearance-none transition-all ${
                          errors.project ? 'border-red-500 bg-red-50 dark:bg-red-500/5' : 'border-transparent focus:ring-2 focus:ring-primary/20 shadow-sm group-hover:bg-gray-100 dark:group-hover:bg-white/10'
                        }`}
                        disabled={projectOptionsQuery.isLoading || projectOptions.length === 0}
                      >
                        {projectOptionsQuery.isLoading ? (
                          <option value="">Loading projects...</option>
                        ) : projectOptions.length === 0 ? (
                          <option value="">No projects available</option>
                        ) : (
                          projectOptions.map((projectOption) => (
                            <option key={projectOption.id} value={projectOption.id}>
                              {projectOption.name}
                            </option>
                          ))
                        )}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  {/* Priority & Status Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                        <Flag size={13} className="text-primary" /> Priority
                      </label>
                      <div className="relative group">
                        <select 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as Priority)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                        <Hash size={13} className="text-primary" /> Status
                      </label>
                      <div className="relative group">
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Status)}
                          className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                        >
                          {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Users size={13} className="text-primary" /> Assignee
                    </label>
                    <div className="relative group">
                      <select
                        value={assigneeId || ''}
                        onChange={(e) => setAssigneeId(e.target.value || undefined)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all group-hover:bg-gray-100 dark:group-hover:bg-white/10"
                      >
                        <option value="">Unassigned</option>
                        {MOCK_USERS.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Labels Selector */}
                  <div className="space-y-3 relative" ref={labelRef}>
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Tag size={13} className="text-primary" /> Labels
                    </label>
                    <button 
                      onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                      className="w-full flex items-center flex-wrap gap-2 min-h-[56px] bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-3 text-sm shadow-sm hover:ring-2 hover:ring-primary/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-left group"
                    >
                      {selectedLabels.length === 0 ? (
                        <span className="text-gray-300 dark:text-gray-600 italic text-sm">Categorize...</span>
                      ) : (
                        selectedLabels.map(labelId => {
                          const label = AVAILABLE_LABELS.find(l => l.id === labelId);
                          return (
                            <span 
                              key={labelId} 
                              className="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide text-white shadow-lg shadow-black/5 flex items-center gap-1.5"
                              style={{ backgroundColor: label?.color }}
                            >
                              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                              {label?.name}
                            </span>
                          );
                        })
                      )}
                      <MoreVertical size={14} className="ml-auto text-gray-400 shrink-0 group-hover:text-primary transition-colors" />
                    </button>

                    <AnimatePresence>
                      {showLabelDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 right-0 mt-3 bg-white dark:bg-[#1C1F2B] border border-gray-200 dark:border-border-dark rounded-2xl shadow-3xl z-[60] p-4 space-y-4 backdrop-blur-xl"
                        >
                          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-border-dark focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <Search size={14} className="text-gray-400" />
                            <input type="text" placeholder="Filter or create..." className="bg-transparent text-[10px] font-medium w-full focus:outline-none placeholder:text-gray-400" />
                          </div>
                          <div className="space-y-1.5 min-h-[150px] max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                            {AVAILABLE_LABELS.map(label => (
                              <button 
                                key={label.id}
                                onClick={() => {
                                  if (selectedLabels.includes(label.id)) setSelectedLabels(selectedLabels.filter(id => id !== label.id));
                                  else setSelectedLabels([...selectedLabels, label.id]);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-[11px] font-bold group ${selectedLabels.includes(label.id) ? 'bg-primary/10 text-primary shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                              >
                                <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: label.color }} />
                                <span className="flex-1 text-left tracking-wide uppercase">{label.name}</span>
                                {selectedLabels.includes(label.id) && <Check size={14} strokeWidth={3} />}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-border-dark mx-1" />

              {/* Timeline Parameters */}
              <div className="space-y-8 px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 block">Execution Window</span>
                
                <div className="flex gap-6">
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <CalendarIcon size={13} className="text-primary" /> Target Date
                    </label>
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                    />
                  </div>
                  <div className="w-32 space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Clock size={13} className="text-primary" /> Time
                    </label>
                    <input 
                      type="time" 
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Clock size={13} className="text-primary" /> Complexity
                    </label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        placeholder="0"
                        value={estimate}
                        onChange={(e) => setEstimate(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent rounded-2xl px-5 py-4 text-sm font-medium shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 tracking-tight">Pts</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 flex items-center gap-2.5">
                      <Building2 size={13} className="text-primary" /> Dept.
                    </label>
                    <div className="relative group">
                       <select 
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent px-5 py-4 text-sm font-medium rounded-2xl shadow-sm outline-none appearance-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        <option value="">None</option>
                        {MOCK_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100 dark:bg-border-dark mx-1" />

              {/* Advanced Parameters */}
              <div className="px-1">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 hover:text-primary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={15} className="group-hover:rotate-180 transition-transform duration-700 text-primary/50" />
                    <span>System Parameters</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showAdvanced ? 90 : 0 }}
                  >
                    <ChevronRight size={15} />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-3 mt-4"
                    >
                      {[
                        { label: 'Parent Linkage', icon: <ChevronRight size={14} /> },
                        { label: 'Sub-Dependencies', icon: <AlertCircle size={14} /> },
                        { label: 'Watchers (Group)', icon: <Users size={14} /> },
                        { label: 'Integration Ref', icon: <LinkIcon size={14} /> }
                      ].map(opt => (
                        <div key={opt.label} className="group flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wide text-gray-500 cursor-pointer border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-primary/40">{opt.icon}</span>
                            <span>{opt.label}</span>
                          </div>
                          <Plus size={14} className="text-gray-300 group-hover:text-primary transition-all group-hover:rotate-90 duration-300" />
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
