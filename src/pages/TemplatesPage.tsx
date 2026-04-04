import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  User, 
  Clock, 
  Trash2, 
  Edit3, 
  ChevronLeft,
  Save,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Code,
  ImageIcon,
  Tag,
  Flag,
  CheckSquare
} from 'lucide-react';
import { useApp } from '../AppContext';
import { MOCK_USERS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface Template {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  lastUpdated: string;
  content: string;
  defaultLabels: string[];
  defaultPriority: string;
}

const MOCK_TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Bug Report',
    description: 'Standard template for reporting technical issues.',
    createdBy: 'u1',
    lastUpdated: '2024-03-05',
    content: '## Description\n\n## Steps to Reproduce\n1.\n2.\n3.\n\n## Expected Behavior\n\n## Actual Behavior\n\n## Environment\n- Browser:\n- OS:',
    defaultLabels: ['bug'],
    defaultPriority: 'high'
  },
  {
    id: 't2',
    name: 'Feature Request',
    description: 'Template for proposing new features or improvements.',
    createdBy: 'u2',
    lastUpdated: '2024-03-04',
    content: '## Goal\n\n## User Story\nAs a [user type], I want to [action], so that [benefit].\n\n## Proposed Solution\n\n## Acceptance Criteria\n- [ ] \n- [ ] ',
    defaultLabels: ['feature'],
    defaultPriority: 'medium'
  }
];

export const TemplatesPage: React.FC = () => {
  const { showToast } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [templates, setTemplates] = useState<Template[]>(MOCK_TEMPLATES);

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  if (isCreating) {
    return <CreateTemplateScreen onBack={() => setIsCreating(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-bg-dark">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Issue Templates</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {templates.length} total
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none w-64 focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            <span>Create Template</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const creator = MOCK_USERS.find(u => u.id === template.createdBy);
            return (
              <div 
                key={template.id}
                className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 shadow-sm hover:border-primary/50 transition-all group flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText size={20} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                      <Edit3 size={16} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-6 flex-1">
                  <h3 className="font-bold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{template.description}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-border-dark flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <img src={creator?.avatar} className="w-5 h-5 rounded-full" alt={creator?.name} />
                    <span>{creator?.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{template.lastUpdated}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CreateTemplateScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { showToast } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    showToast('Template saved successfully');
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-bg-dark">
      <header className="h-14 border-b border-gray-200 dark:border-border-dark flex items-center justify-between px-6 sticky top-0 z-10 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="h-6 w-[1px] bg-gray-200 dark:border-border-dark" />
          <h2 className="text-lg font-semibold">Create Template</h2>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Save size={18} />
          <span>Save Template</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Template Name</span>
                <input 
                  type="text" 
                  placeholder="e.g. Bug Report" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Description</span>
                <input 
                  type="text" 
                  placeholder="What is this template for?" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </label>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Template Content</span>
              <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden">
                <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-border-dark bg-white/50 dark:bg-black/20">
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Bold size={16} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Italic size={16} /></button>
                  <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><List size={16} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><LinkIcon size={16} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><Code size={16} /></button>
                  <button className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500"><ImageIcon size={16} /></button>
                </div>
                <textarea 
                  placeholder="Define the default issue body..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-96 bg-transparent border-none outline-none p-4 resize-none text-gray-700 dark:text-gray-300 leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-xl p-6 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Default Metadata</h3>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Priority</span>
                  <select className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Assignee</span>
                  <select className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2 text-sm outline-none">
                    <option>Unassigned</option>
                    <option>Creator</option>
                    {MOCK_USERS.map(u => <option key={u.id}>{u.name}</option>)}
                  </select>
                </label>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Default Labels</span>
                  <div className="flex flex-wrap gap-2">
                    {['bug', 'feature', 'ui'].map(l => (
                      <button key={l} className="px-2 py-1 rounded bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark text-[10px] font-bold uppercase text-gray-400 hover:border-primary/50 hover:text-primary transition-all">
                        {l}
                      </button>
                    ))}
                    <button className="p-1 rounded border border-dashed border-gray-300 dark:border-border-dark text-gray-400 hover:text-primary transition-colors">
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-border-dark">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3">Checklist Template</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckSquare size={14} />
                      <span>No items yet</span>
                    </div>
                    <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                      <Plus size={12} /> Add item
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
