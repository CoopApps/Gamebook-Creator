import { Router } from 'express';
import authRoutes from './auth.routes';
import projectsRoutes from './projects.routes';
import nodesRoutes from './nodes.routes';
import connectionsRoutes from './connections.routes';

const router = Router();

/**
 * API Routes
 */

// Authentication routes
router.use('/auth', authRoutes);

// Projects routes
router.use('/projects', projectsRoutes);

// Nodes routes
router.use('/nodes', nodesRoutes);

// Connections routes
router.use('/connections', connectionsRoutes);

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
      nodes: '/api/nodes',
      connections: '/api/connections',
      health: '/api/health',
    },
  });
});

export default router;
