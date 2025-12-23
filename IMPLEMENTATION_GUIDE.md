# Implementation Guide - Step-by-Step

## Quick Start Commands

```bash
# 1. Initialize the project
mkdir gamebook-backend && cd gamebook-backend
npm init -y
npm install express typescript @types/node @types/express ts-node nodemon
npm install prisma @prisma/client
npm install dotenv cors helmet express-rate-limit
npm install jsonwebtoken bcryptjs passport passport-jwt
npm install socket.io bull redis
npx tsc --init

# 2. Initialize Prisma
npx prisma init

# 3. Set up Docker Compose
docker-compose up -d

# 4. Run migrations
npx prisma migrate dev --name init

# 5. Start development server
npm run dev
```

## Project Structure

```
gamebook-backend/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── app.ts                   # Express app configuration
│   ├── server.ts                # HTTP server setup
│   │
│   ├── config/
│   │   ├── database.ts          # Prisma client singleton
│   │   ├── redis.ts             # Redis client
│   │   └── s3.ts                # AWS S3 configuration
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication
│   │   ├── validation.ts        # Request validation
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   └── logger.ts            # Request logging
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregation
│   │   ├── auth.routes.ts       # Authentication routes
│   │   ├── projects.routes.ts   # Project management
│   │   ├── nodes.routes.ts      # Node operations
│   │   ├── connections.routes.ts # Connection management
│   │   ├── systems.routes.ts    # Progress systems
│   │   └── export.routes.ts     # Export functionality
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── nodes.controller.ts
│   │   ├── connections.controller.ts
│   │   ├── systems.controller.ts
│   │   └── export.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── projects.service.ts
│   │   ├── nodes.service.ts
│   │   ├── connections.service.ts
│   │   ├── export.service.ts
│   │   └── notification.service.ts
│   │
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── project.model.ts
│   │   ├── node.model.ts
│   │   └── connection.model.ts
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── project.validator.ts
│   │   └── node.validator.ts
│   │
│   ├── utils/
│   │   ├── jwt.ts               # JWT utilities
│   │   ├── password.ts          # Password hashing
│   │   ├── errors.ts            # Custom error classes
│   │   └── response.ts          # Response formatting
│   │
│   ├── websocket/
│   │   ├── socket.ts            # Socket.io setup
│   │   ├── handlers/
│   │   │   ├── project.handler.ts
│   │   │   ├── node.handler.ts
│   │   │   └── collaboration.handler.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   │
│   ├── jobs/
│   │   ├── queue.ts             # Bull queue setup
│   │   ├── export.job.ts        # Export job processor
│   │   └── cleanup.job.ts       # Cleanup job
│   │
│   └── types/
│       ├── index.d.ts
│       ├── express.d.ts         # Express type extensions
│       └── node-types.ts        # Node type definitions
│
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Database seeding
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
│
├── scripts/
│   ├── migrate.sh
│   └── seed.sh
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Step 1: Environment Setup

### .env.example

```bash
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/gamebook_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=gamebook-files

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: gamebook-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gamebook_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: gamebook-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Optional: Redis Commander (GUI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: gamebook-redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

  # Optional: PgAdmin (GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: gamebook-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

## Step 2: Prisma Schema

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  username      String    @unique
  passwordHash  String?   @map("password_hash")
  oauthProvider String?   @map("oauth_provider")
  oauthId       String?   @map("oauth_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  projects      Project[] @relation("ProjectOwner")
  collaborations ProjectCollaborator[]
  exports       Export[]
  events        ProjectEvent[]

  @@map("users")
}

model Project {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  title           String
  description     String?
  thumbnailUrl    String?   @map("thumbnail_url")
  isPublic        Boolean   @default(false) @map("is_public")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastAccessed    DateTime  @default(now()) @map("last_accessed")
  deletedAt       DateTime? @map("deleted_at")

  owner           User      @relation("ProjectOwner", fields: [userId], references: [id], onDelete: Cascade)
  nodes           Node[]
  connections     Connection[]
  progressSystems ProgressSystem[]
  collaborators   ProjectCollaborator[]
  exports         Export[]
  events          ProjectEvent[]

  @@index([userId, lastAccessed(sort: Desc)])
  @@index([isPublic, createdAt(sort: Desc)])
  @@map("projects")
}

model Node {
  id          String    @id @default(uuid())
  projectId   String    @map("project_id")
  nodeNumber  Int       @map("node_number")
  nodeType    String    @map("node_type")
  title       String?
  content     String?   @db.Text
  positionX   Float     @map("position_x")
  positionY   Float     @map("position_y")
  properties  Json?
  version     Int       @default(1)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  project         Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  segments        StorySegment[]
  connectionsFrom Connection[]    @relation("ConnectionFrom")
  connectionsTo   Connection[]    @relation("ConnectionTo")

  @@unique([projectId, nodeNumber])
  @@index([projectId])
  @@index([nodeType])
  @@map("nodes")
}

model StorySegment {
  id            String   @id @default(uuid())
  nodeId        String   @map("node_id")
  segmentNumber Int      @map("segment_number")
  content       String   @db.Text
  createdAt     DateTime @default(now()) @map("created_at")

  node Node @relation(fields: [nodeId], references: [id], onDelete: Cascade)

  @@unique([nodeId, segmentNumber])
  @@index([nodeId])
  @@map("story_segments")
}

model Connection {
  id             String   @id @default(uuid())
  projectId      String   @map("project_id")
  fromNodeId     String   @map("from_node_id")
  toNodeId       String   @map("to_node_id")
  connectionType String   @map("connection_type")
  conditionText  String?  @map("condition_text") @db.Text
  choiceText     String?  @map("choice_text")
  createdAt      DateTime @default(now()) @map("created_at")

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fromNode Node    @relation("ConnectionFrom", fields: [fromNodeId], references: [id], onDelete: Cascade)
  toNode   Node    @relation("ConnectionTo", fields: [toNodeId], references: [id], onDelete: Cascade)

  @@unique([fromNodeId, toNodeId, connectionType])
  @@index([projectId])
  @@index([fromNodeId])
  @@index([toNodeId])
  @@map("connections")
}

model ProgressSystem {
  id            String   @id @default(uuid())
  projectId     String   @map("project_id")
  systemType    String   @map("system_type")
  systemName    String   @map("system_name")
  configuration Json
  createdAt     DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("progress_systems")
}

model ProjectCollaborator {
  id         String    @id @default(uuid())
  projectId  String    @map("project_id")
  userId     String    @map("user_id")
  role       String
  invitedAt  DateTime  @default(now()) @map("invited_at")
  acceptedAt DateTime? @map("accepted_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_collaborators")
}

model Export {
  id           String    @id @default(uuid())
  projectId    String    @map("project_id")
  userId       String    @map("user_id")
  exportFormat String    @map("export_format")
  status       String
  fileUrl      String?   @map("file_url")
  errorMessage String?   @map("error_message") @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  completedAt  DateTime? @map("completed_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status])
  @@index([projectId])
  @@map("exports")
}

model ProjectEvent {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  userId    String   @map("user_id")
  eventType String   @map("event_type")
  eventData Json     @map("event_data")
  createdAt DateTime @default(now()) @map("created_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt(sort: Desc)])
  @@map("project_events")
}
```

## Step 3: Core Application Setup

### src/index.ts

```typescript
import dotenv from 'dotenv';
dotenv.config();

import { app } from './app';
import { initializeWebSocket } from './websocket/socket';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
    });

    // Initialize WebSocket
    initializeWebSocket(server);

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### src/app.ts

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { rateLimiter } from './middleware/rateLimiter';

export const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);
```

### src/config/database.ts

```typescript
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
```

### src/config/redis.ts

```typescript
import { createClient } from 'redis';
import logger from '../utils/logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

export async function connectRedis() {
  await redisClient.connect();
}

export default redisClient;
```

## Step 4: Authentication Implementation

### src/middleware/auth.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as any;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }

  next();
};
```

### src/controllers/auth.controller.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, username, password } = req.body;

      const result = await this.authService.register(email, username, password);

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new BadRequestError('Refresh token required');
      }

      const result = await this.authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Implement token blacklisting if needed
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### src/services/auth.service.ts

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { UnauthorizedError, ConflictError } from '../utils/errors';

export class AuthService {
  async register(email: string, username: string, password: string) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      throw new ConflictError('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as any;

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      const tokens = this.generateTokens(user);

      return tokens;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  private generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }
}
```

## Step 5: Project Management

### src/controllers/projects.controller.ts

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectsService } from '../services/projects.service';

export class ProjectsController {
  private projectsService: ProjectsService;

  constructor() {
    this.projectsService = new ProjectsService();
  }

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { limit = 20, offset = 0 } = req.query;

      const projects = await this.projectsService.listUserProjects(
        userId,
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { title, description, isPublic } = req.body;

      const project = await this.projectsService.createProject(
        userId,
        title,
        description,
        isPublic
      );

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const project = await this.projectsService.getProject(id, userId);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      const project = await this.projectsService.updateProject(
        id,
        userId,
        updates
      );

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.projectsService.deleteProject(id, userId);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
```

## Next Steps

1. **Frontend Integration**: Convert the HTML to React/Vue
2. **Real-time Collaboration**: Implement Socket.io handlers
3. **Export Services**: Build export microservice
4. **Testing**: Write unit and integration tests
5. **Deployment**: Set up CI/CD pipeline

This is a production-ready architecture that will scale with your application!
