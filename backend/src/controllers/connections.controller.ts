import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ConnectionsService } from '../services/connections.service';
import { BadRequestError } from '../utils/errors';

export class ConnectionsController {
  private connectionsService: ConnectionsService;

  constructor() {
    this.connectionsService = new ConnectionsService();
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const connection = await this.connectionsService.createConnection(req.user.id, req.body);
      res.status(201).json({ success: true, message: 'Connection created successfully', data: connection });
    } catch (error) {
      next(error);
    }
  };

  getOne = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connection = await this.connectionsService.getConnection(req.params.id, req.user?.id || '');
      res.json({ success: true, data: connection });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const { projectId, fromNodeId, toNodeId, connectionType } = req.query;
      if (!projectId) throw new BadRequestError('Project ID is required');

      const connections = await this.connectionsService.listConnections(req.user.id, {
        projectId: projectId as string,
        fromNodeId: fromNodeId as string,
        toNodeId: toNodeId as string,
        connectionType: connectionType as any,
      });

      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const connection = await this.connectionsService.updateConnection(req.params.id, req.user.id, req.body);
      res.json({ success: true, message: 'Connection updated successfully', data: connection });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new BadRequestError('User not authenticated');
      const result = await this.connectionsService.deleteConnection(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  };

  getNodeConnections = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const connections = await this.connectionsService.getNodeConnections(req.params.nodeId, req.user?.id || '');
      res.json({ success: true, data: connections });
    } catch (error) {
      next(error);
    }
  };
}

export default ConnectionsController;
