import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

/**
 * API Routes
 */

// Authentication routes
router.use('/auth', authRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'Gamebook Creator API',
    version: '1.0.0',
    description: 'Backend API for Interactive Gamebook Creator',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects (coming soon)',
      health: '/api/health',
    },
  });
});

export default router;
