import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Users, UserCheck, GraduationCap, 
  CreditCard, Award, ShieldCheck, Settings, LogOut,
  ChevronRight, Building2
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
        { name: 'Employees', href: '/people?type=EMPLOYEE', icon: UserCheck },
        { name: 'Interns', href: '/people?type=INTERN', icon: GraduationCap },
        { name: 'All People', href: '/people', icon: Users },
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
        { name: 'Settings', href: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0">
          <img 
            src="/gorepireo-logo.png" 
            alt="Go_Repireo" 
            className="w-[34px] h-[34px] object-contain"
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            Go_Repireo
            <span className="text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-400/30 px-1.5 py-0.5 rounded">Employee Management</span>
          </h1>
          <p className="text-xs text-slate-400 truncate">Learn • Build • Grow</p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.group} className="space-y-1">
            <h2 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {group.group}
            </h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href.includes('?') 
                ? currentPathWithSearch === item.href 
                : pathname === item.href || (item.href !== '/dashboard' && item.href !== '/people' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 transition">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/30 shrink-0">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.full_name}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">{currentUser.role.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            type="button"
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
