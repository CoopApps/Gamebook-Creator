import { Router } from 'express';
import { ProjectsController } from '../controllers/projects.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validate } from '../validators/auth.validator';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  searchProjectsSchema,
} from '../validators/project.validator';

const router = Router();
const projectsController = new ProjectsController();

/**
 * @route   GET /api/projects/my/summary
 * @desc    Get user's projects summary
 * @access  Private
 */
router.get('/my/summary', authenticate, projectsController.getMySummary);

/**
 * @route   GET /api/projects/public
 * @desc    Get public projects
 * @access  Public
 */
router.get('/public', projectsController.getPublic);

/**
 * @route   GET /api/projects/search
 * @desc    Search projects
 * @access  Public
 */
router.get('/search', validate(searchProjectsSchema), projectsController.search);

/**
 * @route   GET /api/projects
 * @desc    List projects (user's own if authenticated, public if not)
 * @access  Public (returns user's projects if authenticated)
 */
router.get('/', optionalAuth, validate(listProjectsSchema), projectsController.list);

/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post('/', authenticate, validate(createProjectSchema), projectsController.create);

/**
 * @route   GET /api/projects/:id
 * @desc    Get a single project by ID
 * @access  Public (if project is public) / Private (if project is private)
 */
router.get('/:id', optionalAuth, projectsController.getOne);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update a project
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, validate(updateProjectSchema), projectsController.update);

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete a project
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, projectsController.delete);

/**
 * @route   POST /api/projects/:id/duplicate
 * @desc    Duplicate a project
 * @access  Private (can duplicate own or public projects)
 */
router.post('/:id/duplicate', authenticate, projectsController.duplicate);

export default router;
