import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';
import {
  CreateNodeInput,
  UpdateNodeInput,
  NodeFilters,
  CreateSegmentInput,
  UpdateSegmentInput,
  BatchUpdateNodesInput,
} from '../types/node.types';

export class NodesService {
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
   * Create a new node
   */
  async createNode(userId: string, input: CreateNodeInput) {
    const { projectId, nodeNumber, nodeType, title, content, positionX, positionY, properties } =
      input;

    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    // Check if node number already exists
    const existingNode = await prisma.node.findUnique({
      where: {
        projectId_nodeNumber: {
          projectId,
          nodeNumber,
        },
      },
    });

    if (existingNode && !existingNode.deletedAt) {
      throw new ConflictError(`Node number ${nodeNumber} already exists in this project`);
    }

    // Create node
    const node = await prisma.node.create({
      data: {
        projectId,
        nodeNumber,
        nodeType,
        title,
        content,
        positionX,
        positionY,
        properties: properties || {},
      },
      include: {
        segments: {
          orderBy: {
            segmentNumber: 'asc',
          },
        },
      },
    });

    logger.info(`Node created: ${node.id} in project: ${projectId}`);

    return node;
  }

  /**
   * Get a single node by ID
   */
  async getNode(nodeId: string, userId: string) {
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
            isPublic: true,
          },
        },
        segments: {
          orderBy: {
            segmentNumber: 'asc',
          },
        },
        connectionsFrom: {
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
        },
        connectionsTo: {
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
        },
      },
    });

    if (!node || node.deletedAt) {
      throw new NotFoundError('Node not found');
    }

    // Check access
    const isOwner = node.project.userId === userId;
    const isPublic = node.project.isPublic;

    if (!isPublic && !isOwner) {
      await this.verifyProjectAccess(node.project.id, userId);
    }

    return node;
  }

  /**
   * List nodes in a project
   */
  async listNodes(userId: string, filters: NodeFilters) {
    const { projectId, nodeType, limit = 100, offset = 0 } = filters;

    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    const where: any = {
      projectId,
      deletedAt: null,
    };

    if (nodeType) {
      where.nodeType = nodeType;
    }

    const [nodes, total] = await Promise.all([
      prisma.node.findMany({
        where,
        include: {
          segments: {
            orderBy: {
              segmentNumber: 'asc',
            },
          },
          _count: {
            select: {
              connectionsFrom: true,
              connectionsTo: true,
            },
          },
        },
        orderBy: {
          nodeNumber: 'asc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.node.count({ where }),
    ]);

    return {
      nodes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update a node
   */
  async updateNode(nodeId: string, userId: string, updates: UpdateNodeInput) {
    // Get existing node
    const existingNode = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!existingNode || existingNode.deletedAt) {
      throw new NotFoundError('Node not found');
    }

    // Verify access
    await this.verifyProjectAccess(existingNode.project.id, userId);

    // Check for node number conflicts if changing node number
    if (updates.nodeNumber && updates.nodeNumber !== existingNode.nodeNumber) {
      const conflict = await prisma.node.findUnique({
        where: {
          projectId_nodeNumber: {
            projectId: existingNode.projectId,
            nodeNumber: updates.nodeNumber,
          },
        },
      });

      if (conflict && !conflict.deletedAt) {
        throw new ConflictError(`Node number ${updates.nodeNumber} already exists`);
      }
    }

    // Update node
    const node = await prisma.node.update({
      where: { id: nodeId },
      data: {
        ...updates,
        version: {
          increment: 1, // Optimistic locking
        },
      },
      include: {
        segments: {
          orderBy: {
            segmentNumber: 'asc',
          },
        },
      },
    });

    logger.info(`Node updated: ${nodeId}`);

    return node;
  }

  /**
   * Delete a node (soft delete)
   */
  async deleteNode(nodeId: string, userId: string) {
    // Get existing node
    const existingNode = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        project: true,
      },
    });

    if (!existingNode || existingNode.deletedAt) {
      throw new NotFoundError('Node not found');
    }

    // Verify access
    await this.verifyProjectAccess(existingNode.project.id, userId);

    // Soft delete node (connections will cascade)
    await prisma.node.update({
      where: { id: nodeId },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info(`Node deleted: ${nodeId}`);

    return { success: true, message: 'Node deleted successfully' };
  }

  /**
   * Batch update node positions (for drag-and-drop)
   */
  async batchUpdatePositions(userId: string, projectId: string, input: BatchUpdateNodesInput) {
    // Verify access
    await this.verifyProjectAccess(projectId, userId);

    // Update all nodes in a transaction
    await prisma.$transaction(
      input.updates.map((update) =>
        prisma.node.update({
          where: { id: update.id },
          data: {
            positionX: update.positionX,
            positionY: update.positionY,
          },
        })
      )
    );

    logger.info(`Batch updated ${input.updates.length} node positions in project: ${projectId}`);

    return { success: true, message: `Updated ${input.updates.length} nodes` };
  }

  /**
   * Add a story segment to a node
   */
  async addSegment(nodeId: string, userId: string, input: CreateSegmentInput) {
    // Get node
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        project: true,
        segments: true,
      },
    });

    if (!node || node.deletedAt) {
      throw new NotFoundError('Node not found');
    }

    // Verify access
    await this.verifyProjectAccess(node.project.id, userId);

    // Check segment number doesn't exist
    const existingSegment = node.segments.find((s) => s.segmentNumber === input.segmentNumber);
    if (existingSegment) {
      throw new ConflictError(`Segment number ${input.segmentNumber} already exists`);
    }

    // Create segment
    const segment = await prisma.storySegment.create({
      data: {
        nodeId,
        segmentNumber: input.segmentNumber,
        content: input.content,
      },
    });

    logger.info(`Story segment added to node: ${nodeId}`);

    return segment;
  }

  /**
   * Update a story segment
   */
  async updateSegment(
    nodeId: string,
    segmentNumber: number,
    userId: string,
    input: UpdateSegmentInput
  ) {
    // Get node
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
    await this.verifyProjectAccess(node.project.id, userId);

    // Update segment
    const segment = await prisma.storySegment.updateMany({
      where: {
        nodeId,
        segmentNumber,
      },
      data: {
        content: input.content,
      },
    });

    if (segment.count === 0) {
      throw new NotFoundError('Story segment not found');
    }

    logger.info(`Story segment updated: node ${nodeId}, segment ${segmentNumber}`);

    return { success: true, message: 'Segment updated successfully' };
  }

  /**
   * Delete a story segment
   */
  async deleteSegment(nodeId: string, segmentNumber: number, userId: string) {
    // Get node
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
    await this.verifyProjectAccess(node.project.id, userId);

    // Delete segment
    const result = await prisma.storySegment.deleteMany({
      where: {
        nodeId,
        segmentNumber,
      },
    });

    if (result.count === 0) {
      throw new NotFoundError('Story segment not found');
    }

    logger.info(`Story segment deleted: node ${nodeId}, segment ${segmentNumber}`);

    return { success: true, message: 'Segment deleted successfully' };
  }
}

export default NodesService;
