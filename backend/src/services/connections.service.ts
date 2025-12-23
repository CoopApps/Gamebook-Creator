import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';
import {
  CreateConnectionInput,
  UpdateConnectionInput,
  ConnectionFilters,
} from '../types/connection.types';

export class ConnectionsService {
  /**
   * Verify user has access to project
   */
  private async verifyProjectAccess(projectId: string, userId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: {
          where: {
            userId,
            acceptedAt: { not: null },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isOwner = project.userId === userId;
    const isCollaborator = project.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new ForbiddenError('You do not have access to this project');
    }
  }

  /**
   * Create a new connection
   */
  async createConnection(userId: string, input: CreateConnectionInput) {
    const { projectId, fromNodeId, toNodeId, connectionType, conditionText, choiceText } = input;

    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    // Verify both nodes exist and belong to the project
    const [fromNode, toNode] = await Promise.all([
      prisma.node.findUnique({
        where: { id: fromNodeId },
      }),
      prisma.node.findUnique({
        where: { id: toNodeId },
      }),
    ]);

    if (!fromNode || fromNode.deletedAt) {
      throw new NotFoundError('Source node not found');
    }

    if (!toNode || toNode.deletedAt) {
      throw new NotFoundError('Target node not found');
    }

    if (fromNode.projectId !== projectId || toNode.projectId !== projectId) {
      throw new BadRequestError('Nodes must belong to the specified project');
    }

    // Prevent self-connections
    if (fromNodeId === toNodeId) {
      throw new BadRequestError('Cannot connect a node to itself');
    }

    // Check for duplicate connection
    const existingConnection = await prisma.connection.findUnique({
      where: {
        fromNodeId_toNodeId_connectionType: {
          fromNodeId,
          toNodeId,
          connectionType,
        },
      },
    });

    if (existingConnection) {
      throw new ConflictError('This connection already exists');
    }

    // Create connection
    const connection = await prisma.connection.create({
      data: {
        projectId,
        fromNodeId,
        toNodeId,
        connectionType,
        conditionText,
        choiceText,
      },
      include: {
        fromNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
        toNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Connection created: ${connection.id} in project: ${projectId}`);

    return connection;
  }

  /**
   * Get a single connection by ID
   */
  async getConnection(connectionId: string, userId: string) {
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
            isPublic: true,
          },
        },
        fromNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
        toNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundError('Connection not found');
    }

    // Check access
    const isOwner = connection.project.userId === userId;
    const isPublic = connection.project.isPublic;

    if (!isPublic && !isOwner) {
      await this.verifyProjectAccess(connection.project.id, userId);
    }

    return connection;
  }

  /**
   * List connections in a project
   */
  async listConnections(userId: string, filters: ConnectionFilters) {
    const { projectId, fromNodeId, toNodeId, connectionType } = filters;

    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    const where: any = {
      projectId,
    };

    if (fromNodeId) {
      where.fromNodeId = fromNodeId;
    }

    if (toNodeId) {
      where.toNodeId = toNodeId;
    }

    if (connectionType) {
      where.connectionType = connectionType;
    }

    const connections = await prisma.connection.findMany({
      where,
      include: {
        fromNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
        toNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return connections;
  }

  /**
   * Update a connection
   */
  async updateConnection(connectionId: string, userId: string, updates: UpdateConnectionInput) {
    // Get existing connection
    const existingConnection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        project: true,
      },
    });

    if (!existingConnection) {
      throw new NotFoundError('Connection not found');
    }

    // Verify access
    await this.verifyProjectAccess(existingConnection.project.id, userId);

    // Update connection
    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: updates,
      include: {
        fromNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
        toNode: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Connection updated: ${connectionId}`);

    return connection;
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string, userId: string) {
    // Get existing connection
    const existingConnection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        project: true,
      },
    });

    if (!existingConnection) {
      throw new NotFoundError('Connection not found');
    }

    // Verify access
    await this.verifyProjectAccess(existingConnection.project.id, userId);

    // Delete connection
    await prisma.connection.delete({
      where: { id: connectionId },
    });

    logger.info(`Connection deleted: ${connectionId}`);

    return { success: true, message: 'Connection deleted successfully' };
  }

  /**
   * Get connections for a specific node (both from and to)
   */
  async getNodeConnections(nodeId: string, userId: string) {
    // Get node to verify access
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        project: true,
      },
    });

    if (!node || node.deletedAt) {
      throw new NotFoundError('Node not found');
    }

    // Verify access
    const isOwner = node.project.userId === userId;
    const isPublic = node.project.isPublic;

    if (!isPublic && !isOwner) {
      await this.verifyProjectAccess(node.project.id, userId);
    }

    // Get connections
    const [connectionsFrom, connectionsTo] = await Promise.all([
      prisma.connection.findMany({
        where: { fromNodeId: nodeId },
        include: {
          toNode: {
            select: {
              id: true,
              nodeNumber: true,
              nodeType: true,
              title: true,
            },
          },
        },
      }),
      prisma.connection.findMany({
        where: { toNodeId: nodeId },
        include: {
          fromNode: {
            select: {
              id: true,
              nodeNumber: true,
              nodeType: true,
              title: true,
            },
          },
        },
      }),
    ]);

    return {
      outgoing: connectionsFrom,
      incoming: connectionsTo,
    };
  }
}

export default ConnectionsService;
