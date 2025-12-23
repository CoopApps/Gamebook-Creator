/**
 * Connection-related types and interfaces
 */

export type ConnectionType = 'normal' | 'conditional' | 'backward' | 'combat';

export interface CreateConnectionInput {
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  connectionType: ConnectionType;
  conditionText?: string;
  choiceText?: string;
}

export interface UpdateConnectionInput {
  connectionType?: ConnectionType;
  conditionText?: string;
  choiceText?: string;
}

export interface ConnectionFilters {
  projectId: string;
  fromNodeId?: string;
  toNodeId?: string;
  connectionType?: ConnectionType;
}

export interface ConnectionWithNodes {
  id: string;
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  connectionType: ConnectionType;
  conditionText: string | null;
  choiceText: string | null;
  createdAt: Date;
  fromNode: {
    id: string;
    nodeNumber: number;
    nodeType: string;
    title: string | null;
  };
  toNode: {
    id: string;
    nodeNumber: number;
    nodeType: string;
    title: string | null;
  };
}
