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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#08080a] text-zinc-100 flex flex-col border-r border-zinc-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="font-tech text-base font-bold tracking-wider text-white group-hover:text-zinc-300 transition">
              CIVICFIX<span className="text-zinc-500">.SYS</span>
            </span>
            <span className="text-[9px] font-mono-tech text-zinc-300 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700">
              {role.toUpperCase()}
            </span>
          </Link>
          <Link to="/" title="Home Page" className="text-zinc-500 hover:text-white p-1 transition">
            <Home className="w-4 h-4" />
          </Link>
        </div>

        {/* User Scope card */}
        <div className="px-4 py-4">
          <div className="bg-zinc-900/60 border border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-1">
              {role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-zinc-300 shrink-0" />
              ) : role === 'citizen' ? (
                <UserCheck className="w-4 h-4 text-zinc-300 shrink-0" />
              ) : (
                <Building2 className="w-4 h-4 text-zinc-300 shrink-0" />
              )}
              <span className="text-xs font-mono-tech font-semibold text-white truncate">
                {role === 'admin'
                  ? 'City Administrator'
                  : role === 'citizen'
                  ? user?.name || 'Public Citizen'
                  : user?.department_name || 'Roads & Infrastructure'}
              </span>
            </div>
            <p className="text-[10px] font-mono-tech text-zinc-500">
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
                `flex items-center justify-between px-3.5 py-2 text-xs font-mono-tech tracking-wider uppercase transition-all border ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                    : 'text-zinc-400 border-transparent hover:border-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono-tech">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0 font-mono-tech">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate font-mono-tech">{user?.name}</div>
              <div className="text-[10px] text-zinc-500 truncate capitalize font-mono-tech">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
