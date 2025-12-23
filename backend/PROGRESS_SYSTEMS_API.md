# Progress Systems API Testing Guide

This guide covers testing the Progress Systems API, which handles game mechanics tracking including web marks, skills, inventory, and relationships.

## Progress System Types

The API supports four types of progress tracking systems:

1. **web_marks**: Boolean flags for tracking story progress
   - Examples: "has_key", "defeated_boss", "visited_castle"

2. **skills**: Numeric attributes with min/max ranges
   - Examples: strength, intelligence, luck, stealth

3. **inventory**: Item tracking with quantities and properties
   - Examples: weapons, potions, quest items

4. **relationships**: NPC relationship scores
   - Examples: merchant_reputation, guild_standing

## API Endpoints

### 1. Create Progress System
**POST /api/progress**

Creates a new progress tracking system for a project.

**Authentication Required:** Yes

**Request Body Examples:**

#### Web Marks System
```json
{
  "projectId": "your-project-id",
  "systemType": "web_marks",
  "systemName": "Story Progress Flags",
  "configuration": {
    "marks": [
      {
        "name": "has_key",
        "description": "Player found the mysterious key",
        "defaultValue": false
      },
      {
        "name": "defeated_boss",
        "description": "Defeated the final boss",
        "defaultValue": false
      },
      {
        "name": "visited_castle",
        "description": "Player has visited the castle",
        "defaultValue": false
      }
    ]
  }
}
```

#### Skills System
```json
{
  "projectId": "your-project-id",
  "systemType": "skills",
  "systemName": "Character Attributes",
  "configuration": {
    "skills": [
      {
        "name": "strength",
        "description": "Physical power",
        "minValue": 1,
        "maxValue": 10,
        "defaultValue": 5
      },
      {
        "name": "intelligence",
        "description": "Mental acuity",
        "minValue": 1,
        "maxValue": 10,
        "defaultValue": 5
      },
      {
        "name": "luck",
        "description": "Fortune and chance",
        "minValue": 1,
        "maxValue": 10,
        "defaultValue": 5
      }
    ]
  }
}
```

#### Inventory System
```json
{
  "projectId": "your-project-id",
  "systemType": "inventory",
  "systemName": "Player Inventory",
  "configuration": {
    "maxSlots": 20,
    "items": [
      {
        "itemId": "sword_basic",
        "name": "Basic Sword",
        "description": "A simple iron sword",
        "maxStack": 1,
        "properties": {
          "damage": 10,
          "durability": 100
        }
      },
      {
        "itemId": "potion_health",
        "name": "Health Potion",
        "description": "Restores 50 HP",
        "maxStack": 10,
        "properties": {
          "healing": 50
        }
      },
      {
        "itemId": "gold",
        "name": "Gold Coins",
        "description": "Currency",
        "maxStack": null,
        "properties": {}
      }
    ]
  }
}
```

#### Relationships System
```json
{
  "projectId": "your-project-id",
  "systemType": "relationships",
  "systemName": "NPC Relationships",
  "configuration": {
    "relationships": [
      {
        "npcId": "merchant_guild",
        "name": "Merchant Guild",
        "description": "Standing with the Merchant Guild",
        "minValue": -100,
        "maxValue": 100,
        "defaultValue": 0
      },
      {
        "npcId": "thieves_guild",
        "name": "Thieves Guild",
        "description": "Reputation among thieves",
        "minValue": -100,
        "maxValue": 100,
        "defaultValue": -10
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "projectId": "your-project-id",
    "systemType": "skills",
    "systemName": "Character Attributes",
    "configuration": {
      "skills": [
        {
          "name": "strength",
          "description": "Physical power",
          "minValue": 1,
          "maxValue": 10,
          "defaultValue": 5
        }
      ]
    }
  }'
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "system-id",
    "projectId": "your-project-id",
    "systemType": "skills",
    "systemName": "Character Attributes",
    "configuration": { ... },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Validation:**
- System name must be unique within the project
- Configuration must match the schema for the system type
- Each system type has specific validation rules:
  - **web_marks**: At least 1 mark required
  - **skills**: At least 1 skill, minValue < maxValue, defaultValue in range
  - **inventory**: At least 1 item defined
  - **relationships**: At least 1 relationship, minValue < maxValue, defaultValue in range

---

### 2. Get Progress System
**GET /api/progress/:id**

Retrieves a single progress system by ID.

**Authentication:** Optional (required for private projects)

**cURL Example:**
```bash
curl http://localhost:3000/api/progress/system-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "system-id",
    "projectId": "project-id",
    "systemType": "skills",
    "systemName": "Character Attributes",
    "configuration": {
      "skills": [...]
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 3. List Progress Systems
**GET /api/progress?projectId={projectId}&systemType={type}**

Lists all progress systems for a project, optionally filtered by type.

**Authentication Required:** Yes

**Query Parameters:**
- `projectId` (required): UUID of the project
- `systemType` (optional): Filter by system type (web_marks, skills, inventory, relationships)

**cURL Example:**
```bash
# Get all progress systems for a project
curl "http://localhost:3000/api/progress?projectId=your-project-id" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get only skills systems
curl "http://localhost:3000/api/progress?projectId=your-project-id&systemType=skills" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "system-1",
      "projectId": "project-id",
      "systemType": "web_marks",
      "systemName": "Story Progress",
      "configuration": { ... },
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "system-2",
      "projectId": "project-id",
      "systemType": "skills",
      "systemName": "Character Attributes",
      "configuration": { ... },
      "createdAt": "2024-01-15T11:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 2
}
```

---

### 4. Get Grouped Progress Systems
**GET /api/progress/project/:projectId/grouped**

Gets all progress systems for a project, grouped by system type.

**Authentication Required:** Yes

**cURL Example:**
```bash
curl http://localhost:3000/api/progress/project/your-project-id/grouped \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "web_marks": [
      {
        "id": "system-1",
        "systemName": "Story Progress",
        "configuration": { ... }
      }
    ],
    "skills": [
      {
        "id": "system-2",
        "systemName": "Character Attributes",
        "configuration": { ... }
      }
    ],
    "inventory": [
      {
        "id": "system-3",
        "systemName": "Player Inventory",
        "configuration": { ... }
      }
    ],
    "relationships": []
  }
}
```

---

### 5. Update Progress System
**PUT /api/progress/:id**

Updates a progress system's name or configuration.

**Authentication Required:** Yes (owner only)

**Request Body:**
```json
{
  "systemName": "Updated System Name",
  "configuration": {
    "skills": [
      {
        "name": "strength",
        "description": "Updated description",
        "minValue": 1,
        "maxValue": 20,
        "defaultValue": 10
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/progress/system-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "systemName": "Updated Attributes"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "system-id",
    "systemName": "Updated Attributes",
    "configuration": { ... },
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

**Validation:**
- At least one field must be provided
- If updating name, it must be unique within the project
- Configuration must still match the system type schema

---

### 6. Delete Progress System
**DELETE /api/progress/:id**

Deletes a progress system.

**Authentication Required:** Yes (owner only)

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/progress/system-id \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Progress system deleted successfully"
}
```

---

## Complete Workflow Example

Here's a complete example of setting up progress systems for a gamebook:

```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# 2. Create a project
PROJECT=$(curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Fantasy Adventure","description":"An epic quest"}' \
  | jq -r '.data.id')

# 3. Create web marks system
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"projectId\": \"$PROJECT\",
    \"systemType\": \"web_marks\",
    \"systemName\": \"Story Flags\",
    \"configuration\": {
      \"marks\": [
        {
          \"name\": \"has_sword\",
          \"description\": \"Found the legendary sword\",
          \"defaultValue\": false
        }
      ]
    }
  }"

# 4. Create skills system
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"projectId\": \"$PROJECT\",
    \"systemType\": \"skills\",
    \"systemName\": \"Hero Stats\",
    \"configuration\": {
      \"skills\": [
        {
          \"name\": \"strength\",
          \"description\": \"Physical power\",
          \"minValue\": 1,
          \"maxValue\": 10,
          \"defaultValue\": 5
        },
        {
          \"name\": \"magic\",
          \"description\": \"Magical ability\",
          \"minValue\": 1,
          \"maxValue\": 10,
          \"defaultValue\": 3
        }
      ]
    }
  }"

# 5. Create inventory system
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"projectId\": \"$PROJECT\",
    \"systemType\": \"inventory\",
    \"systemName\": \"Player Inventory\",
    \"configuration\": {
      \"maxSlots\": 15,
      \"items\": [
        {
          \"itemId\": \"health_potion\",
          \"name\": \"Health Potion\",
          \"maxStack\": 5,
          \"properties\": {\"healing\": 50}
        }
      ]
    }
  }"

# 6. Get all systems grouped by type
curl "http://localhost:3000/api/progress/project/$PROJECT/grouped" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Scenarios

### Duplicate System Name
```bash
# Create first system
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "project-id",
    "systemType": "skills",
    "systemName": "My System",
    "configuration": {...}
  }'

# Try to create another with same name
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "project-id",
    "systemType": "web_marks",
    "systemName": "My System",
    "configuration": {...}
  }'
```

**Response (400):**
```json
{
  "success": false,
  "error": "Progress system with name \"My System\" already exists for this project"
}
```

### Invalid Configuration
```bash
# Skills with invalid range (default outside min/max)
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "projectId": "project-id",
    "systemType": "skills",
    "systemName": "Bad Skills",
    "configuration": {
      "skills": [{
        "name": "strength",
        "minValue": 5,
        "maxValue": 10,
        "defaultValue": 15
      }]
    }
  }'
```

### Access Denied
```bash
# Try to update another user's progress system
curl -X PUT http://localhost:3000/api/progress/other-user-system \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"systemName": "Hacked"}'
```

**Response (403):**
```json
{
  "success": false,
  "error": "Only the project owner can update progress systems"
}
```

---

## Validation Rules

### Web Marks
- Must have at least 1 mark
- Mark names max 100 characters
- Description max 500 characters
- Default value must be boolean

### Skills
- Must have at least 1 skill
- Skill names max 100 characters
- minValue must be less than maxValue
- defaultValue must be between min and max (inclusive)
- All values must be integers

### Inventory
- Must have at least 1 item
- itemId max 100 characters
- name max 200 characters
- description max 1000 characters
- maxSlots must be positive integer or null
- maxStack must be positive integer or null

### Relationships
- Must have at least 1 relationship
- npcId max 100 characters
- name max 200 characters
- minValue must be less than maxValue
- defaultValue must be between min and max (inclusive)
- All values must be integers

---

## Testing Checklist

- [ ] Create web marks system with valid configuration
- [ ] Create skills system with multiple skills
- [ ] Create inventory system with various item types
- [ ] Create relationships system with NPC tracking
- [ ] Prevent duplicate system names in same project
- [ ] Update system name
- [ ] Update system configuration
- [ ] Delete progress system
- [ ] List all systems for a project
- [ ] Filter systems by type
- [ ] Get grouped systems
- [ ] Verify access control (owner only for updates/deletes)
- [ ] Verify validation errors for invalid configurations
- [ ] Test with public and private projects
- [ ] Test configuration validation for each system type

---

## Integration with Nodes

Progress systems define the **structure** of game mechanics. Individual nodes can reference these systems in their properties:

```json
{
  "nodeType": "conditional",
  "properties": {
    "condition": {
      "type": "skill_check",
      "skill": "strength",
      "requiredValue": 7
    }
  }
}
```

Or:

```json
{
  "nodeType": "story",
  "properties": {
    "effects": {
      "setWebMark": "defeated_boss",
      "modifySkill": {
        "name": "strength",
        "change": 1
      },
      "addItem": {
        "itemId": "legendary_sword",
        "quantity": 1
      }
    }
  }
}
```

The Progress Systems API defines what's **possible** in the game, while node properties define **when** and **how** those mechanics are used in the story.
