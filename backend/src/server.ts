import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './db/index.js';
import { initWebSocketServer } from './services/realtime.js';

import authRoutes from './routes/auth.js';
import reportsRoutes from './routes/reports.js';
import mlRoutes from './routes/ml.js';
import referenceRoutes from './routes/reference.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '8000', 10);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint (RULES.md Section 7.1)
app.get('/api/health', (req, res) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api', referenceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected internal error occurred.',
    },
  });
});

// Initialize DB and launch server
async function startServer() {
  try {
    await initDatabase();
    initWebSocketServer(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 MAX Backend Server running on http://0.0.0.0:${PORT}/api`);
      console.log(`⚡ WebSocket stream active at ws://localhost:${PORT}/ws`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
