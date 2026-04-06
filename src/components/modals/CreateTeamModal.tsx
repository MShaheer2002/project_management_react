import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { MOCK_USERS, MOCK_DEPARTMENTS } from '../../constants';
import { ChevronDown, Loader2, Users, Camera, Building2 } from 'lucide-react';

export const CreateTeamModal: React.FC = () => {
  const { activeModal, setActiveModal, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState(MOCK_USERS[0].id);
  const [departmentId, setDepartmentId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Team created successfully');
      setActiveModal(null);
    }, 1000);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={activeModal === 'create-team'}
      onClose={() => setActiveModal(null)}
      title="Create new team"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-white/5 border-2 border-dashed border-gray-300 dark:border-border-dark flex flex-col items-center justify-center text-gray-400 group-hover:border-primary group-hover:text-primary transition-all cursor-pointer">
              <Camera size={24} />
              <span className="text-[10px] font-bold mt-1">UPLOAD</span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Platform Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
          <textarea
            placeholder="What does this team do?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[80px] px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Team Lead</label>
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
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Department (Optional)</label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-border-dark rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm appearance-none"
              >
                <option value="">No Department</option>
                {MOCK_DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Add Members</label>
          <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
            {MOCK_USERS.map(user => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleMember(user.id)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                  selectedMembers.includes(user.id)
                    ? 'bg-primary/5 border-primary'
                    : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-border-dark hover:border-primary/50'
                }`}
              >
                <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{user.role}</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  selectedMembers.includes(user.id) ? 'bg-primary border-primary text-white' : 'border-gray-300'
                }`}>
                  {selectedMembers.includes(user.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
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
            Create Team
          </button>
        </div>
      </form>
    </Modal>
  );
};
