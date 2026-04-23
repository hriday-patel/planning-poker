# Sprint Planning Poker

A full-stack, real-time Sprint Planning Poker web application for internal enterprise use. This application enables agile teams to conduct sprint estimation sessions collaboratively online with IBM W3ID authentication.

## 🎯 Project Overview

Sprint Planning Poker is a self-hosted estimation tool that provides:

- **Free & Unlimited**: No restrictions on voting rounds or games
- **Enterprise SSO**: Secure authentication via IBM W3ID
- **Real-time Collaboration**: WebSocket-powered live voting and updates
- **Customizable**: Multiple voting systems and custom card decks
- **Feature-rich**: Timer, voting history, issue management, and more

## 📋 Current Status

### ✅ Completed

- **Database Schema**: Complete PostgreSQL schema with migrations
  - 8 core tables with proper relationships and constraints
  - 4 default voting decks (Fibonacci, Modified Fibonacci, T-shirts, Powers of 2)
  - Comprehensive indexes for performance
  - Development seed data for testing

### 🚧 In Progress

- Project structure setup (backend/frontend)

### 📝 Planned

- W3ID OAuth authentication flow
- User profile API
- Game creation and management
- Real-time WebSocket server
- Voting flow implementation
- Timer feature
- Issues management
- Results visualization
- Landing page and UI components

## 🗄️ Database Schema

The application uses PostgreSQL with the following core entities:

### Core Tables

- **users**: User profiles from W3ID authentication
- **decks**: Voting card decks (system and custom)
- **games**: Planning poker game sessions
- **game_participants**: Player membership and presence
- **issues**: User stories to be estimated
- **voting_rounds**: Individual voting sessions
- **votes**: Individual vote submissions
- **timer_state**: Synchronized countdown timer

### Key Features

- UUID-based game IDs for secure shareable URLs
- Real-time presence tracking
- Voting history and audit trail
- Automatic timestamp management
- Comprehensive foreign key relationships

See [`database/README.md`](database/README.md) for detailed schema documentation and [`database/ER_DIAGRAM.md`](database/ER_DIAGRAM.md) for entity relationships.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (for WebSocket scaling)
- IBM W3ID credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd planitpokertool
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create the database**

   ```bash
   createdb planning_poker_dev
   ```

4. **Run migrations**

   ```bash
   psql -U postgres -d planning_poker_dev -f database/migrations/001_initial_schema.sql
   ```

5. **Load seed data (optional, for development)**
   ```bash
   psql -U postgres -d planning_poker_dev -f database/seeds/001_dev_data.sql
   ```

## 📁 Project Structure

```
planitpokertool/
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 001_initial_schema_down.sql
│   ├── seeds/
│   │   └── 001_dev_data.sql
│   ├── config.example.js
│   ├── README.md
│   └── ER_DIAGRAM.md
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Configuration

### Environment Variables

Key configuration options (see `.env.example` for full list):

**Database**

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

**IBM W3ID OAuth**

- `W3ID_CLIENT_ID`, `W3ID_CLIENT_SECRET`
- `W3ID_AUTHORIZATION_URL`, `W3ID_TOKEN_URL`, `W3ID_USERINFO_URL`

**Application**

- `PORT`, `NODE_ENV`, `API_BASE_URL`

**Security**

- `JWT_SECRET`, `SESSION_SECRET`

**WebSocket**

- `WS_PORT`, `WS_PATH`

**Redis**

- `REDIS_HOST`, `REDIS_PORT`

## 🎮 Features

### Authentication

- IBM W3ID SSO integration (OAuth 2.0 / OIDC)
- JWT-based session management
- Automatic token refresh
- Secure logout

### Game Management

- Create games with custom settings
- Multiple voting systems (Fibonacci, T-shirts, etc.)
- Custom card deck creator
- Facilitator role management
- Game settings (permissions, auto-reveal, etc.)

### Real-time Voting

- Live card selection and reveal
- Synchronized countdown animation
- Vote distribution visualization
- Consensus agreement meter
- Voting history tracking

### Issue Management

- Add/edit/delete issues
- Import from JIRA/Linear (planned)
- Import from CSV
- Issue status tracking (pending/voting/voted)

### Timer Feature

- Synchronized countdown across all clients
- Auto-reset per voting round option
- Pause/resume/stop controls

### User Experience

- Dark/light theme toggle
- Spectator mode
- Profile customization (name, avatar)
- Responsive design
- QR code invite links

## 🏗️ Architecture

### Technology Stack (Planned)

- **Frontend**: React/Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Cache**: Redis
- **Authentication**: IBM W3ID (OAuth 2.0)

### Architecture Patterns

- **Separation of Concerns**: Layered architecture (UI, Business Logic, Data Access)
- **Real-time**: Pub/sub room-based WebSocket model
- **Caching**: In-memory cache for active game state
- **Optimistic UI**: Immediate updates with server confirmation
- **State Management**: Centralized game state with WebSocket sync

See the requirements document for detailed architectural concepts.

## 📊 Database Migrations

### Apply Migration

```bash
psql -U postgres -d planning_poker_dev -f database/migrations/001_initial_schema.sql
```

### Rollback Migration

```bash
psql -U postgres -d planning_poker_dev -f database/migrations/001_initial_schema_down.sql
```

### Verify Schema

```bash
psql -U postgres -d planning_poker_dev -c "\dt"
```

## 🧪 Development

### Load Test Data

```bash
psql -U postgres -d planning_poker_dev -f database/seeds/001_dev_data.sql
```

This creates:

- 6 test users
- 4 sample games (3 active, 1 archived)
- Multiple issues in various states
- Completed and active voting rounds
- Sample votes showing consensus patterns

## 🔒 Security

- User authentication via IBM W3ID SSO
- JWT tokens with httpOnly cookies
- CORS configuration for trusted domains
- Input validation and sanitization
- Rate limiting on API endpoints
- UUID-based game URLs (non-enumerable)
- Vote privacy (hidden until reveal)

## 📝 API Documentation

API endpoints will follow RESTful conventions:

**Base URL**: `/api/v1`

### Planned Endpoints

- `POST /auth/w3id/callback` - OAuth callback
- `GET /auth/me` - Current user
- `POST /games` - Create game
- `GET /games/:gameId` - Get game details
- `GET /games/:gameId/issues` - List issues
- `POST /games/:gameId/issues` - Add issue
- And more...

See requirements document for complete API specification.

## 🔌 WebSocket Events

Real-time events for game synchronization:

**Client → Server**

- `JOIN_GAME`, `LEAVE_GAME`
- `SUBMIT_VOTE`, `REVEAL_CARDS`
- `START_NEW_ROUND`
- `UPDATE_GAME_SETTINGS`
- `START_TIMER`, `PAUSE_TIMER`, `STOP_TIMER`

**Server → Client**

- `PLAYER_JOINED`, `PLAYER_LEFT`
- `VOTE_SUBMITTED`, `CARDS_REVEALED`
- `NEW_ROUND_STARTED`
- `TIMER_TICK`, `TIMER_ENDED`
- `PLAYER_UPDATED`

## 🤝 Contributing

This is an internal enterprise project. For contributions:

1. Follow the build sequence in the requirements document
2. Maintain separation of concerns
3. Write tests for new features
4. Update documentation

## 📄 License

Internal use only - Enterprise organization

## 📞 Support

- **Contact**: See "Contact us" in application
- **FAQs**: See "FAQs" in application
- **Legal**: See "Legal notice" in application

## 🗺️ Roadmap

### Phase 1: Foundation (Current)

- ✅ Database schema
- 🚧 Project structure
- ⏳ Authentication
- ⏳ Basic API

### Phase 2: Core Features

- Game creation and management
- Real-time voting
- Issue management
- Timer feature

### Phase 3: Enhanced UX

- Results visualization
- Voting history
- Landing page
- Theme support

### Phase 4: Integrations

- JIRA integration
- Linear integration
- CSV import/export
- Analytics

---

**Built with ❤️ for agile teams**
