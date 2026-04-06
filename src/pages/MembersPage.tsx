import React, { useState } from 'react';
import { Search, UserPlus, MoreHorizontal, Shield, Mail, Filter, Building2 } from 'lucide-react';
import { MOCK_USERS, MOCK_TEAMS, MOCK_DEPARTMENTS } from '../constants';
import { UserRole } from '../types';

import { useApp } from '../AppContext';

export const MembersPage: React.FC = () => {
  const { setActiveModal } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const filteredMembers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || user.departmentId === departmentFilter;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-border-dark">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Members</h1>
          <span className="text-xs text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
            {MOCK_USERS.length} total
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveModal('invite-member')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus size={14} />
            <span>Invite Member</span>
          </button>
        </div>
      </header>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm py-1.5 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-400" />
            <select 
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm py-1.5 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            >
              <option value="all">All Departments</option>
              {MOCK_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden border-t-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-200 dark:border-border-dark">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
              {filteredMembers.map(member => {
                const team = MOCK_TEAMS.find(t => t.id === member.teamId);
                return (
                  <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} className="w-9 h-9 rounded-xl border border-gray-100 dark:border-border-dark object-cover shadow-sm" alt={member.name} />
                        <div className="flex flex-col">
                          <span className="font-bold tracking-tight text-gray-700 dark:text-gray-200">{member.name}</span>
                          <span className="text-[11px] text-gray-400 font-medium">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {member.role === 'owner' && <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(95,114,234,0.5)]" />}
                        {member.role === 'admin' && <Shield size={12} className="text-purple-500" />}
                        <span className={`text-[11px] font-black uppercase tracking-widest ${
                          member.role === 'owner' ? 'text-primary' : 
                          member.role === 'admin' ? 'text-purple-500' :
                          member.role === 'guest' ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {MOCK_DEPARTMENTS.find(d => d.id === member.departmentId)?.name || <span className="italic opacity-50">None</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {team?.name || 'No Team'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
