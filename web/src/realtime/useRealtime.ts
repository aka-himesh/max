import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';

export interface WebSocketEvent {
  event: 'report.created' | 'report.status_changed' | 'report.escalated' | 'notification.created' | string;
  data: Record<string, unknown>;
  ts?: string;
}

export function useRealtime(onEvent?: (event: WebSocketEvent) => void) {
  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

  const handleMessage = useCallback(
    (eventData: WebSocketEvent) => {
      // Invalidate relevant queries on updates
      switch (eventData.event) {
        case 'report.created':
        case 'report.status_changed':
        case 'report.escalated':
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          queryClient.invalidateQueries({ queryKey: ['reports-map'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['report-detail'] });
          queryClient.invalidateQueries({ queryKey: ['report-history'] });
          queryClient.invalidateQueries({ queryKey: ['report-escalations'] });
          break;

        case 'notification.created':
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          break;

        default:
          break;
      }

      if (onEvent) {
        onEvent(eventData);
      }
    },
    [queryClient, onEvent]
  );

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Do not attempt if already open or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = `${WS_URL}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketEvent;
          handleMessage(parsed);
        } catch {
          // ignore non-json pings
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff reconnect: min 1s, max 30s
        const nextDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        setReconnectAttempts((prev) => prev + 1);

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, nextDelay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setIsConnected(false);
    }
  }, [isAuthenticated, token, WS_URL, reconnectAttempts, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    // When socket is disconnected, polling fallback interval is 20000ms
    pollingInterval: isConnected ? false : 20000,
  };
}
