import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { Department } from '@/types';

interface PeopleFilterBarProps {
  departments: Department[];
}

export function PeopleFilterBar({ departments }: PeopleFilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentType = searchParams.get('type') || '';
  const currentDept = searchParams.get('dept') || 'ALL';
  const currentStatus = searchParams.get('status') || 'ALL';
  const currentSearch = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  return (
    <div className="space-y-3.5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200/80 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {[
          { id: 'ALL', label: 'All Personnel', type: '' },
          { id: 'EMPLOYEE', label: 'Employees', type: 'EMPLOYEE' },
          { id: 'INTERN', label: 'Interns', type: 'INTERN' },
          { id: 'ARCHIVED', label: 'Archived', type: '', status: 'ARCHIVED' },
        ].map((tab) => {
          const isActive = 
            tab.status 
              ? currentStatus === 'ARCHIVED' 
              : tab.type 
                ? currentType === tab.type 
                : (!currentType && currentStatus !== 'ARCHIVED');

          return (
            <button
              key={tab.id}
              onClick={() => {
                const params = new URLSearchParams();
                if (tab.type) params.set('type', tab.type);
                if (tab.status) params.set('status', tab.status);
                setSearchParams(params);
              }}
              className={`pb-2.5 px-3 text-[13px] font-medium border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'border-zinc-950 text-zinc-950'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            defaultValue={currentSearch}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search by name, ID (e.g. GRI-5M8K2P7), email, designation..."
            className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-zinc-200/90 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 bg-white text-zinc-900 placeholder:text-zinc-400 transition"
          />
        </div>

        {/* Department Filter */}
        <div className="sm:w-44">
          <select
            value={currentDept}
            onChange={(e) => updateParam('dept', e.target.value)}
            className="w-full px-2.5 py-1.5 text-[13px] border border-zinc-200/90 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 bg-white text-zinc-900 transition"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        {currentStatus !== 'ARCHIVED' && (
          <div className="sm:w-36">
            <select
              value={currentStatus}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-2.5 py-1.5 text-[13px] border border-zinc-200/90 rounded-lg focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 bg-white text-zinc-900 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
