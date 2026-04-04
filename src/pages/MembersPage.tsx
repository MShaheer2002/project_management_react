import React, { useState } from 'react';
import { Search, UserPlus, MoreHorizontal, Shield, Mail, Filter } from 'lucide-react';
import { MOCK_USERS, MOCK_TEAMS } from '../constants';
import { UserRole } from '../types';

import { useApp } from '../AppContext';

export const MembersPage: React.FC = () => {
  const { setActiveModal } = useApp();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filteredMembers = MOCK_USERS.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                         user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
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
              className="bg-gray-100 dark:bg-white/5 border-none rounded-md text-sm py-1.5 px-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="member">Member</option>
              <option value="guest">Guest</option>
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-black/10 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-200 dark:border-border-dark">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Team</th>
                <th className="px-6 py-3">Last Active</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border-dark">
              {filteredMembers.map(member => {
                const team = MOCK_TEAMS.find(t => t.id === member.teamId);
                return (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={member.avatar} className="w-8 h-8 rounded-full" alt={member.name} />
                        <div className="flex flex-col">
                          <span className="font-medium">{member.name}</span>
                          <span className="text-xs text-gray-400">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {member.role === 'admin' && <Shield size={12} className="text-primary" />}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {team?.name || 'No Team'}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {member.lastActive}
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
