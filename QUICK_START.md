# Quick Start Guide

## Installation Complete! ✅

Dependencies have been successfully installed. Here's how to get started:

## Prerequisites

Before running the application, ensure you have:

1. **PostgreSQL** installed and running
2. **Redis** installed and running (for WebSocket scaling)
3. **Node.js 18+** installed
4. **IBM W3ID credentials** (for OAuth authentication)

## Setup Steps

### 1. Create Database

```bash
# Create the database
createdb planning_poker_dev

# Run migrations
npm run db:migrate

# (Optional) Load seed data for development
npm run db:seed
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# Important: Add your IBM W3ID credentials
```

### 3. Start Development Servers

**Option A: Start both backend and frontend together**
```bash
npm run dev
```

**Option B: Start individually**

Backend only:
```bash
npm run dev:backend
# Runs on http://localhost:3001
```

Frontend only:
```bash
npm run dev:frontend
# Runs on http://localhost:3000
```

## Verify Installation

### Check Backend
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Check Frontend
Open browser to: http://localhost:3000

## Current Status

### ✅ Completed
- Database schema with 8 tables
- Backend structure (Express + TypeScript + Socket.io)
- Frontend structure (Next.js 14 + React + Tailwind CSS)
- Configuration files
- Development environment setup

### 🚧 Next Steps (To Be Implemented)
1. W3ID OAuth authentication
2. User profile API
3. Game creation and management
4. Real-time WebSocket handlers
5. Voting flow
6. UI components
7. And more...

## Troubleshooting

### Dependencies Installation Issues

If you encounter issues during `npm install`:

```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or clean install
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Check database exists
psql -l | grep planning_poker
```

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

## Development Workflow

### Backend Development

```bash
cd backend

# Install dependencies (if not already done)
npm install

# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

### Frontend Development

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Run in development mode with hot reload
npm run dev

# Type check
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build
```

## Project Structure

```
planitpokertool/
├── backend/          # Express API + WebSocket server
├── frontend/         # Next.js application
├── database/         # SQL migrations and seeds
├── .env.example      # Environment variables template
└── package.json      # Root workspace configuration
```

See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for detailed structure.

## Available Scripts

### Root Level
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both projects
- `npm run start` - Start both in production mode
- `npm run db:migrate` - Run database migrations
- `npm run db:rollback` - Rollback database migrations
- `npm run db:seed` - Load seed data

### Backend
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend
- `npm run test --workspace=backend` - Run backend tests

### Frontend
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend
- `npm run lint --workspace=frontend` - Lint frontend code

## Security Notes

⚠️ **Important Security Reminders:**

1. Never commit `.env` file to version control
2. Keep your IBM W3ID credentials secure
3. Use strong JWT secrets in production
4. Enable SSL/TLS in production
5. Configure CORS properly for your domain

## Next Development Phase

Ready to implement **Step 3: W3ID OAuth Authentication**

This will include:
- OAuth 2.0 flow with IBM W3ID
- JWT token management
- Session handling
- Protected routes
- User profile management

## Need Help?

- Check [`README.md`](README.md) for project overview
- See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for architecture
- Review [`database/README.md`](database/README.md) for schema details
- Check [`database/ER_DIAGRAM.md`](database/ER_DIAGRAM.md) for relationships

## Warnings Addressed

The installation showed some deprecation warnings. These are noted for future updates:
- ESLint 8 → ESLint 9 (when stable)
- Multer 1.x → Multer 2.x (security patches)
- Various glob versions (minor security updates)

These don't affect development but should be addressed before production deployment.

---

**Happy Coding! 🚀**