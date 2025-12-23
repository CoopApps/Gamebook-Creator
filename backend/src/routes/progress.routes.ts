import { Router } from 'express';
import { ProgressSystemsController } from '../controllers/progress.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../validators/auth.validator';
import {
  createProgressSystemSchema,
  updateProgressSystemSchema,
  listProgressSystemsSchema,
} from '../validators/progress.validator';

const router = Router();
const progressSystemsController = new ProgressSystemsController();

// Get progress systems grouped by type for a project (must be before /:id route)
router.get(
  '/project/:projectId/grouped',
  authenticate,
  progressSystemsController.getGrouped
);

// List progress systems
router.get(
  '/',
  authenticate,
  validate(listProgressSystemsSchema),
  progressSystemsController.list
);

// Create progress system
router.post(
  '/',
  authenticate,
  validate(createProgressSystemSchema),
  progressSystemsController.create
);

// Single progress system operations
router.get('/:id', optionalAuth, progressSystemsController.getOne);
router.put(
  '/:id',
  authenticate,
  validate(updateProgressSystemSchema),
  progressSystemsController.update
);
router.delete('/:id', authenticate, progressSystemsController.delete);

export default router;
