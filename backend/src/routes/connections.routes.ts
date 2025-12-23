import { Router } from 'express';
import { ConnectionsController } from '../controllers/connections.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../validators/auth.validator';
import {
  createConnectionSchema,
  updateConnectionSchema,
  listConnectionsSchema,
} from '../validators/connection.validator';

const router = Router();
const connectionsController = new ConnectionsController();

// Get connections for a specific node
router.get('/node/:nodeId', optionalAuth, connectionsController.getNodeConnections);

// List connections
router.get('/', authenticate, validate(listConnectionsSchema), connectionsController.list);

// Create connection
router.post('/', authenticate, validate(createConnectionSchema), connectionsController.create);

// Single connection operations
router.get('/:id', optionalAuth, connectionsController.getOne);
router.put('/:id', authenticate, validate(updateConnectionSchema), connectionsController.update);
router.delete('/:id', authenticate, connectionsController.delete);

export default router;
