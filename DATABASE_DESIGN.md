# Database Design - Detailed Analysis

## Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
└──────┬──────┘
       │ 1
       │
       │ *
┌──────┴──────────┐         ┌──────────────────┐
│    Projects     │◄────────┤  Collaborators   │
└──────┬──────────┘         └──────────────────┘
       │ 1
       │
       ├─────────────┬─────────────┬──────────────┐
       │ *           │ *           │ *            │ *
┌──────┴──────┐ ┌───┴──────┐ ┌────┴────────┐ ┌──┴─────────┐
│    Nodes    │ │Connections│ │Progress     │ │  Exports   │
│             │ │           │ │ Systems     │ │            │
└──────┬──────┘ └───────────┘ └─────────────┘ └────────────┘
       │ 1
       │
       │ *
┌──────┴──────────┐
│ Story Segments  │
└─────────────────┘
```

## Data Integrity Constraints

### Business Rules

1. **Project Ownership**
   - Every project must have exactly one owner
   - Owner cannot be removed from collaborators
   - Deleting a user cascades to delete their owned projects

2. **Node Numbering**
   - Node numbers must be unique within a project
   - Node numbers should be sequential but gaps are allowed
   - Deleting a node doesn't renumber other nodes

3. **Connections**
   - Cannot connect a node to itself
   - Duplicate connections of same type between same nodes are prevented
   - Connections are deleted when either connected node is deleted

4. **Story Segments**
   - Action nodes can have 1-3 story segments
   - Terminal nodes (success, game-over) limited to 1 segment
   - Segments must be numbered sequentially starting from 1

5. **Progress Systems**
   - Each project can have multiple progress systems
   - System types: web, skills, inventory, relationships
   - Configuration stored as flexible JSONB

### Referential Integrity

```sql
-- Cascade Deletes
User deleted → All owned projects deleted
Project deleted → All nodes, connections, systems, exports deleted
Node deleted → All connections (from/to), story segments deleted

-- Prevent Deletes
Cannot delete node if it's referenced as START node in project
Cannot delete user who is sole owner of active projects

-- Soft Deletes (Optional for Recovery)
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE nodes ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;
```

## Node Properties Schema

### JSONB Structure for Different Node Types

```javascript
// Start Node
{
  "nodeType": "start",
  "properties": {
    "initialStats": {
      "strength": 10,
      "intelligence": 10,
      "luck": 10
    },
    "startingInventory": ["flashlight", "notebook"]
  }
}

// Choice Node
{
  "nodeType": "choice",
  "properties": {
    "timeLimit": 30, // seconds
    "canGoBack": false,
    "randomizeOrder": true
  }
}

// Conditional Node
{
  "nodeType": "conditional",
  "properties": {
    "condition": "webMarks >= 5 AND hasItem('key')",
    "failureTarget": 23,
    "successTarget": 45
  }
}

// Combat Node
{
  "nodeType": "combat",
  "properties": {
    "combatType": "2d6",
    "enemyName": "Shadow Beast",
    "enemyStrength": 15,
    "winThreshold": 8,
    "damageOnLoss": 3,
    "winTarget": 47,
    "lossTarget": 12
  }
}

// Web Mark Node
{
  "nodeType": "web-mark",
  "properties": {
    "markNumber": 14,
    "markValue": 1,
    "displayMessage": "You found an important clue!"
  }
}

// Inventory Node
{
  "nodeType": "inventory",
  "properties": {
    "action": "add", // add, remove, check, list
    "items": ["ancient-key", "silver-coin"],
    "requiredItems": [],
    "hasItemTarget": 56,
    "missingItemTarget": 23
  }
}

// Success Node
{
  "nodeType": "success",
  "properties": {
    "ending": "true-ending",
    "achievementId": "perfect-detective",
    "scoreMultiplier": 2.0
  }
}

// Game Over Node
{
  "nodeType": "game-over",
  "properties": {
    "deathType": "trapped",
    "canContinue": false,
    "continueTarget": null
  }
}
```

## Progress Systems Configuration

```javascript
// Web Tracking System
{
  "systemType": "web",
  "systemName": "Investigation Progress",
  "configuration": {
    "maxMarks": 100,
    "marksRequired": 5,
    "displayStyle": "percentage", // percentage, count, visual
    "resetOnFailure": false
  }
}

// Skill System
{
  "systemType": "skills",
  "systemName": "Character Attributes",
  "configuration": {
    "skills": [
      { "name": "Strength", "min": 0, "max": 20, "default": 10 },
      { "name": "Intelligence", "min": 0, "max": 20, "default": 10 },
      { "name": "Luck", "min": 0, "max": 20, "default": 10 }
    ],
    "pointPool": 30,
    "canRespec": false
  }
}

// Inventory System
{
  "systemType": "inventory",
  "systemName": "Item Management",
  "configuration": {
    "maxItems": 10,
    "maxWeight": 50,
    "allowDuplicates": false,
    "startingItems": ["flashlight", "notebook"]
  }
}

// Relationship System
{
  "systemType": "relationships",
  "systemName": "NPC Relations",
  "configuration": {
    "npcs": [
      { "id": "detective-smith", "name": "Detective Smith", "startingLevel": 0 },
      { "id": "mysterious-woman", "name": "Elena", "startingLevel": 0 }
    ],
    "levels": ["hostile", "neutral", "friendly", "allied"],
    "impactChoices": true
  }
}
```

## Indexing Strategy

### Read-Heavy Queries (90% of traffic)

```sql
-- Project listing by user (sorted by last accessed)
CREATE INDEX idx_projects_user_accessed
ON projects(user_id, last_accessed DESC)
WHERE deleted_at IS NULL;

-- Public project discovery
CREATE INDEX idx_projects_public
ON projects(is_public, created_at DESC)
WHERE is_public = TRUE AND deleted_at IS NULL;

-- Node retrieval for rendering
CREATE INDEX idx_nodes_project_number
ON nodes(project_id, node_number)
WHERE deleted_at IS NULL;

-- Connection traversal
CREATE INDEX idx_connections_from
ON connections(from_node_id);
CREATE INDEX idx_connections_to
ON connections(to_node_id);

-- Story segment ordering
CREATE INDEX idx_segments_node
ON story_segments(node_id, segment_number);

-- Full-text search on projects
CREATE INDEX idx_projects_search
ON projects USING GIN(to_tsvector('english', title || ' ' || description));

-- Search nodes by content
CREATE INDEX idx_nodes_content_search
ON nodes USING GIN(to_tsvector('english', title || ' ' || content));
```

### Write Optimization

```sql
-- Batch insert optimization
-- Use COPY or multi-row INSERT for bulk node creation
INSERT INTO nodes (project_id, node_number, node_type, title, content, position_x, position_y)
VALUES
  (uuid, 1, 'start', 'Beginning', 'content', 0, 0),
  (uuid, 2, 'story', 'Next', 'content', 100, 0),
  (uuid, 3, 'choice', 'Decision', 'content', 200, 0);

-- Use transactions for related operations
BEGIN;
  INSERT INTO nodes ... RETURNING id;
  INSERT INTO story_segments ...;
  INSERT INTO connections ...;
COMMIT;
```

## Data Consistency Patterns

### Optimistic Locking for Collaboration

```sql
-- Add version field to detect conflicts
ALTER TABLE nodes ADD COLUMN version INTEGER DEFAULT 1;

-- Update with version check
UPDATE nodes
SET
  content = 'new content',
  version = version + 1,
  updated_at = NOW()
WHERE
  id = $1
  AND version = $2  -- This is the version client has
RETURNING *;

-- If no rows updated, version conflict occurred
```

### Event Sourcing for Audit Trail

```sql
-- Project events table
CREATE TABLE project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_project ON project_events(project_id, created_at DESC);

-- Example events
{
  "eventType": "node.created",
  "eventData": {
    "nodeId": "uuid",
    "nodeNumber": 5,
    "nodeType": "choice"
  }
}

{
  "eventType": "connection.created",
  "eventData": {
    "connectionId": "uuid",
    "fromNode": 5,
    "toNode": 12,
    "type": "conditional"
  }
}
```

## Query Examples

### Common Read Queries

```sql
-- Get complete project with all data
WITH project_data AS (
  SELECT p.*,
         json_build_object(
           'id', u.id,
           'username', u.username
         ) as owner
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE p.id = $1
),
nodes_data AS (
  SELECT
    n.*,
    json_agg(
      json_build_object(
        'segmentNumber', s.segment_number,
        'content', s.content
      ) ORDER BY s.segment_number
    ) FILTER (WHERE s.id IS NOT NULL) as segments
  FROM nodes n
  LEFT JOIN story_segments s ON n.id = s.node_id
  WHERE n.project_id = $1
  GROUP BY n.id
),
connections_data AS (
  SELECT *
  FROM connections
  WHERE project_id = $1
),
systems_data AS (
  SELECT *
  FROM progress_systems
  WHERE project_id = $1
)
SELECT
  (SELECT row_to_json(project_data.*) FROM project_data) as project,
  (SELECT json_agg(nodes_data.*) FROM nodes_data) as nodes,
  (SELECT json_agg(connections_data.*) FROM connections_data) as connections,
  (SELECT json_agg(systems_data.*) FROM systems_data) as systems;

-- Get node with all connections
SELECT
  n.*,
  json_agg(DISTINCT c_from.*) FILTER (WHERE c_from.id IS NOT NULL) as connections_from,
  json_agg(DISTINCT c_to.*) FILTER (WHERE c_to.id IS NOT NULL) as connections_to
FROM nodes n
LEFT JOIN connections c_from ON n.id = c_from.from_node_id
LEFT JOIN connections c_to ON n.id = c_to.to_node_id
WHERE n.id = $1
GROUP BY n.id;

-- Search public projects
SELECT
  p.*,
  u.username as owner_username,
  COUNT(DISTINCT n.id) as node_count,
  COUNT(DISTINCT c.id) as connection_count
FROM projects p
JOIN users u ON p.user_id = u.id
LEFT JOIN nodes n ON p.id = n.project_id
LEFT JOIN connections c ON p.id = c.project_id
WHERE
  p.is_public = TRUE
  AND to_tsvector('english', p.title || ' ' || p.description) @@ plainto_tsquery('english', $1)
GROUP BY p.id, u.username
ORDER BY p.created_at DESC
LIMIT 20 OFFSET $2;
```

### Common Write Queries

```sql
-- Create project with initial node
WITH new_project AS (
  INSERT INTO projects (user_id, title, description)
  VALUES ($1, $2, $3)
  RETURNING id
),
start_node AS (
  INSERT INTO nodes (project_id, node_number, node_type, title, content, position_x, position_y)
  SELECT id, 1, 'start', 'The Beginning', 'Your adventure starts here...', 100, 100
  FROM new_project
  RETURNING *
)
SELECT * FROM new_project;

-- Duplicate project with all nodes and connections
WITH new_project AS (
  INSERT INTO projects (user_id, title, description, is_public)
  SELECT $1, title || ' (Copy)', description, FALSE
  FROM projects
  WHERE id = $2
  RETURNING id
),
node_mapping AS (
  INSERT INTO nodes (project_id, node_number, node_type, title, content, position_x, position_y, properties)
  SELECT (SELECT id FROM new_project), node_number, node_type, title, content, position_x, position_y, properties
  FROM nodes
  WHERE project_id = $2
  RETURNING id, node_number
),
copy_connections AS (
  INSERT INTO connections (project_id, from_node_id, to_node_id, connection_type, condition_text, choice_text)
  SELECT
    (SELECT id FROM new_project),
    nm_from.id,
    nm_to.id,
    c.connection_type,
    c.condition_text,
    c.choice_text
  FROM connections c
  JOIN nodes n_from ON c.from_node_id = n_from.id
  JOIN nodes n_to ON c.to_node_id = n_to.id
  JOIN node_mapping nm_from ON n_from.node_number = nm_from.node_number
  JOIN node_mapping nm_to ON n_to.node_number = nm_to.node_number
  WHERE c.project_id = $2
)
SELECT * FROM new_project;

-- Batch update node positions (for auto-layout)
UPDATE nodes AS n
SET
  position_x = updates.x,
  position_y = updates.y,
  updated_at = NOW()
FROM (VALUES
  (uuid1, 100.0, 100.0),
  (uuid2, 300.0, 100.0),
  (uuid3, 500.0, 100.0)
) AS updates(id, x, y)
WHERE n.id = updates.id;
```

## Performance Benchmarks (Target)

```
Read Operations:
- Get project by ID: < 50ms
- List user projects (20): < 100ms
- Get all nodes for project: < 100ms
- Search public projects: < 200ms
- Get node with connections: < 30ms

Write Operations:
- Create project: < 100ms
- Create node: < 50ms
- Update node: < 30ms
- Create connection: < 30ms
- Delete project (cascade): < 500ms

Bulk Operations:
- Import 100 nodes: < 2s
- Duplicate project (100 nodes): < 3s
- Auto-layout 50 nodes: < 1s
```

## Backup & Recovery

```bash
# Daily automated backups
pg_dump -h localhost -U postgres gamebook_db > backup_$(date +%Y%m%d).sql

# Point-in-time recovery (requires WAL archiving)
# Enable in postgresql.conf:
# archive_mode = on
# archive_command = 'cp %p /archive/%f'

# Restore from backup
psql -h localhost -U postgres -d gamebook_db < backup_20240101.sql

# Disaster recovery time objectives (RTO/RPO):
# RTO: < 1 hour (time to restore service)
# RPO: < 15 minutes (acceptable data loss)
```

## Data Migration Strategy

```sql
-- Version 1.0 → 1.1: Add soft deletes
ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE nodes ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_nodes_deleted ON nodes(deleted_at) WHERE deleted_at IS NULL;

-- Version 1.1 → 1.2: Add multi-story segments
-- Already handled by story_segments table

-- Version 1.2 → 1.3: Add project templates
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    category VARCHAR(100),
    is_official BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Version 1.3 → 1.4: Add analytics
CREATE TABLE project_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    recorded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_analytics_project ON project_analytics(project_id, recorded_at DESC);
```
