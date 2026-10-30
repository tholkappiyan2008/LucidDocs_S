import express from 'express';
import cors from 'cors';
import { config, validateRequiredEnv } from './config/env.js';
import { isSupabaseConfigured } from './config/supabase.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

validateRequiredEnv();

const app = express();

// Standard middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      // In development allow any localhost or matching configured frontend
      if (
        origin === config.frontendUrl ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive during development/hackathon demo
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoint
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ClearDoc API',
    database_connected: isSupabaseConfigured(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// 404 Route Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested API endpoint does not exist.',
    },
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`[ClearDoc Server] Listening on http://localhost:${PORT}`);
  console.log(`[ClearDoc Server] Health check available at http://localhost:${PORT}/api/v1/health`);
});

export default app;
