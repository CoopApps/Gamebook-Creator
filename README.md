# Gamebook Creator - Complete App with Backend

A professional visual editor for creating interactive gamebooks (Choose Your Own Adventure style) with a full-featured backend.

## 📚 Documentation

This repository contains comprehensive planning documents for building a production-ready gamebook creator:

1. **[BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md)** - Complete backend architecture
   - Technology stack recommendations
   - System architecture diagrams
   - API design (REST + GraphQL)
   - Real-time collaboration with Socket.io
   - Export service architecture
   - Deployment strategies
   - Cost estimates
   - Development roadmap

2. **[DATABASE_DESIGN.md](./DATABASE_DESIGN.md)** - Detailed database design
   - Complete schema with all tables
   - Entity relationships
   - JSONB structures for flexible data
   - Indexing strategies
   - Performance benchmarks
   - Query examples
   - Backup and recovery plans

3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation
   - Project structure
   - Environment setup
   - Prisma schema
   - Authentication implementation
   - Core services and controllers
   - Docker Compose configuration
   - Quick start commands

## 🎯 Features

### Frontend (Visual Editor)
- ✅ Drag-and-drop node-based editor
- ✅ Multiple node types (Story, Choice, Combat, Conditional, etc.)
- ✅ Visual connection system with different types
- ✅ Progress tracking systems (Web marks, Skills, Inventory, Relationships)
- ✅ Real-time collaborative editing
- ✅ Export to multiple formats (iOS, Android, Web, PDF, JSON, Inform7)

### Backend (Planned)
- ✅ User authentication (JWT + OAuth2)
- ✅ Project management with versioning
- ✅ Real-time collaboration via WebSocket
- ✅ Multi-format export system
- ✅ File storage and CDN integration
- ✅ RESTful API with GraphQL option
- ✅ Background job processing
- ✅ Analytics and reporting

## 🛠️ Recommended Tech Stack

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis
- **Real-time**: Socket.io
- **Jobs**: Bull (Redis-based queue)
- **File Storage**: AWS S3 / Cloudinary
- **Authentication**: JWT + Passport.js

### Frontend (Future)
- **Framework**: React 18+ or Vue 3
- **State Management**: Zustand or Redux Toolkit
- **UI Library**: Tailwind CSS + Headless UI
- **Canvas**: React Flow or Konva.js
- **Forms**: React Hook Form + Zod
- **API Client**: Axios or TanStack Query

### Export Services
- **Node.js**: Web/JSON export
- **Python**: PDF generation (ReportLab)
- **Templates**: EJS or Handlebars for code generation

## 🚀 Quick Start (Backend)

```bash
# 1. Clone repository
git clone <repository-url>
cd gamebook-backend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start Docker services
docker-compose up -d

# 5. Run database migrations
npx prisma migrate dev

# 6. Seed database (optional)
npm run seed

# 7. Start development server
npm run dev
```

The API will be available at `http://localhost:3000/api`

## 📊 Database Schema

### Core Tables
- **users** - User accounts and authentication
- **projects** - Gamebook projects
- **nodes** - Story nodes with positions and properties
- **story_segments** - Multiple story segments per node
- **connections** - Links between nodes
- **progress_systems** - Web marks, skills, inventory, relationships
- **project_collaborators** - Multi-user editing
- **exports** - Export history and files
- **project_events** - Audit trail

See [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) for complete schema.

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login
POST   /api/auth/refresh       - Refresh JWT token
POST   /api/auth/oauth/google  - Google OAuth
```

### Projects
```
GET    /api/projects           - List user projects
POST   /api/projects           - Create project
GET    /api/projects/:id       - Get project details
PUT    /api/projects/:id       - Update project
DELETE /api/projects/:id       - Delete project
```

### Nodes & Connections
```
GET    /api/projects/:id/nodes       - Get all nodes
POST   /api/projects/:id/nodes       - Create node
PUT    /api/nodes/:id                - Update node
DELETE /api/nodes/:id                - Delete node
POST   /api/connections              - Create connection
DELETE /api/connections/:id          - Delete connection
```

### Export
```
POST   /api/projects/:id/export      - Request export
GET    /api/exports/:id/status       - Check export status
GET    /api/exports/:id/download     - Download file
```

See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for complete API documentation.

## 🌐 Real-time Collaboration

Socket.io events for multi-user editing:

```javascript
// Client → Server
socket.emit('project:join', { projectId })
socket.emit('node:create', { projectId, nodeData })
socket.emit('node:update', { nodeId, changes })

// Server → Client
socket.on('node:created', { node, userId, username })
socket.on('node:updated', { nodeId, changes, userId })
socket.on('cursor:moved', { userId, username, x, y })
```

## 📦 Export Formats

The system supports exporting gamebooks to:

1. **iOS App** - Swift code + Xcode project
2. **Android App** - Kotlin code + Gradle project
3. **Web App** - HTML/JS/CSS Progressive Web App
4. **PDF** - Print-ready gamebook format
5. **JSON** - Structured data export
6. **Inform 7** - Interactive fiction source code

## 🔐 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT access tokens (15 min expiration)
- Refresh tokens (7 day expiration)
- OAuth2 integration (Google, GitHub)
- Rate limiting per user/IP
- SQL injection prevention via Prisma ORM
- XSS protection with helmet.js
- CORS configuration
- File upload validation

## 📈 Performance Targets

- API response time: < 100ms (p95)
- Database queries: < 50ms (p95)
- Export generation: < 5s for 100 nodes
- Real-time latency: < 50ms
- Support: 10,000+ concurrent users
- Database: 1M+ projects

## 💰 Cost Estimation

### Starter (0-1K users)
- Hosting: $25/month
- Database: $15/month
- Redis: $10/month
- Storage: $5/month
- **Total: ~$55/month**

### Growth (1K-10K users)
- Hosting: $100/month
- Database: $50/month
- Redis: $30/month
- Storage + CDN: $50/month
- **Total: ~$230/month**

See [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) for scale tier pricing.

## 🗺️ Development Roadmap

### Phase 1: MVP (4-6 weeks)
- [ ] User authentication
- [ ] Project CRUD operations
- [ ] Node creation and editing
- [ ] Connection system
- [ ] Basic JSON export

### Phase 2: Core Features (6-8 weeks)
- [ ] Real-time collaboration
- [ ] Progress systems
- [ ] Web export (HTML)
- [ ] PDF export
- [ ] Public project sharing

### Phase 3: Advanced Features (8-12 weeks)
- [ ] iOS/Android export
- [ ] Inform7 export
- [ ] Project templates
- [ ] Version history
- [ ] Analytics dashboard

### Phase 4: Scale & Polish (Ongoing)
- [ ] Performance optimization
- [ ] Mobile apps
- [ ] Marketplace for templates
- [ ] Premium features

## 🧪 Testing Strategy

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 🚢 Deployment Options

### Option 1: AWS (Scalable)
- EC2/ECS for API
- RDS PostgreSQL
- ElastiCache Redis
- S3 + CloudFront

### Option 2: Vercel + Supabase (Fast MVP)
- Vercel for frontend + API routes
- Supabase for database + auth + storage

### Option 3: Railway/Render (Simple)
- All-in-one platform
- Managed services
- Easy scaling

## 📝 Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/gamebook_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=gamebook-files

# OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## 🤝 Contributing

This is currently a planning repository. Once implementation begins, contributions will be welcome following standard pull request workflows.

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For questions or issues:
1. Check the documentation files
2. Open an issue on GitHub
3. Contact the development team

## 🙏 Acknowledgments

Built with modern best practices and inspired by:
- Interactive fiction tools (Twine, Inform)
- Visual editors (Figma, Miro)
- Collaborative platforms (Notion, Google Docs)

---

**Status**: 📋 Planning Phase Complete - Ready for Implementation

**Next Steps**:
1. Initialize Node.js backend project
2. Set up Prisma with PostgreSQL
3. Implement authentication system
4. Build core API endpoints
5. Integrate with frontend

For detailed implementation steps, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
