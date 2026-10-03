import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  ShieldAlert,
  Building2,
  PlusCircle,
  Video,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const Sidebar: React.FC<{ isMobileOpen?: boolean; onCloseMobile?: () => void }> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: '/reports',
      label: 'Issue Reports',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      to: '/map',
      label: 'Geospatial Map',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      to: '/report-issue',
      label: 'Report Issue (User)',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      to: '/dashcam-simulator',
      label: 'AI Dashcam & DLP Mailer',
      icon: <Video className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none">
              CivicFix
            </h1>
            <span className="text-[10px] font-medium text-indigo-400 tracking-wider uppercase">
              Authority Portal
            </span>
          </div>
        </div>

        {/* User Scope card */}
        <div className="px-4 py-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-xs font-semibold text-white truncate">
                {user?.role === 'admin' ? 'City Administrator' : user?.department_name || 'Roads & Infrastructure'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {user?.role === 'admin'
                ? 'City-wide jurisdiction'
                : 'Departmental triage & dispatch'}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-center">
          <div className="inline-flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Civic System v1.0 (Hackathon)</span>
          </div>
        </div>
      </aside>
    </>
  );
};
