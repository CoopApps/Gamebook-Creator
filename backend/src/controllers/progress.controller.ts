import { Request, Response, NextFunction } from 'express';
import { ProgressSystemsService } from '../services/progress.service';
import {
  CreateProgressSystemInput,
  UpdateProgressSystemInput,
  ProgressSystemFilters,
} from '../types/progress.types';

export class ProgressSystemsController {
  private progressSystemsService: ProgressSystemsService;

  constructor() {
    this.progressSystemsService = new ProgressSystemsService();
  }

  /**
   * Create a new progress system
   * POST /api/progress
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const input: CreateProgressSystemInput = req.body;

      const progressSystem = await this.progressSystemsService.createProgressSystem(
        userId,
        input
      );

      res.status(201).json({
        success: true,
        data: progressSystem,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single progress system
   * GET /api/progress/:id
   */
  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const progressSystem = await this.progressSystemsService.getProgressSystem(id, userId);

      res.json({
        success: true,
        data: progressSystem,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List progress systems for a project
   * GET /api/progress?projectId=...&systemType=...
   */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const filters: ProgressSystemFilters = {
        projectId: req.query.projectId as string,
        systemType: req.query.systemType as any,
      };

      const progressSystems = await this.progressSystemsService.listProgressSystems(
        userId,
        filters
      );

      res.json({
        success: true,
        data: progressSystems,
        count: progressSystems.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all progress systems grouped by type
   * GET /api/progress/project/:projectId/grouped
   */
  getGrouped = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const userId = req.user!.userId;

      const grouped = await this.progressSystemsService.getProjectProgressSystems(
        projectId,
        userId
      );

      res.json({
        success: true,
        data: grouped,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a progress system
   * PUT /api/progress/:id
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updates: UpdateProgressSystemInput = req.body;

      const progressSystem = await this.progressSystemsService.updateProgressSystem(
        id,
        userId,
        updates
      );

      res.json({
        success: true,
        data: progressSystem,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a progress system
   * DELETE /api/progress/:id
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await this.progressSystemsService.deleteProgressSystem(id, userId);

      res.json({
        success: true,
        message: 'Progress system deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
