import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  Bell,
  LogOut,
  Menu,
  Wifi,
  WifiOff,
  CheckCheck,
} from 'lucide-react';
import type { Notification } from '../../api/types';
import { formatTimeRelative } from '../../lib/format';
import { api } from '../../api/endpoints';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  isWsConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  isWsConnected = false,
}) => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications({ page: 1, page_size: 10 }),
    refetchInterval: 30000,
  });

  const notifications: Notification[] = notifData?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => api.markNotificationRead(n.notification_id)));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Realtime status indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            isWsConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
          title={
            isWsConnected
              ? 'WebSocket Connected (Realtime sync active)'
              : 'WebSocket Reconnecting (Fallback 20s polling active)'
          }
        >
          {isWsConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isWsConnected ? 'Live Realtime' : 'Polling (20s)'}</span>
        </div>
      </div>

      {/* Right side: Notifications, user info, logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:bg-white/[0.06] hover:text-white transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f172a] rounded-2xl shadow-2xl border border-white/10 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 pb-2 mb-2 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto px-2 space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      className={`p-2.5 rounded-xl text-xs transition ${
                        n.is_read ? 'bg-white/[0.02] text-slate-400' : 'bg-indigo-500/10 text-slate-200 font-medium border border-indigo-500/20'
                      }`}
                    >
                      <p className="line-clamp-2 leading-relaxed">{n.message}</p>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="capitalize">{n.channel}</span>
                        <span>{formatTimeRelative(n.sent_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* User profile details */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-xs font-semibold text-white">{user?.name || 'Authorized Official'}</div>
            <div className="text-[11px] text-slate-400 capitalize">{user?.role}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center uppercase border border-white/20">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
