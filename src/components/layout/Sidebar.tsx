import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Users, 
  CreditCard, Award, ShieldCheck, Settings, LogOut,
  ChevronRight, Building2, Code2
} from 'lucide-react';

interface SidebarProps {
  currentUser: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string | null;
  };
}

export function Sidebar({ currentUser }: SidebarProps) {
  const { pathname, search } = useLocation();
  const currentPathWithSearch = `${pathname}${search}`;
  const { logout } = useAuth();

  const navigation = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'People',
      items: [
        { name: 'People', href: '/people', icon: Users },
      ],
    },
    {
      group: 'Documents',
      items: [
        { name: 'ID Cards', href: '/id-cards', icon: CreditCard },
        { name: 'Certificates', href: '/certificates', icon: Award },
      ],
    },
    {
      group: 'Administration',
      items: [
        { name: 'Users & Access', href: '/settings/users', icon: ShieldCheck },
        ...(currentUser.role === 'OWNER' ? [{ name: 'API & Endpoints', href: '/api-docs', icon: Code2 }] : []),
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-[#09090b] border-r border-zinc-800/80 text-zinc-300 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
          <img 
            src="/gorepireo-logo.png" 
            alt="Go_Repireo" 
            className="w-5 h-5 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[13px] tracking-tight text-white truncate">Go_Repireo</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-zinc-500 truncate">Employee Management</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {navigation.map((group) => (
          <div key={group.group} className="space-y-0.5">
            <h2 className="px-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
              {group.group}
            </h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href.includes('?') 
                ? currentPathWithSearch === item.href 
                : item.href === '/dashboard' || item.href === '/settings'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    isActive 
                      ? 'bg-zinc-800 text-white shadow-xs' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <span className="w-1 h-3 rounded-full bg-zinc-400 opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-2.5 border-t border-zinc-800/80 bg-[#0c0d0e]">
        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-900/80 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700/60 flex items-center justify-center font-medium text-[11px] shrink-0">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-zinc-200 truncate leading-snug">{currentUser.full_name}</p>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider leading-none">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            type="button"
            title="Sign out"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
