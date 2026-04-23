# Project Structure

This document outlines the complete directory structure for the Sprint Planning Poker application.

## Root Structure

```
planitpokertool/
├── backend/                 # Node.js/Express backend API
├── frontend/                # Next.js frontend application
├── database/                # Database schema and migrations
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Root package.json (workspace)
└── README.md               # Project documentation
```

## Backend Structure

```
backend/
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.ts     # Database connection config
│   │   ├── redis.ts        # Redis connection config (to be created)
│   │   └── passport.ts     # Passport OAuth config (to be created)
│   ├── controllers/        # Route controllers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── gameController.ts
│   │   ├── deckController.ts
│   │   ├── issueController.ts
│   │   └── voteController.ts
│   ├── services/           # Business logic layer
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── gameService.ts
│   │   ├── deckService.ts
│   │   ├── issueService.ts
│   │   ├── voteService.ts
│   │   └── timerService.ts
│   ├── repositories/       # Data access layer
│   │   ├── userRepository.ts
│   │   ├── gameRepository.ts
│   │   ├── deckRepository.ts
│   │   ├── issueRepository.ts
│   │   ├── voteRepository.ts
│   │   └── participantRepository.ts
│   ├── models/             # TypeScript interfaces/types
│   │   ├── User.ts
│   │   ├── Game.ts
│   │   ├── Deck.ts
│   │   ├── Issue.ts
│   │   ├── Vote.ts
│   │   └── VotingRound.ts
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.ts ✓
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── rateLimit.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── game.routes.ts
│   │   ├── deck.routes.ts
│   │   ├── issue.routes.ts
│   │   └── index.ts
│   ├── websocket/          # WebSocket handlers
│   │   ├── handlers/
│   │   │   ├── gameHandler.ts
│   │   │   ├── voteHandler.ts
│   │   │   ├── timerHandler.ts
│   │   │   └── issueHandler.ts
│   │   ├── middleware/
│   │   │   └── socketAuth.ts
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts       ✓
│   │   ├── jwt.ts
│   │   ├── qrcode.ts
│   │   ├── fileUpload.ts
│   │   └── validators.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── express.d.ts
│   │   └── socket.d.ts
│   └── server.ts           ✓ Entry point
├── logs/                   # Application logs
├── uploads/                # Uploaded files (avatars)
├── package.json            ✓
├── tsconfig.json           ✓
├── .eslintrc.json          ✓
└── jest.config.js          ✓
```

## Frontend Structure

```
frontend/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (auth)/         # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── page.tsx
│   │   ├── (protected)/    # Protected routes
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── game/
│   │   │   │   └── [gameId]/
│   │   │   │       └── page.tsx
│   │   │   └── account/
│   │   │       └── page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── legal/
│   │   │   └── page.tsx
│   │   ├── layout.tsx      ✓
│   │   └── page.tsx        ✓ Landing page
│   ├── components/         # React components
│   │   ├── ui/             # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── Toggle.tsx
│   │   ├── game/           # Game-specific components
│   │   │   ├── GameRoom.tsx
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── VotingDeck.tsx
│   │   │   ├── ResultsDisplay.tsx
│   │   │   ├── AgreementMeter.tsx
│   │   │   └── CountdownAnimation.tsx
│   │   ├── issues/         # Issue management
│   │   │   ├── IssuesPanel.tsx
│   │   │   ├── IssueList.tsx
│   │   │   ├── IssueItem.tsx
│   │   │   └── ImportModal.tsx
│   │   ├── timer/          # Timer components
│   │   │   └── TimerWidget.tsx
│   │   ├── modals/         # Modal dialogs
│   │   │   ├── InviteModal.tsx
│   │   │   ├── GameSettingsModal.tsx
│   │   │   ├── ProfileModal.tsx
│   │   │   └── CustomDeckModal.tsx
│   │   ├── layout/         # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── common/         # Common components
│   │       ├── Avatar.tsx
│   │       ├── QRCode.tsx
│   │       └── ThemeToggle.tsx
│   ├── lib/                # Library code
│   │   ├── api.ts          # API client
│   │   ├── socket.ts       # WebSocket client
│   │   └── utils.ts        # Utility functions
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useGame.ts
│   │   ├── useSocket.ts
│   │   ├── useTimer.ts
│   │   └── useTheme.ts
│   ├── store/              # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── gameStore.ts
│   │   ├── uiStore.ts
│   │   └── index.ts
│   ├── types/              # TypeScript types
│   │   ├── api.ts
│   │   ├── game.ts
│   │   ├── user.ts
│   │   └── socket.ts
│   ├── styles/             # Global styles
│   │   └── globals.css     ✓
│   └── utils/              # Utility functions
│       ├── cn.ts           # Class name utility
│       ├── format.ts       # Formatting utilities
│       └── validation.ts   # Form validation
├── public/                 # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── package.json            ✓
├── tsconfig.json           ✓
├── next.config.js          ✓
├── tailwind.config.ts      ✓
└── postcss.config.js       ✓
```

## Database Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql      ✓
│   └── 001_initial_schema_down.sql ✓
├── seeds/
│   └── 001_dev_data.sql            ✓
├── config.example.js               ✓
├── README.md                       ✓
└── ER_DIAGRAM.md                   ✓
```

## Key Files Status

### Completed (✓)

- Database schema and migrations
- Backend configuration files (tsconfig, eslint, jest)
- Backend server entry point
- Backend middleware (error handler, logger)
- Frontend configuration files (next.config, tailwind, postcss)
- Frontend app structure (layout, landing page)
- Frontend global styles
- Environment variables template
- Git ignore rules
- Project documentation

### To Be Created

- Backend controllers, services, repositories
- Backend routes and WebSocket handlers
- Backend authentication and authorization
- Frontend components (UI, game, issues, etc.)
- Frontend hooks and state management
- Frontend API and WebSocket clients
- Frontend pages (create, game room, account, etc.)

## Development Workflow

1. **Backend Development**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Development**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Full Stack Development**
   ```bash
   npm install
   npm run dev
   ```

## Architecture Layers

### Backend

1. **Routes Layer**: HTTP endpoint definitions
2. **Controllers Layer**: Request/response handling
3. **Services Layer**: Business logic
4. **Repositories Layer**: Data access
5. **Models Layer**: Data structures

### Frontend

1. **Pages Layer**: Next.js routes
2. **Components Layer**: React components
3. **Hooks Layer**: Custom React hooks
4. **Store Layer**: Global state management
5. **Lib Layer**: API and utility functions

## Next Steps

1. Implement W3ID OAuth authentication
2. Build User profile API
3. Create Game creation API + deck management
4. Build Game room route + basic layout
5. Implement Issues CRUD API + sidebar UI
6. Set up WebSocket server + room management
7. Build voting flow (submit vote, reveal, new round)
8. Implement Timer feature (WebSocket synchronized)
9. Create Invite system (link + QR code)
10. Build Results display (bar chart, average, agreement meter)
11. Implement Voting history
12. Create Game settings modal (in-game)
13. Build Landing page
14. Implement Responsive/mobile layout
15. Add Dark/light theme toggle
