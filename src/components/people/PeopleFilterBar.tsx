'use client';

import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { Department } from '@/types';

interface PeopleFilterBarProps {
  departments: Department[];
}

export function PeopleFilterBar({ departments }: PeopleFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = searchParams.get('tab') || 'ALL';
  const currentType = searchParams.get('type') || '';
  const currentDept = searchParams.get('dept') || 'ALL';
  const currentStatus = searchParams.get('status') || 'ALL';
  const currentSearch = searchParams.get('search') || '';

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'ALL', label: 'All People', type: '' },
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
                router.push(`${pathname}?${params.toString()}`);
              }}
              className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            defaultValue={currentSearch}
            onChange={(e) => updateParam('search', e.target.value)}
            placeholder="Search by name, ID (GR-INT-0001), email, role..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
          />
        </div>

        {/* Department Filter */}
        <div className="sm:w-48">
          <select
            value={currentDept}
            onChange={(e) => updateParam('dept', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
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
          <div className="sm:w-40">
            <select
              value={currentStatus}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white text-slate-900"
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
