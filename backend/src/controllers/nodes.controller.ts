import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NodesService } from '../services/nodes.service';
import { BadRequestError } from '../utils/errors';

export class NodesController {
  private nodesService: NodesService;

  constructor() {
    this.nodesService = new NodesService();
  }

  /**
   * Create a new node
   * POST /api/nodes
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const node = await this.nodesService.createNode(req.user.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Node created successfully',
        data: node,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a single node
   * GET /api/nodes/:id
   */
  getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';

      const node = await this.nodesService.getNode(id, userId);

      res.json({
        success: true,
        data: node,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List nodes in a project
   * GET /api/nodes
   */
  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { projectId, nodeType, limit, offset } = req.query;

      if (!projectId) {
        throw new BadRequestError('Project ID is required');
      }

      const result = await this.nodesService.listNodes(req.user.id, {
        projectId: projectId as string,
        nodeType: nodeType as any,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: result.nodes,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a node
   * PUT /api/nodes/:id
   */
  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;

      const node = await this.nodesService.updateNode(id, req.user.id, req.body);

      res.json({
        success: true,
        message: 'Node updated successfully',
        data: node,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a node
   * DELETE /api/nodes/:id
   */
  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;

      const result = await this.nodesService.deleteNode(id, req.user.id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Batch update node positions
   * PATCH /api/nodes/batch/positions
   */
  batchUpdatePositions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { projectId, updates } = req.body;

      if (!projectId || !updates) {
        throw new BadRequestError('projectId and updates are required');
      }

      const result = await this.nodesService.batchUpdatePositions(req.user.id, projectId, {
        updates,
      });

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a story segment to a node
   * POST /api/nodes/:id/segments
   */
  addSegment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = req.params;
      const { segmentNumber, content } = req.body;

      if (segmentNumber === undefined || !content) {
        throw new BadRequestError('segmentNumber and content are required');
      }

      const segment = await this.nodesService.addSegment(id, req.user.id, {
        segmentNumber,
        content,
      });

      res.status(201).json({
        success: true,
        message: 'Segment added successfully',
        data: segment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a story segment
   * PUT /api/nodes/:id/segments/:segmentNumber
   */
  updateSegment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id, segmentNumber } = req.params;
      const { content } = req.body;

      if (!content) {
        throw new BadRequestError('content is required');
      }

      const result = await this.nodesService.updateSegment(
        id,
        parseInt(segmentNumber, 10),
        req.user.id,
        { content }
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a story segment
   * DELETE /api/nodes/:id/segments/:segmentNumber
   */
  deleteSegment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      const { id, segmentNumber } = req.params;

      const result = await this.nodesService.deleteSegment(
        id,
        parseInt(segmentNumber, 10),
        req.user.id
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default NodesController;
