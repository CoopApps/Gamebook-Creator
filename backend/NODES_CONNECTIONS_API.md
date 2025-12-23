# Nodes & Connections API - Testing Guide

Complete guide to testing the Nodes and Connections API endpoints.

## Base URLs

- Nodes: `http://localhost:3000/api/nodes`
- Connections: `http://localhost:3000/api/connections`

## Authentication

Most endpoints require authentication. Include the JWT token:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## NODES API

### 1. Create Node

**Endpoint:** `POST /api/nodes`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X POST http://localhost:3000/api/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid",
    "nodeNumber": 1,
    "nodeType": "start",
    "title": "The Beginning",
    "content": "Your adventure starts here...",
    "positionX": 100,
    "positionY": 100,
    "properties": {
      "initialStats": {
        "strength": 10,
        "intelligence": 10,
        "luck": 10
      }
    }
  }'
```

**Node Types:**
- `start` - Starting node
- `story` - Story content
- `choice` - Decision point
- `conditional` - Conditional routing
- `combat` - Combat encounter
- `web-mark` - Progress marker
- `success` - Success ending
- `game-over` - Failure ending
- `inventory` - Inventory action

**Success Response (201):**
```json
{
  "success": true,
  "message": "Node created successfully",
  "data": {
    "id": "node-uuid",
    "projectId": "project-uuid",
    "nodeNumber": 1,
    "nodeType": "start",
    "title": "The Beginning",
    "content": "Your adventure starts here...",
    "positionX": 100,
    "positionY": 100,
    "properties": {...},
    "version": 1,
    "segments": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get Single Node

**Endpoint:** `GET /api/nodes/:id`

**Requires:** Authentication (for private projects)

**Request:**
```bash
curl http://localhost:3000/api/nodes/NODE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "node-uuid",
    "nodeNumber": 1,
    "nodeType": "start",
    "title": "The Beginning",
    "content": "...",
    "positionX": 100,
    "positionY": 100,
    "properties": {...},
    "segments": [],
    "connectionsFrom": [
      {
        "id": "conn-uuid",
        "toNode": {
          "id": "target-uuid",
          "nodeNumber": 2,
          "title": "Next Scene"
        }
      }
    ],
    "connectionsTo": []
  }
}
```

### 3. List Nodes in Project

**Endpoint:** `GET /api/nodes?projectId=...`

**Requires:** Authentication + Project Access

**Request:**
```bash
# List all nodes
curl "http://localhost:3000/api/nodes?projectId=PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by node type
curl "http://localhost:3000/api/nodes?projectId=PROJECT_ID&nodeType=choice" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# With pagination
curl "http://localhost:3000/api/nodes?projectId=PROJECT_ID&limit=50&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Query Parameters:**
- `projectId` (required): Project UUID
- `nodeType` (optional): Filter by type
- `limit` (optional, max: 500): Number to return
- `offset` (optional): Skip count

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "node1-uuid",
      "nodeNumber": 1,
      "nodeType": "start",
      "_count": {
        "connectionsFrom": 1,
        "connectionsTo": 0
      }
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 100,
    "offset": 0,
    "hasMore": false
  }
}
```

### 4. Update Node

**Endpoint:** `PUT /api/nodes/:id`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X PUT http://localhost:3000/api/nodes/NODE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "content": "Updated content",
    "positionX": 200,
    "positionY": 150
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Node updated successfully",
  "data": {
    "id": "node-uuid",
    "title": "Updated Title",
    "version": 2,
    "updatedAt": "2024-01-01T00:10:00.000Z"
  }
}
```

### 5. Delete Node

**Endpoint:** `DELETE /api/nodes/:id`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/nodes/NODE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Node deleted successfully"
}
```

**Note:** Soft delete - connections are cascade deleted.

### 6. Batch Update Node Positions

**Endpoint:** `PATCH /api/nodes/batch/positions`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/nodes/batch/positions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid",
    "updates": [
      {"id": "node1-uuid", "positionX": 100, "positionY": 100},
      {"id": "node2-uuid", "positionX": 300, "positionY": 100},
      {"id": "node3-uuid", "positionX": 500, "positionY": 100}
    ]
  }'
```

**Use Case:** Drag-and-drop node repositioning

**Success Response (200):**
```json
{
  "success": true,
  "message": "Updated 3 nodes"
}
```

### 7. Add Story Segment

**Endpoint:** `POST /api/nodes/:id/segments`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X POST http://localhost:3000/api/nodes/NODE_ID/segments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "segmentNumber": 1,
    "content": "This is the first story segment for this node."
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Segment added successfully",
  "data": {
    "id": "segment-uuid",
    "nodeId": "node-uuid",
    "segmentNumber": 1,
    "content": "This is the first story segment...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 8. Update Story Segment

**Endpoint:** `PUT /api/nodes/:id/segments/:segmentNumber`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X PUT http://localhost:3000/api/nodes/NODE_ID/segments/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated segment content"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Segment updated successfully"
}
```

### 9. Delete Story Segment

**Endpoint:** `DELETE /api/nodes/:id/segments/:segmentNumber`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/nodes/NODE_ID/segments/1 \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Segment deleted successfully"
}
```

---

## CONNECTIONS API

### 1. Create Connection

**Endpoint:** `POST /api/connections`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X POST http://localhost:3000/api/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid",
    "fromNodeId": "node1-uuid",
    "toNodeId": "node2-uuid",
    "connectionType": "normal",
    "choiceText": "Continue to next scene"
  }'
```

**Connection Types:**
- `normal` - Standard connection
- `conditional` - Requires condition (use `conditionText`)
- `backward` - Return/loop back
- `combat` - Combat outcome

**Success Response (201):**
```json
{
  "success": true,
  "message": "Connection created successfully",
  "data": {
    "id": "conn-uuid",
    "projectId": "project-uuid",
    "fromNodeId": "node1-uuid",
    "toNodeId": "node2-uuid",
    "connectionType": "normal",
    "choiceText": "Continue to next scene",
    "conditionText": null,
    "fromNode": {
      "id": "node1-uuid",
      "nodeNumber": 1,
      "title": "Start"
    },
    "toNode": {
      "id": "node2-uuid",
      "nodeNumber": 2,
      "title": "Next"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get Single Connection

**Endpoint:** `GET /api/connections/:id`

**Requires:** Authentication (for private projects)

**Request:**
```bash
curl http://localhost:3000/api/connections/CONN_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3. List Connections

**Endpoint:** `GET /api/connections?projectId=...`

**Requires:** Authentication + Project Access

**Request:**
```bash
# All connections in project
curl "http://localhost:3000/api/connections?projectId=PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# From specific node
curl "http://localhost:3000/api/connections?projectId=PROJECT_ID&fromNodeId=NODE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# To specific node
curl "http://localhost:3000/api/connections?projectId=PROJECT_ID&toNodeId=NODE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by type
curl "http://localhost:3000/api/connections?projectId=PROJECT_ID&connectionType=conditional" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "conn-uuid",
      "connectionType": "normal",
      "fromNode": {...},
      "toNode": {...}
    }
  ]
}
```

### 4. Get Node Connections

**Endpoint:** `GET /api/connections/node/:nodeId`

**Requires:** Authentication (for private projects)

**Request:**
```bash
curl http://localhost:3000/api/connections/node/NODE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "outgoing": [
      {
        "id": "conn1-uuid",
        "toNode": {"nodeNumber": 2, "title": "Next"}
      }
    ],
    "incoming": [
      {
        "id": "conn2-uuid",
        "fromNode": {"nodeNumber": 0, "title": "Previous"}
      }
    ]
  }
}
```

### 5. Update Connection

**Endpoint:** `PUT /api/connections/:id`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X PUT http://localhost:3000/api/connections/CONN_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "choiceText": "Updated choice text",
    "conditionText": "webMarks >= 5"
  }'
```

### 6. Delete Connection

**Endpoint:** `DELETE /api/connections/:id`

**Requires:** Authentication + Project Access

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/connections/CONN_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Complete Workflow Example

```bash
# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@gamebook.dev","password":"demo123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

# 2. Get a project
PROJECT_ID="your-project-uuid"

# 3. Create start node
START_NODE=$(curl -s -X POST http://localhost:3000/api/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"nodeNumber\": 1,
    \"nodeType\": \"start\",
    \"title\": \"Beginning\",
    \"content\": \"You wake up in a mysterious room...\",
    \"positionX\": 100,
    \"positionY\": 100
  }")

START_NODE_ID=$(echo $START_NODE | jq -r '.data.id')

# 4. Create choice node
CHOICE_NODE=$(curl -s -X POST http://localhost:3000/api/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"nodeNumber\": 2,
    \"nodeType\": \"choice\",
    \"title\": \"The Door\",
    \"content\": \"You see two doors: red and blue.\",
    \"positionX\": 400,
    \"positionY\": 100
  }")

CHOICE_NODE_ID=$(echo $CHOICE_NODE | jq -r '.data.id')

# 5. Create connection
curl -X POST http://localhost:3000/api/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"fromNodeId\": \"$START_NODE_ID\",
    \"toNodeId\": \"$CHOICE_NODE_ID\",
    \"connectionType\": \"normal\",
    \"choiceText\": \"Continue forward\"
  }" | jq

# 6. List all nodes
curl "http://localhost:3000/api/nodes?projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 7. List all connections
curl "http://localhost:3000/api/connections?projectId=$PROJECT_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 8. Update node position (drag-and-drop simulation)
curl -X PATCH http://localhost:3000/api/nodes/batch/positions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"projectId\": \"$PROJECT_ID\",
    \"updates\": [
      {\"id\": \"$START_NODE_ID\", \"positionX\": 150, \"positionY\": 120}
    ]
  }" | jq
```

---

## Error Scenarios

### Node Number Conflict
```bash
# Create node with existing number
curl -X POST http://localhost:3000/api/nodes \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"...","nodeNumber":1,...}' | jq
```

**Response (409):**
```json
{
  "success": false,
  "error": "ConflictError",
  "message": "Node number 1 already exists in this project"
}
```

### Self-Connection
```bash
# Try to connect node to itself
curl -X POST http://localhost:3000/api/connections \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromNodeId":"same-uuid","toNodeId":"same-uuid",...}' | jq
```

**Response (400):**
```json
{
  "success": false,
  "error": "BadRequestError",
  "message": "Cannot connect a node to itself"
}
```

### Access Denied
```bash
# Try to modify another user's project
curl -X PUT http://localhost:3000/api/nodes/NODE_ID \
  -H "Authorization: Bearer $WRONG_TOKEN" \
  -d '{"title":"Hacked"}' | jq
```

**Response (403):**
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "You do not have access to this project"
}
```

---

## Validation Rules

### Node Validation
- **nodeNumber**: Integer ≥ 1, unique per project
- **nodeType**: One of the valid types
- **title**: Max 255 characters
- **content**: Max 10,000 characters
- **positionX/Y**: Required numbers
- **properties**: Optional JSON object

### Connection Validation
- **fromNodeId**: Valid node UUID
- **toNodeId**: Valid node UUID, different from fromNodeId
- **connectionType**: One of: normal, conditional, backward, combat
- **choiceText**: Max 500 characters
- **conditionText**: Max 1000 characters

---

## Testing Checklist

**Nodes:**
- [ ] Create node with all types
- [ ] Create node with invalid type (should fail)
- [ ] Create node with duplicate number (should fail)
- [ ] Get single node
- [ ] List nodes with filters
- [ ] Update node
- [ ] Delete node
- [ ] Batch update positions
- [ ] Add story segment
- [ ] Update segment
- [ ] Delete segment
- [ ] Try accessing another user's nodes (should fail)

**Connections:**
- [ ] Create connection with all types
- [ ] Create self-connection (should fail)
- [ ] Create duplicate connection (should fail)
- [ ] Get single connection
- [ ] List connections with filters
- [ ] Get node connections (incoming/outgoing)
- [ ] Update connection
- [ ] Delete connection
- [ ] Verify connections deleted when node deleted

---

## Next Steps

- Create more nodes to build story structure
- Connect nodes to create branching paths
- Add story segments for multi-part nodes
- Test with frontend drag-and-drop
- Add progress systems (web marks, inventory)
