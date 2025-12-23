/**
 * Node-related types and interfaces
 */

export type NodeType =
  | 'start'
  | 'story'
  | 'choice'
  | 'conditional'
  | 'combat'
  | 'web-mark'
  | 'success'
  | 'game-over'
  | 'inventory';

export interface CreateNodeInput {
  projectId: string;
  nodeNumber: number;
  nodeType: NodeType;
  title?: string;
  content?: string;
  positionX: number;
  positionY: number;
  properties?: any; // JSONB - flexible properties per node type
}

export interface UpdateNodeInput {
  nodeNumber?: number;
  nodeType?: NodeType;
  title?: string;
  content?: string;
  positionX?: number;
  positionY?: number;
  properties?: any;
}

export interface NodeFilters {
  projectId: string;
  nodeType?: NodeType;
  limit?: number;
  offset?: number;
}

export interface NodeWithSegments {
  id: string;
  projectId: string;
  nodeNumber: number;
  nodeType: NodeType;
  title: string | null;
  content: string | null;
  positionX: number;
  positionY: number;
  properties: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  segments: StorySegment[];
  connectionsFrom: any[];
  connectionsTo: any[];
}

export interface StorySegment {
  id: string;
  nodeId: string;
  segmentNumber: number;
  content: string;
  createdAt: Date;
}

export interface CreateSegmentInput {
  segmentNumber: number;
  content: string;
}

export interface UpdateSegmentInput {
  content: string;
}

export interface BatchUpdateNodesInput {
  updates: Array<{
    id: string;
    positionX?: number;
    positionY?: number;
  }>;
}
