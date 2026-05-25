import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { MOCK_TEAMS, MOCK_PROJECTS } from '../../constants';
import { ChevronDown, Loader2, Calendar, Users, RotateCcw } from 'lucide-react';

export const CreateCycleModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [teamId, setTeamId] = useState(MOCK_TEAMS[0].id);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Cycle created successfully');
      setActiveModal(null);
    }, 1000);
  };

  const toggleProject = (id: string) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={activeModal === 'create-cycle'}
      onClose={() => setActiveModal(null)}
      title="Create new cycle"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
            <RotateCcw size={24} />
          </div>
          <div className="flex-1">
            <input
              autoFocus
              type="text"
              placeholder="Cycle name (e.g. Cycle 14)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-lg font-bold placeholder:text-purple-300 dark:placeholder:text-purple-800"
              required
            />
            <p className="text-xs text-purple-400">Cycles help teams focus on a set of issues over a fixed period.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm [color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">End Date</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm [color-scheme:light] dark:[color-scheme:dark]"
                required
              />
            </div>
          </div>
        </div>

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

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Included Projects</label>
          <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
            {MOCK_PROJECTS.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => toggleProject(project.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  selectedProjects.includes(project.id)
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-border-dark text-gray-500 hover:border-primary/50'
                }`}
              >
                <span className="text-sm font-medium">{project.name}</span>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedProjects.includes(project.id) ? 'bg-primary border-primary text-white' : 'border-gray-300'
                }`}>
                  {selectedProjects.includes(project.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-border-dark">
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
            Create Cycle
          </button>
        </div>
      </form>
    </Modal>
  );
};
