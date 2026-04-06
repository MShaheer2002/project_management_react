import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { MOCK_TEAMS, MOCK_USERS, MOCK_DEPARTMENTS } from '../../constants';
import { ChevronDown, Loader2, Calendar, Users, Layout, RotateCcw, Map, Building2 } from 'lucide-react';

export const CreateProjectModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState(MOCK_TEAMS[0].id);
  const [leadId, setLeadId] = useState(MOCK_USERS[0].id);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  
  const [enableRoadmap, setEnableRoadmap] = useState(true);
  const [enableCycles, setEnableCycles] = useState(true);
  const [enableTracking, setEnableTracking] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Project created successfully');
      setActiveModal(null);
      setName('');
      setDescription('');
    }, 1000);
  };

  return (
    <Modal
      isOpen={activeModal === 'create-project'}
      onClose={() => setActiveModal(null)}
      title="Create new project"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
            <textarea
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team</label>
            <div className="relative">
              <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                {MOCK_TEAMS.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Department (Optional)</label>
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                <option value="">Global (No Department)</option>
                {MOCK_DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Project Lead</label>
            <div className="relative">
              <select
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-border-dark">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Features</label>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500">
                  <Map size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Roadmap</p>
                  <p className="text-[10px] text-gray-400">Visualize project timeline and milestones.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={enableRoadmap} 
                onChange={() => setEnableRoadmap(!enableRoadmap)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-500">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Cycles</p>
                  <p className="text-[10px] text-gray-400">Enable sprint-based planning and velocity tracking.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={enableCycles} 
                onChange={() => setEnableCycles(!enableCycles)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                  <Layout size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Issue Tracking</p>
                  <p className="text-[10px] text-gray-400">Manage bugs, tasks, and feature requests.</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={enableTracking} 
                onChange={() => setEnableTracking(!enableTracking)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create Project
          </button>
        </div>
      </form>
    </Modal>
  );
};
