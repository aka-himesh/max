import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { type AuthUser } from '../middleware/auth.js';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: any) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      let authToken = url.searchParams.get('token');
      if (!authToken || authToken === 'cookie_session') {
        const rawCookies = req.headers.cookie || '';
        const match = rawCookies.match(/auth_token=([^;]+)/);
        if (match) {
          authToken = match[1];
        }
      }

      if (authToken && authToken !== 'cookie_session') {
        try {
          const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'super_secret_jwt_civic_issue_hackathon_key_2026') as AuthUser;
          (ws as any).user = decoded;
        } catch {
          // Allow connection as guest if token expired or invalid
        }
      }

      clients.add(ws);

      ws.on('close', () => {
        clients.delete(ws);
      });

      ws.on('error', (err) => {
        clients.delete(ws);
      });
    } catch {
      ws.close();
    }
  });

  console.log('⚡ Realtime WebSocket server initialized on /ws');
}

export function broadcastEvent(event: string, payload: any) {
  if (!wss) return;
  const message = JSON.stringify({ event, data: payload });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
