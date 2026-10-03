import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Building2,
  PlusCircle,
  Camera,
  Home,
  ShieldAlert,
  HardHat,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';

export const Sidebar: React.FC<{ isMobileOpen?: boolean; onCloseMobile?: () => void }> = ({
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const role = user?.role || 'officer';

  // Role-specific navigation menus
  let navItems: { to: string; label: string; icon: React.ReactNode; badge?: string }[] = [];

  if (role === 'citizen') {
    navItems = [
      {
        to: '/citizen/report',
        label: 'Report Issue',
        icon: <PlusCircle className="w-4 h-4 text-indigo-400" />,
      },
      {
        to: '/citizen/my-reports',
        label: 'My Submitted Reports',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        to: '/citizen/drive-mode',
        label: 'Live Drive Mode',
        icon: <Camera className="w-4 h-4 text-cyan-400" />,
        badge: 'AI',
      },
      {
        to: '/map',
        label: 'Geospatial Map',
        icon: <MapPin className="w-4 h-4" />,
      },
    ];
  } else if (role === 'admin') {
    navItems = [
      {
        to: '/admin/dashboard',
        label: 'City Command Center',
        icon: <LayoutDashboard className="w-4 h-4 text-indigo-400" />,
      },
      {
        to: '/reports',
        label: 'All Incident Reports',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        to: '/officer/verification',
        label: 'Pothole Verification',
        icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
        badge: 'Action',
      },
      {
        to: '/admin/contractors',
        label: 'Contractors Directory',
        icon: <HardHat className="w-4 h-4 text-amber-400" />,
      },
      {
        to: '/admin/roads',
        label: 'Road Assets Registry',
        icon: <Building2 className="w-4 h-4 text-emerald-400" />,
      },
      {
        to: '/map',
        label: 'Geospatial Map',
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        to: '/drive-mode',
        label: 'Live Drive Mode',
        icon: <Camera className="w-4 h-4 text-cyan-400" />,
      },
    ];
  } else {
    // Officer Role (Default)
    navItems = [
      {
        to: '/officer/dashboard',
        label: 'Department Dashboard',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        to: '/officer/verification',
        label: 'Verification Queue',
        icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
        badge: 'DLP',
      },
      {
        to: '/officer/reports',
        label: 'Department Reports',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        to: '/map',
        label: 'Geospatial Map',
        icon: <MapPin className="w-4 h-4" />,
      },
      {
        to: '/report-issue',
        label: 'Citizen Report Portal',
        icon: <PlusCircle className="w-4 h-4" />,
      },
      {
        to: '/drive-mode',
        label: 'Live Drive Mode',
        icon: <Camera className="w-4 h-4 text-cyan-400" />,
      },
    ];
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-md transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#090d16] text-slate-100 flex flex-col border-r border-white/[0.08] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.08]">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-serif text-xl font-bold tracking-tight text-white group-hover:text-indigo-300 transition italic">
              CivicFix
            </span>
            <span className="text-[10px] font-mono text-indigo-400 font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {role.toUpperCase()}
            </span>
          </Link>
          <Link to="/" title="Home Page" className="text-slate-400 hover:text-white p-1 rounded-md transition">
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* User Scope card */}
        <div className="px-4 py-4">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1">
              {role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : role === 'citizen' ? (
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
              )}
              <span className="text-xs font-semibold text-white truncate">
                {role === 'admin'
                  ? 'City Administrator'
                  : role === 'citizen'
                  ? user?.name || 'Public Citizen'
                  : user?.department_name || 'Roads & Infrastructure'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {role === 'admin'
                ? 'City-wide executive jurisdiction'
                : role === 'citizen'
                ? 'Community issue reporter'
                : 'Departmental triage & contractor dispatch'}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white text-slate-950 font-bold shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate capitalize font-mono">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
