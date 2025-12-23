import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectFilters,
  ProjectWithStats,
  ProjectSummary,
} from '../types/project.types';

export class ProjectsService {
  /**
   * Create a new project
   */
  async createProject(userId: string, input: CreateProjectInput) {
    const { title, description, isPublic = false } = input;

    const project = await prisma.project.create({
      data: {
        userId,
        title,
        description,
        isPublic,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            connections: true,
            progressSystems: true,
            collaborators: true,
          },
        },
      },
    });

    logger.info(`Project created: ${project.id} by user: ${userId}`);

    return project;
  }

  /**
   * Get a single project by ID
   */
  async getProject(projectId: string, userId?: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        nodes: {
          select: {
            id: true,
            nodeNumber: true,
            nodeType: true,
            title: true,
            positionX: true,
            positionY: true,
          },
          where: {
            deletedAt: null,
          },
          orderBy: {
            nodeNumber: 'asc',
          },
        },
        connections: {
          select: {
            id: true,
            fromNodeId: true,
            toNodeId: true,
            connectionType: true,
            choiceText: true,
            conditionText: true,
          },
        },
        progressSystems: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          where: {
            acceptedAt: {
              not: null,
            },
          },
        },
        _count: {
          select: {
            nodes: true,
            connections: true,
            progressSystems: true,
            exports: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check access permissions
    const isOwner = project.userId === userId;
    const isCollaborator = userId
      ? project.collaborators.some((c) => c.userId === userId)
      : false;
    const isPublic = project.isPublic;

    if (!isPublic && !isOwner && !isCollaborator) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // Update last accessed time for owner
    if (isOwner) {
      await prisma.project.update({
        where: { id: projectId },
        data: { lastAccessed: new Date() },
      });
    }

    return project;
  }

  /**
   * List projects with filters
   */
  async listProjects(filters: ProjectFilters) {
    const {
      userId,
      isPublic,
      search,
      limit = 20,
      offset = 0,
      sortBy = 'lastAccessed',
      sortOrder = 'desc',
    } = filters;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (userId) {
      where.userId = userId;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get projects
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: {
              nodes: true,
              connections: true,
              progressSystems: true,
              collaborators: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: limit,
        skip: offset,
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, userId: string, updates: UpdateProjectInput) {
    // Check if project exists and user has permission
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    if (existingProject.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this project');
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: updates,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            nodes: true,
            connections: true,
            progressSystems: true,
            collaborators: true,
          },
        },
      },
    });

    logger.info(`Project updated: ${projectId} by user: ${userId}`);

    return project;
  }

  /**
   * Delete a project (soft delete)
   */
  async deleteProject(projectId: string, userId: string) {
    // Check if project exists and user has permission
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    if (existingProject.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this project');
    }

    // Soft delete
    await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
      },
    });

    logger.info(`Project deleted: ${projectId} by user: ${userId}`);

    return { success: true, message: 'Project deleted successfully' };
  }

  /**
   * Duplicate a project
   */
  async duplicateProject(projectId: string, userId: string) {
    // Get the original project
    const originalProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        nodes: {
          where: { deletedAt: null },
          include: {
            segments: true,
          },
        },
        connections: true,
        progressSystems: true,
      },
    });

    if (!originalProject) {
      throw new NotFoundError('Project not found');
    }

    // Check access permissions
    const isOwner = originalProject.userId === userId;
    const isPublic = originalProject.isPublic;

    if (!isPublic && !isOwner) {
      throw new ForbiddenError('You do not have access to this project');
    }

    // Create new project
    const newProject = await prisma.project.create({
      data: {
        userId,
        title: `${originalProject.title} (Copy)`,
        description: originalProject.description,
        isPublic: false, // Duplicates are private by default
      },
    });

    // Duplicate nodes
    const nodeIdMap = new Map<string, string>();

    for (const node of originalProject.nodes) {
      const newNode = await prisma.node.create({
        data: {
          projectId: newProject.id,
          nodeNumber: node.nodeNumber,
          nodeType: node.nodeType,
          title: node.title,
          content: node.content,
          positionX: node.positionX,
          positionY: node.positionY,
          properties: node.properties,
        },
      });

      nodeIdMap.set(node.id, newNode.id);

      // Duplicate story segments
      if (node.segments.length > 0) {
        await prisma.storySegment.createMany({
          data: node.segments.map((segment) => ({
            nodeId: newNode.id,
            segmentNumber: segment.segmentNumber,
            content: segment.content,
          })),
        });
      }
    }

    // Duplicate connections
    if (originalProject.connections.length > 0) {
      await prisma.connection.createMany({
        data: originalProject.connections.map((conn) => ({
          projectId: newProject.id,
          fromNodeId: nodeIdMap.get(conn.fromNodeId)!,
          toNodeId: nodeIdMap.get(conn.toNodeId)!,
          connectionType: conn.connectionType,
          conditionText: conn.conditionText,
          choiceText: conn.choiceText,
        })),
      });
    }

    // Duplicate progress systems
    if (originalProject.progressSystems.length > 0) {
      await prisma.progressSystem.createMany({
        data: originalProject.progressSystems.map((system) => ({
          projectId: newProject.id,
          systemType: system.systemType,
          systemName: system.systemName,
          configuration: system.configuration,
        })),
      });
    }

    logger.info(`Project duplicated: ${projectId} -> ${newProject.id} by user: ${userId}`);

    // Return the new project with full details
    return this.getProject(newProject.id, userId);
  }

  /**
   * Get user's projects summary
   */
  async getUserProjectsSummary(userId: string): Promise<ProjectSummary[]> {
    const projects = await prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        lastAccessed: true,
        _count: {
          select: {
            nodes: true,
            connections: true,
          },
        },
      },
      orderBy: {
        lastAccessed: 'desc',
      },
    });

    return projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      thumbnailUrl: p.thumbnailUrl,
      isPublic: p.isPublic,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      lastAccessed: p.lastAccessed,
      nodeCount: p._count.nodes,
      connectionCount: p._count.connections,
    }));
  }

  /**
   * Get public projects
   */
  async getPublicProjects(limit: number = 20, offset: number = 0) {
    return this.listProjects({
      isPublic: true,
      limit,
      offset,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  /**
   * Search projects
   */
  async searchProjects(query: string, limit: number = 20, offset: number = 0) {
    return this.listProjects({
      search: query,
      isPublic: true,
      limit,
      offset,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }
}

export default ProjectsService;
