import React, { useState } from 'react';
import { Modal } from './Modal';
import { useApp } from '../../AppContext';
import { MOCK_USERS } from '../../constants';
import { Building2, Plus, X, User, Users, Palette, Info, Check } from 'lucide-react';

const DEPARTMENT_COLORS = [
  '#5f72ea', // Default Primary
  '#ea5f5f', // Red
  '#ea9b5f', // Orange
  '#eade5f', // yellow
  '#5fea7b', // Green
  '#5feade', // Teal
  '#5fbaea', // Light Blue
  '#ea5fba', // Pink
  '#ba5fea', // Purple
  '#1f2937', // Dark Gray
];

export const CreateDepartmentModal: React.FC = () => {
  const { setActiveModal, showToast } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headId, setHeadId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState(DEPARTMENT_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      showToast('Department created successfully!', 'success');
      setActiveModal(null);
      setIsSubmitting(false);
    }, 1000);
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={() => setActiveModal(null)}
      title="Create New Department"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-100 dark:border-border-dark rounded-xl bg-gray-50/50 dark:bg-black/10">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl transition-all duration-300"
            style={{ backgroundColor: selectedColor }}
          >
            <Building2 size={32} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department Icon Preview</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Info size={12} />
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder="e.g. Engineering, Marketing..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[100px] text-sm"
              placeholder="What does this department do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Palette size={12} />
                Theme Color
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl">
                {DEPARTMENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-bg-dark scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && <Check size={12} className="text-white drop-shadow-sm" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User size={12} />
                Department Head
              </label>
              <select
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm h-[50px] appearance-none"
                value={headId}
                onChange={(e) => setHeadId(e.target.value)}
              >
                <option value="">Select a head (Optional)</option>
                {MOCK_USERS.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Users size={12} />
              Initial Members
            </label>
            <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl p-2 space-y-1 scrollbar-hide">
              {MOCK_USERS.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleMember(user.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${selectedMemberIds.includes(user.id) ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500'}`}
                >
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} className="w-6 h-6 rounded-full" alt={user.name} />
                    <span className="text-xs font-semibold">{user.name}</span>
                  </div>
                  {selectedMemberIds.includes(user.id) ? (
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white">
                      <Check size={10} />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-border-dark" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2 px-1">Selected: {selectedMemberIds.length} members</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="flex-[2] px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xl shadow-primary/30 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={18} />
                <span>Create Department</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
