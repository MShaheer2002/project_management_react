import React, { useState } from 'react';
import { Building2, Plus, Search, MoreVertical, Users, Layers, Calendar, Filter } from 'lucide-react';
import { MOCK_DEPARTMENTS, MOCK_USERS, MOCK_TEAMS, MOCK_PROJECTS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Department } from '../types';

export const DepartmentsPage: React.FC = () => {
  const { setActiveModal } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDepartments = MOCK_DEPARTMENTS.filter(dept => 
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDepartments.map(dept => {
        const head = MOCK_USERS.find(u => u.id === dept.headId);
        return (
          <div 
            key={dept.id}
            className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-all group flex flex-col"
          >
            <div className="p-5 flex-1 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-inner"
                    style={{ backgroundColor: dept.color || '#5f72ea' }}
                  >
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{dept.name}</h3>
                    <p className="text-xs text-gray-400">Created {new Date(dept.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400">
                  <MoreVertical size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                {dept.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-3 gap-4 py-2 border-y border-gray-100 dark:border-border-dark/50">
                <div className="text-center">
                  <div className="text-sm font-bold">{dept.memberIds.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">{dept.teamIds.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Teams</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold">{dept.projectIds.length}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Projects</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Department Head</div>
                <div className="flex items-center gap-2">
                  {head ? (
                    <>
                      <img src={head.avatar} className="w-6 h-6 rounded-full" alt={head.name} />
                      <span className="text-sm font-medium">{head.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No head assigned</span>
                  )}
                </div>
              </div>
            </div>
            
            <div 
              onClick={() => navigate(`/departments/${dept.id}`)}
              className="px-5 py-3 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-border-dark flex items-center justify-between cursor-pointer group-hover:bg-primary/5 transition-colors"
            >
              <span className="text-xs text-gray-400 italic">View department details</span>
              <button className="text-xs text-primary font-bold hover:underline">View Details</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-black/10">
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Department</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Head</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Stats</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Created</th>
            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.map(dept => {
            const head = MOCK_USERS.find(u => u.id === dept.headId);
            return (
              <tr 
                key={dept.id}
                onClick={() => navigate(`/departments/${dept.id}`)}
                className="border-b border-gray-100 dark:border-border-dark/50 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: dept.color || '#5f72ea' }}
                    >
                      <Building2 size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">{dept.name}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px]">{dept.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {head && <img src={head.avatar} className="w-5 h-5 rounded-full" alt={head.name} />}
                    <span className="text-sm">{head?.name || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><Users size={12} /> {dept.memberIds.length}</div>
                    <div className="flex items-center gap-1.5"><Layers size={12} /> {dept.teamIds.length}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  {new Date(dept.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/30 dark:bg-transparent">
      <header className="flex flex-col gap-4 px-6 py-6 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-bg-dark/50 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Departments</h1>
              <p className="text-xs text-gray-400">Manage your organization's functional layers</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveModal('create-department')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Plus size={16} />
              <span>Create Department</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex-1 relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark rounded-lg p-1 shadow-sm">
              <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                List
              </button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-sm font-medium transition-colors shadow-sm">
              <Filter size={14} className="text-gray-400" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {filteredDepartments.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <Building2 size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold mb-2">No departments yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mb-8">
              Organize your teams and projects by functional departments like Engineering, Product, or Marketing.
            </p>
            <button 
              onClick={() => setActiveModal('create-department')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all"
            >
              <Plus size={18} />
              <span>Create your first department</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
