import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useRealtime, type WebSocketEvent } from '../../realtime/useRealtime';
import { Toast, type ToastMessage } from '../Toast';

export const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Connect to Realtime WebSocket
  const { isConnected } = useRealtime((event: WebSocketEvent) => {
    let title = 'System Update';
    let message = 'New data received';

    if (event.event === 'report.created') {
      title = 'New Report Created';
      message = 'A new civic issue was submitted.';
    } else if (event.event === 'report.status_changed') {
      title = 'Status Changed';
      message = 'A report status has been updated.';
    } else if (event.event === 'report.escalated') {
      title = '🚨 Report Escalated';
      message = 'A report has breached SLA and has been escalated.';
    }

    setToast({
      id: Date.now().toString(),
      type: event.event === 'report.escalated' ? 'error' : 'info',
      title,
      message,
    });
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          isWsConnected={isConnected}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Realtime Toast Notifications */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
