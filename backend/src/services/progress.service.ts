import { prisma } from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import {
  CreateProgressSystemInput,
  UpdateProgressSystemInput,
  ProgressSystemFilters,
  ProgressSystemResponse,
  ProgressSystemType,
} from '../types/progress.types';

export class ProgressSystemsService {
  /**
   * Verify user has access to the project
   */
  private async verifyProjectAccess(projectId: string, userId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        collaborators: {
          where: { userId },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const isOwner = project.ownerId === userId;
    const isCollaborator = project.collaborators.length > 0;

    if (!isOwner && !isCollaborator) {
      throw new ForbiddenError('Access denied to this project');
    }
  }

  /**
   * Create a new progress system
   */
  async createProgressSystem(
    userId: string,
    input: CreateProgressSystemInput
  ): Promise<ProgressSystemResponse> {
    // Verify project access
    await this.verifyProjectAccess(input.projectId, userId);

    // Check if system with same name already exists for this project
    const existing = await prisma.progressSystem.findFirst({
      where: {
        projectId: input.projectId,
        systemName: input.systemName,
      },
    });

    if (existing) {
      throw new BadRequestError(
        `Progress system with name "${input.systemName}" already exists for this project`
      );
    }

    // Create the progress system
    const progressSystem = await prisma.progressSystem.create({
      data: {
        projectId: input.projectId,
        systemType: input.systemType,
        systemName: input.systemName,
        configuration: input.configuration as any,
      },
    });

    return progressSystem as ProgressSystemResponse;
  }

  /**
   * Get a single progress system by ID
   */
  async getProgressSystem(systemId: string, userId: string): Promise<ProgressSystemResponse> {
    const progressSystem = await prisma.progressSystem.findUnique({
      where: { id: systemId },
      include: {
        project: {
          include: {
            collaborators: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!progressSystem) {
      throw new NotFoundError('Progress system not found');
    }

    // Check access (owner, collaborator, or public project)
    const isOwner = progressSystem.project.ownerId === userId;
    const isCollaborator = progressSystem.project.collaborators.length > 0;
    const isPublic = progressSystem.project.isPublic;

    if (!isOwner && !isCollaborator && !isPublic) {
      throw new ForbiddenError('Access denied to this progress system');
    }

    // Remove project details from response
    const { project, ...systemData } = progressSystem;

    return systemData as ProgressSystemResponse;
  }

  /**
   * List progress systems for a project
   */
  async listProgressSystems(
    userId: string,
    filters: ProgressSystemFilters
  ): Promise<ProgressSystemResponse[]> {
    // Verify project access
    await this.verifyProjectAccess(filters.projectId, userId);

    const where: any = {
      projectId: filters.projectId,
    };

    if (filters.systemType) {
      where.systemType = filters.systemType;
    }

    const progressSystems = await prisma.progressSystem.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return progressSystems as ProgressSystemResponse[];
  }

  /**
   * Update a progress system
   */
  async updateProgressSystem(
    systemId: string,
    userId: string,
    updates: UpdateProgressSystemInput
  ): Promise<ProgressSystemResponse> {
    const progressSystem = await prisma.progressSystem.findUnique({
      where: { id: systemId },
      include: {
        project: true,
      },
    });

    if (!progressSystem) {
      throw new NotFoundError('Progress system not found');
    }

    // Only owner can update
    if (progressSystem.project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can update progress systems');
    }

    // If updating name, check for duplicates
    if (updates.systemName && updates.systemName !== progressSystem.systemName) {
      const existing = await prisma.progressSystem.findFirst({
        where: {
          projectId: progressSystem.projectId,
          systemName: updates.systemName,
          id: { not: systemId },
        },
      });

      if (existing) {
        throw new BadRequestError(
          `Progress system with name "${updates.systemName}" already exists for this project`
        );
      }
    }

    const updated = await prisma.progressSystem.update({
      where: { id: systemId },
      data: {
        ...(updates.systemName && { systemName: updates.systemName }),
        ...(updates.configuration && { configuration: updates.configuration as any }),
      },
    });

    return updated as ProgressSystemResponse;
  }

  /**
   * Delete a progress system
   */
  async deleteProgressSystem(systemId: string, userId: string): Promise<void> {
    const progressSystem = await prisma.progressSystem.findUnique({
      where: { id: systemId },
      include: {
        project: true,
      },
    });

    if (!progressSystem) {
      throw new NotFoundError('Progress system not found');
    }

    // Only owner can delete
    if (progressSystem.project.ownerId !== userId) {
      throw new ForbiddenError('Only the project owner can delete progress systems');
    }

    await prisma.progressSystem.delete({
      where: { id: systemId },
    });
  }

  /**
   * Get all progress systems grouped by type for a project
   */
  async getProjectProgressSystems(
    projectId: string,
    userId: string
  ): Promise<Record<ProgressSystemType, ProgressSystemResponse[]>> {
    // Verify project access
    await this.verifyProjectAccess(projectId, userId);

    const systems = await prisma.progressSystem.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by system type
    const grouped: Record<ProgressSystemType, ProgressSystemResponse[]> = {
      web_marks: [],
      skills: [],
      inventory: [],
      relationships: [],
    };

    systems.forEach((system) => {
      const type = system.systemType as ProgressSystemType;
      grouped[type].push(system as ProgressSystemResponse);
    });

    return grouped;
  }
}
