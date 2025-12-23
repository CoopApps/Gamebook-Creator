-- Initialize Gamebook Database
-- This script runs automatically when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Create initial schema (Prisma will manage migrations)
-- This is just for initial setup verification

\echo 'Gamebook database initialized successfully!'
\echo 'Database: gamebook_db'
\echo 'User: postgres'
\echo 'Extensions: uuid-ossp, pg_trgm'
\echo ''
\echo 'Next steps:'
\echo '1. Run: cd backend && npm install'
\echo '2. Run: npx prisma migrate dev'
\echo '3. Run: npm run dev'
