# Gamebook Creator - Backend Architecture Plan

## Executive Summary

Based on analysis of your interactive gamebook creator, I recommend a **Node.js + Express + PostgreSQL** backend with the following architecture:

- **Primary Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for collaborative editing
- **File Storage**: AWS S3 or Cloudinary
- **Export Services**: Microservice architecture (Node.js + Python)
- **Authentication**: JWT + OAuth2 (Google, GitHub)
- **API Style**: REST + GraphQL hybrid

## Why This Stack?

### Node.js + Express
✅ Same language as frontend (JavaScript/TypeScript)
✅ Excellent JSON handling for complex node structures
✅ Rich ecosystem for PDF generation, file processing
✅ Easy WebSocket integration via Socket.io
✅ Great for real-time collaborative features
✅ Fast development cycle

### PostgreSQL
✅ Complex relational data (nodes, connections, users, projects)
✅ JSONB support for flexible node properties
✅ Strong ACID compliance for data integrity
✅ Excellent full-text search for project discovery
✅ Proven scalability

### Alternative Considerations

**Python + FastAPI** (Export Microservice)
- Better for PDF/document generation
- Excellent data processing libraries
- Can be used alongside Node.js for export features

**Firebase/Supabase** (Rapid MVP)
- Fastest time-to-market
- Built-in auth and real-time
- Limited for complex export logic
- Higher costs at scale

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│              Interactive Gamebook Editor                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    API Gateway (Express)                 │
│              JWT Auth, Rate Limiting, CORS               │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Projects   │  │  Real-time   │  │   Export     │
│   Service    │  │   Service    │  │   Service    │
│  (Node.js)   │  │ (Socket.io)  │  │  (Python)    │
└──────────────┘  └──────────────┘  └──────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│  PostgreSQL  │                    │  Job Queue   │
│   Database   │                    │   (Bull)     │
└──────────────┘                    └──────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│   S3/CDN     │                    │    Redis     │
│ File Storage │                    │    Cache     │
└──────────────┘                    └──────────────┘
```

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW()
);

-- Nodes (Story Nodes)
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    node_number INTEGER NOT NULL,
    node_type VARCHAR(50) NOT NULL, -- start, story, choice, combat, etc.
    title VARCHAR(255),
    content TEXT,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    properties JSONB, -- Flexible storage for node-specific properties
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, node_number)
);

-- Story Segments (Multiple stories per action node)
CREATE TABLE story_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    segment_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(node_id, segment_number)
);

-- Connections
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL, -- normal, conditional, backward, combat
    condition_text TEXT,
    choice_text TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, connection_type)
);

-- Progress Systems
CREATE TABLE progress_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    system_type VARCHAR(50) NOT NULL, -- web, skills, inventory, relationships
    system_name VARCHAR(100) NOT NULL,
    configuration JSONB NOT NULL, -- Max marks, skill names, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Collaborators (for shared projects)
CREATE TABLE project_collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- owner, editor, viewer
    invited_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Export History
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    export_format VARCHAR(50) NOT NULL, -- ios, android, web, pdf, json
    status VARCHAR(50) NOT NULL, -- pending, processing, completed, failed
    file_url VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_nodes_project ON nodes(project_id);
CREATE INDEX idx_connections_project ON connections(project_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_nodes_type ON nodes(node_type);
CREATE INDEX idx_exports_status ON exports(status);
```

## API Design

### REST API Endpoints

#### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login with email/password
POST   /api/auth/oauth/google      - OAuth login
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/logout            - Logout user
```

#### Projects
```
GET    /api/projects               - List user's projects
POST   /api/projects               - Create new project
GET    /api/projects/:id           - Get project details
PUT    /api/projects/:id           - Update project metadata
DELETE /api/projects/:id           - Delete project
POST   /api/projects/:id/duplicate - Duplicate project
GET    /api/projects/public        - Browse public projects
```

#### Nodes
```
GET    /api/projects/:id/nodes     - Get all nodes in project
POST   /api/projects/:id/nodes     - Create new node
PUT    /api/nodes/:id              - Update node
DELETE /api/nodes/:id              - Delete node
POST   /api/nodes/:id/segments     - Add story segment
PUT    /api/nodes/:id/segments/:num - Update segment
DELETE /api/nodes/:id/segments/:num - Delete segment
```

#### Connections
```
GET    /api/projects/:id/connections - Get all connections
POST   /api/connections              - Create connection
PUT    /api/connections/:id          - Update connection
DELETE /api/connections/:id          - Delete connection
```

#### Progress Systems
```
GET    /api/projects/:id/systems   - Get all progress systems
POST   /api/projects/:id/systems   - Add progress system
PUT    /api/systems/:id            - Update system
DELETE /api/systems/:id            - Delete system
```

#### Export
```
POST   /api/projects/:id/export    - Request export
GET    /api/exports/:id/status     - Check export status
GET    /api/exports/:id/download   - Download exported file
```

#### Collaboration
```
POST   /api/projects/:id/invite    - Invite collaborator
GET    /api/projects/:id/collaborators - List collaborators
DELETE /api/projects/:id/collaborators/:userId - Remove collaborator
```

### GraphQL Schema (Optional - for complex queries)

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  projects: [Project!]!
  createdAt: DateTime!
}

type Project {
  id: ID!
  title: String!
  description: String
  thumbnailUrl: String
  isPublic: Boolean!
  owner: User!
  nodes: [Node!]!
  connections: [Connection!]!
  progressSystems: [ProgressSystem!]!
  collaborators: [Collaborator!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Node {
  id: ID!
  nodeNumber: Int!
  nodeType: NodeType!
  title: String
  content: String
  positionX: Float!
  positionY: Float!
  properties: JSON
  segments: [StorySegment!]
  connectionsFrom: [Connection!]!
  connectionsTo: [Connection!]!
}

type Connection {
  id: ID!
  fromNode: Node!
  toNode: Node!
  connectionType: ConnectionType!
  conditionText: String
  choiceText: String
}

enum NodeType {
  START
  STORY
  CHOICE
  CONDITIONAL
  COMBAT
  WEB_MARK
  SUCCESS
  GAME_OVER
  INVENTORY
}

enum ConnectionType {
  NORMAL
  CONDITIONAL
  BACKWARD
  COMBAT
}

type Query {
  me: User
  project(id: ID!): Project
  projects(limit: Int, offset: Int): [Project!]!
  publicProjects(limit: Int, offset: Int): [Project!]!
}

type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!

  createNode(projectId: ID!, input: CreateNodeInput!): Node!
  updateNode(id: ID!, input: UpdateNodeInput!): Node!
  deleteNode(id: ID!): Boolean!

  createConnection(input: CreateConnectionInput!): Connection!
  deleteConnection(id: ID!): Boolean!
}

type Subscription {
  projectUpdated(projectId: ID!): ProjectUpdate!
  nodeAdded(projectId: ID!): Node!
  nodeUpdated(projectId: ID!): Node!
  connectionAdded(projectId: ID!): Connection!
}
```

## Real-time Collaboration (Socket.io)

### Events

```javascript
// Client → Server
socket.emit('project:join', { projectId })
socket.emit('node:create', { projectId, nodeData })
socket.emit('node:update', { nodeId, changes })
socket.emit('node:delete', { nodeId })
socket.emit('connection:create', { connectionData })
socket.emit('connection:delete', { connectionId })
socket.emit('cursor:move', { projectId, x, y })

// Server → Client
socket.on('node:created', { node, userId, username })
socket.on('node:updated', { nodeId, changes, userId })
socket.on('node:deleted', { nodeId, userId })
socket.on('connection:created', { connection, userId })
socket.on('connection:deleted', { connectionId, userId })
socket.on('user:joined', { userId, username })
socket.on('user:left', { userId })
socket.on('cursor:moved', { userId, username, x, y })
```

## Export Service Architecture

### Export Formats & Technologies

```
┌─────────────────────────────────────────────────┐
│             Export Service (Python)              │
├─────────────────────────────────────────────────┤
│                                                  │
│  iOS Export        → Swift code generation       │
│                    → Xcode project templates     │
│                                                  │
│  Android Export    → Kotlin code generation      │
│                    → Gradle project templates    │
│                                                  │
│  Web Export        → HTML/JS/CSS generation      │
│                    → PWA configuration           │
│                                                  │
│  PDF Export        → ReportLab / WeasyPrint      │
│                    → Page layout engine          │
│                                                  │
│  JSON Export       → Structured data export      │
│                    → Schema validation           │
│                                                  │
│  Inform7 Export    → Interactive fiction code    │
│                    → Template-based generation   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Export Job Queue (Bull + Redis)

```javascript
// Job Queue for async processing
const exportQueue = new Bull('gamebook-exports', {
  redis: process.env.REDIS_URL
});

exportQueue.process(async (job) => {
  const { projectId, format, userId } = job.data;

  // Update status
  await updateExportStatus(job.id, 'processing');

  try {
    // Call export microservice
    const result = await exportService.generate(projectId, format);

    // Upload to S3
    const fileUrl = await uploadToS3(result.file, format);

    // Update status
    await updateExportStatus(job.id, 'completed', fileUrl);

    // Notify user
    await notifyUser(userId, 'Export completed', fileUrl);

  } catch (error) {
    await updateExportStatus(job.id, 'failed', null, error.message);
  }
});
```

## Technology Stack Details

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "typescript": "^5.3.0",
    "@types/express": "^4.17.21",

    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "pg": "^8.11.3",

    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",

    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0",

    "bull": "^4.11.5",
    "redis": "^4.6.11",

    "aws-sdk": "^2.1511.0",
    "multer": "^1.4.5-lts.1",
    "multer-s3": "^3.0.1",

    "pdfkit": "^0.14.0",
    "archiver": "^6.0.1",
    "ejs": "^3.1.9",

    "joi": "^17.11.0",
    "express-validator": "^7.0.1",

    "winston": "^3.11.0",
    "morgan": "^1.10.0",

    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",

    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "supertest": "^6.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}
```

### Python Export Service Dependencies

```python
# requirements.txt
fastapi==0.108.0
uvicorn==0.25.0
pydantic==2.5.3
reportlab==4.0.7
weasyprint==60.1
jinja2==3.1.2
celery==5.3.4
redis==5.0.1
boto3==1.34.10
pillow==10.1.0
```

## Security Considerations

### Authentication & Authorization
- JWT tokens with short expiration (15 min access, 7 day refresh)
- OAuth2 integration (Google, GitHub)
- Role-based access control (owner, editor, viewer)
- API key for public API access

### Data Protection
- Password hashing with bcrypt (12 rounds)
- SQL injection prevention via Prisma ORM
- XSS protection with helmet.js
- CSRF tokens for state-changing operations
- Rate limiting per user/IP

### File Upload Security
- Virus scanning for uploaded files
- File type validation
- Size limits (10MB per file, 100MB per project)
- Signed URLs for S3 access
- Content-Type validation

## Deployment Strategy

### Development
```
Docker Compose:
- Node.js API server
- PostgreSQL database
- Redis cache
- Python export service
```

### Production Options

**Option 1: AWS**
- EC2/ECS for Node.js API
- RDS PostgreSQL
- ElastiCache Redis
- S3 for file storage
- CloudFront CDN
- Lambda for export functions

**Option 2: Vercel + Supabase**
- Vercel for Next.js frontend + API routes
- Supabase for PostgreSQL + Auth + Storage
- Vercel Edge Functions for real-time

**Option 3: Railway/Render**
- Railway for easy deployment
- Managed PostgreSQL
- Redis addon
- Simple scaling

## Performance Optimization

### Caching Strategy
```
┌──────────────────────────────────────────┐
│         Caching Layers                    │
├──────────────────────────────────────────┤
│ Redis Cache:                             │
│  - User sessions (15 min TTL)            │
│  - Project metadata (5 min TTL)          │
│  - Public projects list (10 min TTL)     │
│  - Export job status (real-time)         │
│                                          │
│ CDN Cache:                               │
│  - Static assets (1 year)                │
│  - Exported files (1 month)              │
│  - Thumbnail images (1 week)             │
└──────────────────────────────────────────┘
```

### Database Optimization
- Connection pooling (max 20 connections)
- Query optimization with indexes
- Partial indexes for common queries
- Read replicas for public projects
- Materialized views for analytics

### API Optimization
- Compression middleware (gzip)
- Response pagination (default 50 items)
- Field selection (sparse fieldsets)
- Batch operations for bulk updates
- WebSocket for real-time instead of polling

## Monitoring & Logging

```javascript
// Logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Metrics to track
- API response times
- Database query performance
- Export job completion times
- Active WebSocket connections
- Error rates by endpoint
- User activity metrics
```

### Monitoring Tools
- **APM**: New Relic / DataDog
- **Logs**: CloudWatch / Papertrail
- **Errors**: Sentry
- **Uptime**: Pingdom / UptimeRobot

## Cost Estimation (Monthly)

### Starter Tier (0-1000 users)
- **Hosting**: $25 (Railway/Render)
- **Database**: $15 (PostgreSQL)
- **Redis**: $10 (Upstash)
- **Storage**: $5 (S3/Cloudinary)
- **Total**: ~$55/month

### Growth Tier (1000-10000 users)
- **Hosting**: $100 (AWS EC2)
- **Database**: $50 (RDS)
- **Redis**: $30 (ElastiCache)
- **Storage**: $30 (S3)
- **CDN**: $20 (CloudFront)
- **Total**: ~$230/month

### Scale Tier (10000+ users)
- **Hosting**: $500+ (ECS/K8s)
- **Database**: $200+ (Multi-AZ RDS)
- **Redis**: $100+
- **Storage**: $100+
- **Total**: ~$1000+/month

## Development Roadmap

### Phase 1: MVP (4-6 weeks)
✅ User authentication (email/password)
✅ Project CRUD operations
✅ Node creation and editing
✅ Connection system
✅ Basic JSON export
✅ File storage

### Phase 2: Core Features (6-8 weeks)
✅ OAuth integration
✅ Real-time collaboration
✅ Progress systems
✅ Web export (HTML)
✅ PDF export
✅ Public project sharing

### Phase 3: Advanced Features (8-12 weeks)
✅ iOS/Android export
✅ Inform7 export
✅ Project templates
✅ Version history
✅ Analytics dashboard
✅ API for third-party integrations

### Phase 4: Scale & Polish (Ongoing)
✅ Performance optimization
✅ Advanced caching
✅ Mobile apps
✅ Marketplace for templates
✅ Premium features

## Recommended Next Steps

1. **Set up development environment**
   - Initialize Node.js project with TypeScript
   - Configure PostgreSQL with Prisma
   - Set up Docker Compose for local dev

2. **Implement authentication**
   - JWT-based auth system
   - User registration/login
   - OAuth providers

3. **Build core API**
   - Project management endpoints
   - Node CRUD operations
   - Connection management

4. **Integrate with frontend**
   - Convert HTML to React components
   - Connect to REST API
   - Add state management (Redux/Zustand)

5. **Add real-time features**
   - Socket.io integration
   - Collaborative editing
   - Live cursors

6. **Implement export system**
   - Start with JSON export
   - Add PDF generation
   - Build web export

Would you like me to start implementing this architecture? I can:
1. Create the initial project structure
2. Set up the database schema with Prisma
3. Build the authentication system
4. Create the core API endpoints
5. Set up Docker development environment

Let me know which part you'd like to tackle first!
