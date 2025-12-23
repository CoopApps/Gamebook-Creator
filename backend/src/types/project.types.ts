/**
 * Project-related types and interfaces
 */

export interface CreateProjectInput {
  title: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  isPublic?: boolean;
  thumbnailUrl?: string;
}

export interface ProjectFilters {
  userId?: string;
  isPublic?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastAccessed' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectWithStats {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  owner: {
    id: string;
    username: string;
    email: string;
  };
  _count: {
    nodes: number;
    connections: number;
    progressSystems: number;
    collaborators: number;
  };
}

export interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  nodeCount: number;
  connectionCount: number;
  owner?: {
    username: string;
  };
}
