import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectsService } from '../services/projects.service';
import { BadRequestError } from '../utils/errors';

export class ProjectsController {
  private projectsService: ProjectsService;

  constructor() {
    this.projectsService = new ProjectsService();
  }

  /**
   * Create a new project
   * POST /api/projects
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { title, description, isPublic } = req.body;

      const project = await this.projectsService.createProject(req.user.id, {
        title,
        description,
        isPublic,
      });

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single project by ID
   * GET /api/projects/:id
   */
  getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const project = await this.projectsService.getProject(id, userId);

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List projects (user's own or public)
   * GET /api/projects
   */
  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        search,
        isPublic,
        limit = '20',
        offset = '0',
        sortBy = 'lastAccessed',
        sortOrder = 'desc',
      } = req.query;

      const userId = req.user?.id;

      const result = await this.projectsService.listProjects({
        userId: isPublic === 'true' ? undefined : userId,
        isPublic: isPublic === 'true',
        search: search as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      });

      res.json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's projects summary
   * GET /api/projects/my/summary
   */
  getMySummary = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const projects = await this.projectsService.getUserProjectsSummary(req.user.id);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get public projects
   * GET /api/projects/public
   */
  getPublic = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = '20', offset = '0' } = req.query;

      const result = await this.projectsService.getPublicProjects(
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search projects
   * GET /api/projects/search
   */
  search = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, limit = '20', offset = '0' } = req.query;

      if (!q) {
        throw new BadRequestError('Search query is required');
      }

      const result = await this.projectsService.searchProjects(
        q as string,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a project
   * PUT /api/projects/:id
   */
  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;
      const updates = req.body;

      const project = await this.projectsService.updateProject(id, req.user.id, updates);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a project
   * DELETE /api/projects/:id
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;

      const result = await this.projectsService.deleteProject(id, req.user.id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Duplicate a project
   * POST /api/projects/:id/duplicate
   */
  duplicate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;

      const project = await this.projectsService.duplicateProject(id, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Project duplicated successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ProjectsController;
