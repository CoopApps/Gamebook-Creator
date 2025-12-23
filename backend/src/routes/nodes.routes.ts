import { Router } from 'express';
import { NodesController } from '../controllers/nodes.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../validators/auth.validator';
import {
  createNodeSchema,
  updateNodeSchema,
  listNodesSchema,
  batchUpdatePositionsSchema,
  createSegmentSchema,
  updateSegmentSchema,
} from '../validators/node.validator';

const router = Router();
const nodesController = new NodesController();

// Batch operations (must be before /:id routes)
router.patch('/batch/positions', authenticate, validate(batchUpdatePositionsSchema), nodesController.batchUpdatePositions);

// List nodes
router.get('/', authenticate, validate(listNodesSchema), nodesController.list);

// Create node
router.post('/', authenticate, validate(createNodeSchema), nodesController.create);

// Single node operations
router.get('/:id', optionalAuth, nodesController.getOne);
router.put('/:id', authenticate, validate(updateNodeSchema), nodesController.update);
router.delete('/:id', authenticate, nodesController.delete);

// Story segments
router.post('/:id/segments', authenticate, validate(createSegmentSchema), nodesController.addSegment);
router.put('/:id/segments/:segmentNumber', authenticate, validate(updateSegmentSchema), nodesController.updateSegment);
router.delete('/:id/segments/:segmentNumber', authenticate, nodesController.deleteSegment);

export default router;
