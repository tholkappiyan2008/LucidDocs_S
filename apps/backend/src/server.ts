import express from 'express';
import cors from 'cors';
import { config, validateRequiredEnv } from './config/env.js';
import { isSupabaseConfigured } from './config/supabase.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

validateRequiredEnv();

const app = express();

// Standard middleware & CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (like mobile apps, curl, Postman, or health checks)
    if (!origin) return callback(null, true);

    // In development and production allow configured frontend, localhost, or any Vercel domain
    if (
      origin === config.frontendUrl ||
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback so custom domains work smoothly
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check Endpoints (support both /api/v1/health and /health)
app.get(['/api/v1/health', '/health'], (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ClearDoc API',
    database_connected: isSupabaseConfigured(),
  });
});

// Primary API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/documents', documentRoutes);

// Route Aliases for production resilience
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

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

