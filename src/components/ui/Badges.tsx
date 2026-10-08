import React from 'react';
import { PersonStatus, PersonType } from '@/types';

export function PersonStatusBadge({ status }: { status: PersonStatus }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Active
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/10 text-sky-700 border border-sky-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600"></span>
          Completed
        </span>
      );
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Inactive
        </span>
      );
    case 'TERMINATED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/10 text-rose-700 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Terminated
        </span>
      );
    case 'ARCHIVED':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
          Archived
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
          {status}
        </span>
      );
  }
}

export function PersonTypeBadge({ type }: { type: PersonType }) {
  if (type === 'EMPLOYEE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-900 text-zinc-100 border border-zinc-800">
        Employee
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
      Intern
    </span>
  );
}

export function PersonCodeChip({ code }: { code: string }) {
  const isEmployee = code.startsWith('GRE-');
  return (
    <code className="inline-flex items-center font-mono text-[11px] font-medium tracking-wide bg-zinc-100/90 text-zinc-800 border border-zinc-200/90 px-1.5 py-0.5 rounded">
      {code}
    </code>
  );
}

export function PersonAvatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-16 h-16 text-lg font-semibold',
  }[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover border border-zinc-200/80 shrink-0`}
      />
    );
  }

  const initial = name?.trim() ? name.trim().charAt(0).toUpperCase() : '?';

  return (
    <div className={`${sizeClasses} rounded-full bg-zinc-100 text-zinc-700 font-medium border border-zinc-200/90 flex items-center justify-center shrink-0`}>
      {initial}
    </div>
  );
}
