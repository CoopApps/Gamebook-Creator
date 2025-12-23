import { Router } from 'express';
import authRoutes from './auth.routes';
import projectsRoutes from './projects.routes';

const router = Router();

/**
 * API Routes
 */

// Authentication routes
router.use('/auth', authRoutes);

// Projects routes
router.use('/projects', projectsRoutes);

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
      projects: '/api/projects',
      nodes: '/api/nodes (coming soon)',
      connections: '/api/connections (coming soon)',
      health: '/api/health',
    },
  });
});

export default router;
