/**
 * Progress Systems Types
 *
 * Defines types for game mechanics tracking systems:
 * - Web Marks: Boolean flags for tracking story progress
 * - Skills: Numeric attributes (strength, intelligence, luck, etc.)
 * - Inventory: Item tracking with quantities
 * - Relationships: NPC relationship/reputation tracking
 */

/**
 * Available progress system types
 */
export type ProgressSystemType =
  | 'web_marks'      // Boolean flags for story progress
  | 'skills'         // Numeric attributes (strength, intelligence, etc.)
  | 'inventory'      // Item tracking with quantities
  | 'relationships'; // NPC relationship scores

/**
 * Web Marks System Configuration
 * Tracks boolean flags for story progress (e.g., "has_key", "defeated_boss")
 */
export interface WebMarksConfig {
  marks: {
    name: string;           // e.g., "has_key", "visited_castle"
    description?: string;   // Human-readable description
    defaultValue: boolean;  // Starting value
  }[];
}

/**
 * Skills System Configuration
 * Tracks numeric attributes like strength, intelligence, luck
 */
export interface SkillsConfig {
  skills: {
    name: string;           // e.g., "strength", "intelligence", "luck"
    description?: string;   // Human-readable description
    minValue: number;       // Minimum allowed value
    maxValue: number;       // Maximum allowed value
    defaultValue: number;   // Starting value
  }[];
}

/**
 * Inventory System Configuration
 * Tracks items with quantities and optional properties
 */
export interface InventoryConfig {
  maxSlots?: number;        // Maximum inventory size (null = unlimited)
  items: {
    itemId: string;         // Unique item identifier
    name: string;           // Display name
    description?: string;   // Item description
    maxStack?: number;      // Max stack size (null = unlimited)
    properties?: Record<string, any>; // Custom item properties
  }[];
}

/**
 * Relationships System Configuration
 * Tracks NPC relationships with numeric scores
 */
export interface RelationshipsConfig {
  relationships: {
    npcId: string;          // NPC identifier
    name: string;           // NPC name
    description?: string;   // Relationship description
    minValue: number;       // Minimum relationship value
    maxValue: number;       // Maximum relationship value
    defaultValue: number;   // Starting relationship value
  }[];
}

/**
 * Union type for all system configurations
 */
export type SystemConfiguration =
  | WebMarksConfig
  | SkillsConfig
  | InventoryConfig
  | RelationshipsConfig;

/**
 * Input for creating a progress system
 */
export interface CreateProgressSystemInput {
  projectId: string;
  systemType: ProgressSystemType;
  systemName: string;
  configuration: SystemConfiguration;
}

/**
 * Input for updating a progress system
 */
export interface UpdateProgressSystemInput {
  systemName?: string;
  configuration?: SystemConfiguration;
}

/**
 * Filters for listing progress systems
 */
export interface ProgressSystemFilters {
  projectId: string;
  systemType?: ProgressSystemType;
}

/**
 * Progress system response (matches database model)
 */
export interface ProgressSystemResponse {
  id: string;
  projectId: string;
  systemType: ProgressSystemType;
  systemName: string;
  configuration: SystemConfiguration;
  createdAt: Date;
  updatedAt: Date;
}
