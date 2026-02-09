import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import projectRoutes from './routes/projectRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import sfcRoutes from './routes/sfcRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import demoAccessRoutes from './routes/demoAccessRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment variable or use defaults
const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : defaultOrigins;

// Middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Explicitly handle OPTIONS requests for all routes
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'GRAFCET Backend',
    version: '1.0.0',
    storagePath: process.env.STORAGE_PATH
  });
});

import { authenticateToken } from './middleware/authMiddleware.js';
import simulationRoutes from './routes/simulationRoutes.js';
import vibeChatRoutes from './routes/vibeChatRoutes.js';
import renderRoutes from './routes/renderRoutes.js';

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sfc', sfcRoutes); // No auth needed - pure compilation utility
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/files', authenticateToken, fileRoutes);
app.use('/api/simulation', authenticateToken, simulationRoutes);
app.use('/api/vibe', authenticateToken, vibeChatRoutes);
app.use('/api/render', authenticateToken, renderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/demo-access', demoAccessRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 GRAFCET Backend Server running on port ${PORT}`);
  console.log(`📁 File system operations enabled`);
  console.log(`🌐 CORS enabled for frontend development`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);

  // Seed demo user
  const { AuthService } = await import('./services/authService.js');
  await AuthService.seedDemoUser();
});

// Initialize Socket.IO
import { Server as SocketIOServer } from 'socket.io';
import { WatcherService } from './services/watcherService.js';

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

let watcherService: WatcherService;

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Initialize WatcherService
// Use STORAGE_PATH or fallback to a default (e.g., project root or a specific data dir)
// Assuming storage path is available via env or defaulting to current dir for now if not set
const storagePath = process.env.STORAGE_PATH || path.join(process.cwd(), 'data'); // Adjust default as needed based on actual setup
// Ensure directory exists if possible, but watcher handles it usually.
// Ideally, we watch the root where projects are.
// Based on fileRoutes, it seems operations are relative to STORAGE_PATH.
if (process.env.STORAGE_PATH) {
  watcherService = new WatcherService(io, process.env.STORAGE_PATH);
} else {
  console.warn('⚠️ STORAGE_PATH not set. Watcher service might not watch the correct directory.');
  // Fallback to watching 'C:/Users/pc/Desktop/G7V0101' or similar if known, or just log warning.
  // For now, let's try to infer or wait for config.
  // If flydrive storage is used, we should watch that.
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (watcherService) watcherService.stop();
  io.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (watcherService) watcherService.stop();
  io.close();
  server.close(() => process.exit(0));
});

export default app;
