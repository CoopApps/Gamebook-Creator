# Gamebook Creator - Backend API

Backend API for the Interactive Gamebook Creator application.

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis
- **Authentication**: JWT + Passport.js
- **Real-time**: Socket.io (coming soon)

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis with Docker
cd ..
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data (optional)
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # Prisma client
│   │   └── redis.ts     # Redis client
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   │   ├── errors.ts    # Custom error classes
│   │   └── logger.ts    # Winston logger
│   ├── validators/      # Request validation
│   ├── websocket/       # Socket.io handlers
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Seed data
└── tests/               # Test files
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `CLIENT_URL` - Frontend URL for CORS

## Database Schema

The database includes the following main tables:
- `users` - User accounts
- `projects` - Gamebook projects
- `nodes` - Story nodes
- `connections` - Links between nodes
- `progress_systems` - Game mechanics
- `exports` - Export history

See `prisma/schema.prisma` for complete schema.

## API Endpoints

### Health Check
```
GET /health - Service health status
```

### Authentication (coming soon)
```
POST /api/auth/register - Register new user
POST /api/auth/login    - Login
POST /api/auth/refresh  - Refresh token
```

### Projects (coming soon)
```
GET    /api/projects     - List projects
POST   /api/projects     - Create project
GET    /api/projects/:id - Get project
PUT    /api/projects/:id - Update project
DELETE /api/projects/:id - Delete project
```

See [BACKEND_ARCHITECTURE.md](../BACKEND_ARCHITECTURE.md) for complete API documentation.

## Development Tools

### Docker Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Start with dev tools (PgAdmin, Redis Commander)
docker-compose --profile dev-tools up -d
```

### Database GUI Tools

- **Prisma Studio**: `npm run prisma:studio` (http://localhost:5555)
- **PgAdmin**: http://localhost:5050 (admin@gamebook.dev / admin)
- **Redis Commander**: http://localhost:8081

### Database Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npm run db:reset

# Push schema changes without migration
npm run db:push

# View database in browser
npm run prisma:studio
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

See [IMPLEMENTATION_GUIDE.md](../IMPLEMENTATION_GUIDE.md) for deployment instructions.

## Demo Credentials

After seeding the database:
- Email: `demo@gamebook.dev`
- Password: `demo123`

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# View Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT License - See [LICENSE](../LICENSE) for details
