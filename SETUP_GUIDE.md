# Environment Setup Guide

Complete guide to setting up the Gamebook Creator development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js 18+** and npm
   ```bash
   # Download from https://nodejs.org/
   # Or use nvm:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

2. **Docker Desktop**
   ```bash
   # Download from https://www.docker.com/products/docker-desktop
   # Verify installation:
   docker --version
   docker compose version
   ```

3. **Git**
   ```bash
   # Download from https://git-scm.com/
   # Verify:
   git --version
   ```

### Optional (Recommended)

- **VS Code** with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Docker
  - GitLens

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd Gamebook-Creator
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all dependencies including:
- Express, TypeScript, Prisma
- Authentication libraries (JWT, bcrypt)
- Redis and Bull for job queues
- Winston for logging
- And more...

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Open .env and update values if needed
# The defaults work for local development
```

**Important .env variables:**
- `DATABASE_URL` - Already configured for Docker PostgreSQL
- `REDIS_URL` - Already configured for Docker Redis
- `JWT_SECRET` - Change in production!
- `CLIENT_URL` - Frontend URL (default: http://localhost:5173)

### 4. Start Docker Services

```bash
# From the root directory (Gamebook-Creator/)
cd ..
docker compose up -d

# Verify services are running
docker compose ps

# You should see:
# - gamebook-postgres (port 5432)
# - gamebook-redis (port 6379)
```

**Start with development tools:**
```bash
# This also starts PgAdmin and Redis Commander
docker compose --profile dev-tools up -d
```

Access development tools:
- **PgAdmin**: http://localhost:5050
  - Email: `admin@gamebook.dev`
  - Password: `admin`
- **Redis Commander**: http://localhost:8081

### 5. Setup Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# You should see:
# ✔ Generated Prisma Client
# ✔ Applied migrations
```

### 6. Seed Database (Optional)

```bash
npm run prisma:seed

# This creates:
# - Demo user (demo@gamebook.dev / demo123)
# - Sample project "The Mysterious Mansion"
# - Sample nodes and connections
```

### 7. Start Development Server

```bash
npm run dev

# You should see:
# 🚀 Starting Gamebook API Server...
# ✅ Database connected successfully
# ✅ Redis connected and ready
# ✅ Server running successfully!
# 🔗 API URL: http://localhost:3000
```

### 8. Verify Installation

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}

# API info
curl http://localhost:3000/

# Should return API information
```

## Development Workflow

### Starting Services

```bash
# Terminal 1: Start Docker services (if not running)
docker compose up -d

# Terminal 2: Start backend API
cd backend
npm run dev

# The API will auto-reload on file changes
```

### Viewing Logs

```bash
# Backend logs
# (visible in the terminal running npm run dev)

# Docker logs
docker compose logs -f postgres
docker compose logs -f redis
```

### Database Management

```bash
# Open Prisma Studio (visual database editor)
npm run prisma:studio
# Opens at http://localhost:5555

# Create a new migration
npx prisma migrate dev --name add_new_feature

# Reset database (WARNING: deletes all data)
npm run db:reset

# Push schema changes without creating migration (dev only)
npm run db:push
```

### Stopping Services

```bash
# Stop backend (Ctrl+C in terminal)

# Stop Docker services
docker compose down

# Stop and remove all data
docker compose down -v
```

## Troubleshooting

### Port Already in Use

**Error**: `Port 3000 is already in use`

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

**Error**: `Port 5432 is already in use`

You might have PostgreSQL installed locally. Either:
1. Stop local PostgreSQL
2. Change port in docker-compose.yml

### Database Connection Failed

**Error**: `Can't reach database server`

```bash
# Check if PostgreSQL is running
docker compose ps

# If not running:
docker compose up -d postgres

# Check logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker compose ps

# Start Redis
docker compose up -d redis

# Test connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Prisma Generate Fails

```bash
# Clear Prisma cache
rm -rf node_modules/.prisma

# Reinstall
npm run prisma:generate
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Check TypeScript configuration
npm run type-check

# Rebuild
npm run build
```

## Docker Services Details

### PostgreSQL

- **Container**: gamebook-postgres
- **Port**: 5432
- **Database**: gamebook_db
- **User**: postgres
- **Password**: postgres_dev_password (change in production!)
- **Data**: Stored in Docker volume `postgres_data`

### Redis

- **Container**: gamebook-redis
- **Port**: 6379
- **Password**: redis_dev_password (change in production!)
- **Data**: Stored in Docker volume `redis_data`

### Managing Docker Volumes

```bash
# List volumes
docker volume ls

# Remove all volumes (WARNING: deletes all data)
docker compose down -v

# Backup database
docker compose exec postgres pg_dump -U postgres gamebook_db > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U postgres gamebook_db
```

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/

# Once auth is implemented:
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman/Insomnia

1. Import the API collection (coming soon)
2. Set base URL to `http://localhost:3000`
3. Test endpoints

## Next Steps

Now that your environment is set up:

1. **Explore the database** with Prisma Studio
2. **Review the code structure** in `backend/src/`
3. **Read the architecture docs** in `BACKEND_ARCHITECTURE.md`
4. **Start implementing features**:
   - Authentication system
   - Project endpoints
   - Node management
   - Real-time collaboration

## Production Setup

For production deployment:

1. Change all default passwords
2. Use environment-specific .env files
3. Enable HTTPS/SSL
4. Set up proper logging and monitoring
5. Configure backups
6. Use managed database services

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed production setup.

## Getting Help

- Check documentation in `BACKEND_ARCHITECTURE.md`
- Review Prisma documentation: https://www.prisma.io/docs
- Express.js guides: https://expressjs.com/
- Open an issue on GitHub

## Common Commands Reference

```bash
# Start everything
docker compose up -d && cd backend && npm run dev

# Stop everything
docker compose down

# Reset everything (fresh start)
docker compose down -v
cd backend
rm -rf node_modules
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev

# View all logs
docker compose logs -f

# Database backup
docker compose exec postgres pg_dump -U postgres gamebook_db > backup.sql

# View database
npm run prisma:studio
```

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] Docker installed and running
- [ ] Repository cloned
- [ ] Backend dependencies installed (`npm install`)
- [ ] Environment configured (`.env` file created)
- [ ] Docker services running (`docker compose ps` shows all services up)
- [ ] Database migrated (`npm run prisma:migrate`)
- [ ] Backend server running (`npm run dev`)
- [ ] Health check passes (http://localhost:3000/health)
- [ ] Prisma Studio accessible (http://localhost:5555)

If all items are checked, you're ready to start developing! 🎉
