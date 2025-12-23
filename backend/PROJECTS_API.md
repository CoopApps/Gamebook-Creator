# Projects API - Testing Guide

Complete guide to testing the Projects API endpoints.

## Base URL

Local development: `http://localhost:3000/api/projects`

## Authentication

Most project endpoints require authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Endpoints

### 1. Create Project

**Endpoint:** `POST /api/projects`

**Requires:** Authentication

**Request:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Adventure Game",
    "description": "An exciting mystery adventure",
    "isPublic": false
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid-here",
    "userId": "user-uuid",
    "title": "My Adventure Game",
    "description": "An exciting mystery adventure",
    "thumbnailUrl": null,
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastAccessed": "2024-01-01T00:00:00.000Z",
    "deletedAt": null,
    "owner": {
      "id": "user-uuid",
      "username": "testuser",
      "email": "test@example.com"
    },
    "_count": {
      "nodes": 0,
      "connections": 0,
      "progressSystems": 0,
      "collaborators": 0
    }
  }
}
```

### 2. Get Single Project

**Endpoint:** `GET /api/projects/:id`

**Requires:** Authentication (for private projects)

**Request:**
```bash
# Public project (no auth required)
curl http://localhost:3000/api/projects/PROJECT_ID

# Private project (requires auth)
curl http://localhost:3000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "userId": "user-uuid",
    "title": "My Adventure Game",
    "description": "An exciting mystery adventure",
    "thumbnailUrl": null,
    "isPublic": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lastAccessed": "2024-01-01T00:00:00.000Z",
    "owner": {
      "id": "user-uuid",
      "username": "testuser",
      "email": "test@example.com"
    },
    "nodes": [
      {
        "id": "node-uuid",
        "nodeNumber": 1,
        "nodeType": "start",
        "title": "The Beginning",
        "positionX": 100,
        "positionY": 100
      }
    ],
    "connections": [],
    "progressSystems": [],
    "collaborators": [],
    "_count": {
      "nodes": 1,
      "connections": 0,
      "progressSystems": 0,
      "exports": 0
    }
  }
}
```

### 3. List User's Projects

**Endpoint:** `GET /api/projects`

**Requires:** Authentication

**Request:**
```bash
# List user's projects
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With pagination
curl "http://localhost:3000/api/projects?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# With sorting
curl "http://localhost:3000/api/projects?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Query Parameters:**
- `limit` (number, default: 20, max: 100): Number of projects to return
- `offset` (number, default: 0): Number of projects to skip
- `sortBy` (string): `createdAt`, `updatedAt`, `lastAccessed`, `title`
- `sortOrder` (string): `asc`, `desc`
- `search` (string): Search in title and description

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-1-uuid",
      "title": "Adventure Game",
      "_count": {
        "nodes": 15,
        "connections": 12
      }
    },
    {
      "id": "project-2-uuid",
      "title": "Mystery Story",
      "_count": {
        "nodes": 8,
        "connections": 6
      }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 4. Get User's Projects Summary

**Endpoint:** `GET /api/projects/my/summary`

**Requires:** Authentication

**Request:**
```bash
curl http://localhost:3000/api/projects/my/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-uuid",
      "title": "My Adventure Game",
      "description": "An exciting mystery adventure",
      "thumbnailUrl": null,
      "isPublic": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lastAccessed": "2024-01-01T00:10:00.000Z",
      "nodeCount": 15,
      "connectionCount": 12
    }
  ]
}
```

### 5. Get Public Projects

**Endpoint:** `GET /api/projects/public`

**Requires:** None (Public)

**Request:**
```bash
# Get public projects
curl http://localhost:3000/api/projects/public

# With pagination
curl "http://localhost:3000/api/projects/public?limit=10&offset=0"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-uuid",
      "title": "Public Adventure",
      "isPublic": true,
      "owner": {
        "username": "creator"
      },
      "_count": {
        "nodes": 20,
        "connections": 18
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 6. Search Projects

**Endpoint:** `GET /api/projects/search`

**Requires:** None (Public - searches only public projects)

**Request:**
```bash
# Search projects
curl "http://localhost:3000/api/projects/search?q=mystery"

# With pagination
curl "http://localhost:3000/api/projects/search?q=adventure&limit=10&offset=0"
```

**Query Parameters:**
- `q` (string, required): Search query
- `limit` (number, default: 20, max: 100)
- `offset` (number, default: 0)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "project-uuid",
      "title": "Mystery Mansion",
      "description": "A spooky mystery adventure...",
      "_count": {
        "nodes": 25
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### 7. Update Project

**Endpoint:** `PUT /api/projects/:id`

**Requires:** Authentication (owner only)

**Request:**
```bash
curl -X PUT http://localhost:3000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description",
    "isPublic": true
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "project-uuid",
    "title": "Updated Title",
    "description": "Updated description",
    "isPublic": true,
    "updatedAt": "2024-01-01T00:10:00.000Z"
  }
}
```

### 8. Delete Project

**Endpoint:** `DELETE /api/projects/:id`

**Requires:** Authentication (owner only)

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/projects/PROJECT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Note:** Projects are soft-deleted (marked as deleted but not removed from database).

### 9. Duplicate Project

**Endpoint:** `POST /api/projects/:id/duplicate`

**Requires:** Authentication

**Request:**
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/duplicate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project duplicated successfully",
  "data": {
    "id": "new-project-uuid",
    "title": "My Adventure Game (Copy)",
    "isPublic": false,
    "nodes": [...],
    "connections": [...],
    "progressSystems": [...]
  }
}
```

**Note:**
- You can duplicate your own projects or any public project
- Duplicated project is always private (isPublic: false)
- All nodes, connections, and progress systems are copied
- Story segments are also duplicated

## Complete Testing Flow

### Setup: Get Access Token

```bash
# Login first
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@gamebook.dev",
    "password": "demo123"
  }')

# Extract token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

echo "Access Token: $ACCESS_TOKEN"
```

### Full Workflow

```bash
# 1. Create a new project
CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Adventure",
    "description": "A test project",
    "isPublic": false
  }')

echo $CREATE_RESPONSE | jq

# Extract project ID
PROJECT_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

echo "Project ID: $PROJECT_ID"

# 2. Get the project
curl http://localhost:3000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 3. List all your projects
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 4. Get projects summary
curl http://localhost:3000/api/projects/my/summary \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 5. Update the project
curl -X PUT http://localhost:3000/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Test Adventure",
    "isPublic": true
  }' | jq

# 6. Search for the project
curl "http://localhost:3000/api/projects/search?q=Adventure" | jq

# 7. Duplicate the project
DUPLICATE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/projects/$PROJECT_ID/duplicate \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo $DUPLICATE_RESPONSE | jq

DUPLICATE_ID=$(echo $DUPLICATE_RESPONSE | jq -r '.data.id')

# 8. Get public projects
curl http://localhost:3000/api/projects/public | jq

# 9. Delete the duplicate
curl -X DELETE http://localhost:3000/api/projects/$DUPLICATE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# 10. Verify deletion (should fail with 404)
curl http://localhost:3000/api/projects/$DUPLICATE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

### Test with Demo Project

```bash
# The seeded demo project "The Mysterious Mansion"
# Login as demo user first

# Get demo user's projects
curl http://localhost:3000/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Get the demo project (extract ID from above)
curl http://localhost:3000/api/projects/DEMO_PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Duplicate the demo project
curl -X POST http://localhost:3000/api/projects/DEMO_PROJECT_ID/duplicate \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Error Scenarios

### 1. Create Project Without Title

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

**Response (422):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 2. Get Private Project Without Auth

```bash
curl http://localhost:3000/api/projects/PRIVATE_PROJECT_ID | jq
```

**Response (403):**
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "You do not have access to this project"
}
```

### 3. Update Someone Else's Project

```bash
curl -X PUT http://localhost:3000/api/projects/OTHER_USER_PROJECT_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hacked"}' | jq
```

**Response (403):**
```json
{
  "success": false,
  "error": "ForbiddenError",
  "message": "You do not have permission to update this project"
}
```

### 4. Invalid Project ID

```bash
curl http://localhost:3000/api/projects/invalid-uuid \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

**Response (404):**
```json
{
  "success": false,
  "error": "NotFoundError",
  "message": "Project not found"
}
```

### 5. Search Without Query

```bash
curl "http://localhost:3000/api/projects/search" | jq
```

**Response (422):**
```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Validation failed",
  "errors": [
    {
      "field": "q",
      "message": "Search query (q) is required"
    }
  ]
}
```

## Validation Rules

### Create/Update Project

- **title** (required for create)
  - Min: 1 character
  - Max: 255 characters
  - Must not be empty

- **description** (optional)
  - Max: 5000 characters
  - Can be empty string

- **isPublic** (optional)
  - Boolean value
  - Default: false

- **thumbnailUrl** (optional for update)
  - Must be valid URI
  - Max: 500 characters
  - Can be null

### List/Search Parameters

- **limit**
  - Min: 1
  - Max: 100
  - Default: 20

- **offset**
  - Min: 0
  - Default: 0

- **sortBy**
  - Valid values: `createdAt`, `updatedAt`, `lastAccessed`, `title`
  - Default: `lastAccessed`

- **sortOrder**
  - Valid values: `asc`, `desc`
  - Default: `desc`

## Testing Checklist

- [ ] Create project with valid data
- [ ] Create project without authentication (should fail)
- [ ] Create project with missing title (should fail)
- [ ] Create project with title too long (should fail)
- [ ] Get own private project
- [ ] Get public project without auth
- [ ] Get someone else's private project (should fail)
- [ ] List own projects
- [ ] List projects with pagination
- [ ] List projects with sorting
- [ ] Get projects summary
- [ ] Get public projects
- [ ] Search projects
- [ ] Update own project
- [ ] Update with invalid data (should fail)
- [ ] Update someone else's project (should fail)
- [ ] Delete own project
- [ ] Delete someone else's project (should fail)
- [ ] Duplicate own project
- [ ] Duplicate public project
- [ ] Duplicate private project from another user (should fail)
- [ ] Verify duplicated project has all nodes/connections

## Common Status Codes

- `200 OK` - Request successful
- `201 Created` - Project created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Project not found
- `422 Unprocessable Entity` - Validation failed
- `500 Internal Server Error` - Server error

## Next Steps

- Test creating nodes within a project
- Test creating connections between nodes
- Test adding progress systems
- Test collaborator features (future)
- Test export functionality (future)
