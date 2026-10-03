import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  Bell,
  LogOut,
  Menu,
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
    <header className="sticky top-0 z-30 h-16 bg-[#08080a]/90 backdrop-blur-xl border-b border-zinc-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Left side: Hamburger on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden border border-zinc-800"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Realtime status indicator */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono-tech uppercase tracking-wider border ${
            isWsConnected
              ? 'bg-zinc-900 text-emerald-400 border-zinc-700'
              : 'bg-zinc-900 text-amber-400 border-zinc-700'
          }`}
          title={
            isWsConnected
              ? 'WebSocket Connected (Realtime sync active)'
              : 'WebSocket Reconnecting (Fallback 20s polling active)'
          }
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span>{isWsConnected ? 'REALTIME // WS-LIVE' : 'POLLING // 20s'}</span>
        </div>
      </div>

      {/* Right side: Notifications, user info, logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-zinc-400 hover:text-white border border-transparent hover:border-zinc-800 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-zinc-100 text-zinc-950 text-[9px] font-mono-tech font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b0b0e] shadow-2xl border border-zinc-800 py-3 z-50 animate-in fade-in duration-200">
              <div className="px-4 pb-2 mb-2 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-tech uppercase font-bold text-white tracking-wider">NOTIFICATIONS</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-mono-tech bg-zinc-800 text-zinc-200 px-2 py-0.5 border border-zinc-700">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-mono-tech uppercase text-zinc-400 hover:text-white inline-flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    MARK READ
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto px-2 space-y-1">
                {notifications.length === 0 ? (
                  <p className="text-xs font-mono-tech text-zinc-500 text-center py-6">NO NOTIFICATIONS</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notification_id}
                      className={`p-2.5 text-xs font-mono-tech transition border ${
                        n.is_read ? 'bg-zinc-950/60 border-zinc-900 text-zinc-400' : 'bg-zinc-900 border-zinc-700 text-zinc-100'
                      }`}
                    >
                      <p className="line-clamp-2 leading-relaxed">{n.message}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 uppercase">
                        <span>{n.channel}</span>
                        <span>{formatTimeRelative(n.sent_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-800" />

        {/* User profile details */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-xs font-mono-tech font-semibold text-white uppercase">{user?.name || 'Authorized Official'}</div>
            <div className="text-[10px] font-mono-tech text-zinc-500 uppercase">{user?.role}</div>
          </div>
          <div className="w-8 h-8 bg-zinc-800 text-zinc-100 font-mono-tech font-bold text-xs flex items-center justify-center uppercase border border-zinc-700">
            {user?.name ? user.name.charAt(0) : 'A'}
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-800 transition"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
