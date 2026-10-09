import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          <p className="text-[12px] text-zinc-400 font-medium tracking-wide">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex overflow-x-hidden">
      {/* Desktop Sidebar (Pinned on left) */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <Sidebar currentUser={user} />
      </div>

      {/* Mobile Drawer Overlay & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <Sidebar currentUser={user} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Responsive Workspace Top Navigation Bar */}
        <header className="h-14 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors lg:hidden cursor-pointer"
              aria-label="Open mobile navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 truncate">
              <span className="font-semibold text-zinc-900 truncate">Go_Repireo</span>
              <span className="text-zinc-300">/</span>
              <span className="truncate hidden sm:inline">Workforce Management</span>
              <span className="truncate sm:hidden">Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium bg-zinc-100/80 px-2 py-1 rounded-full border border-zinc-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Database Connected</span>
              <span className="sm:hidden font-mono text-[10px]">LIVE</span>
            </div>

            {/* Current User Pill on Mobile */}
            <div className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-200 text-xs font-semibold flex items-center justify-center lg:hidden">
              {user.full_name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
