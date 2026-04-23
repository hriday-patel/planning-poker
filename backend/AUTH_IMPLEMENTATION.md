## W3ID OAuth Authentication Implementation

This document describes the complete W3ID OAuth 2.0 / OpenID Connect authentication implementation for the Planning Poker application.

### Overview

The authentication system provides:

- **IBM W3ID SSO Integration** via OAuth 2.0 / OIDC
- **JWT-based session management** (access + refresh tokens)
- **Redis session storage** for scalability
- **WebSocket authentication** for real-time features
- **Rate limiting** to prevent abuse
- **Secure cookie handling** with httpOnly flags

---

### Architecture Components

#### 1. Configuration Files

**`backend/src/config/passport.ts`**

- Configures Passport OAuth2 strategy for W3ID
- Handles OAuth callback and user profile fetching
- Maps W3ID user data to application format

**`backend/src/config/redis.ts`**

- Redis client configuration
- Connection management with error handling
- Graceful shutdown support

**`backend/src/config/database.ts`**

- PostgreSQL connection pool
- Database configuration for Knex migrations

#### 2. Type Definitions

**`backend/src/types/auth.types.ts`**

- `W3IDProfile`: W3ID user profile structure
- `JWTPayload`: JWT token payload format
- `TokenPair`: Access + refresh token pair
- `UserSession`: Session data structure
- `AuthenticatedRequest`: Extended Express request with user info

#### 3. Services

**`backend/src/services/tokenService.ts`**

- `generateTokens()`: Create JWT access + refresh tokens
- `verifyAccessToken()`: Validate access tokens
- `verifyRefreshToken()`: Validate refresh tokens
- `refreshAccessToken()`: Generate new access token from refresh token

**`backend/src/services/authService.ts`**

- `handleOAuthCallback()`: Process W3ID OAuth callback
- `storeSession()`: Save session to Redis
- `getSession()`: Retrieve session from Redis
- `deleteSession()`: Remove session from Redis
- `storeOAuthState()`: Store CSRF state parameter
- `verifyOAuthState()`: Validate CSRF state parameter

**`backend/src/services/userService.ts`**

- `findUserById()`: Fetch user from database
- `createUser()`: Create new user record
- `updateUser()`: Update user profile
- `upsertUser()`: Create or update user
- `toUserSession()`: Convert DB record to session format

#### 4. Middleware

**`backend/src/middleware/auth.ts`**

- `authenticate`: Verify JWT and attach user to request
- `optionalAuthenticate`: Optional authentication (doesn't fail if no token)
- `requireAuth`: Simple auth check (use after authenticate)

**`backend/src/middleware/rateLimiter.ts`**

- `authRateLimiter`: General auth endpoint rate limiting (100 req/15min)
- `strictAuthRateLimiter`: Strict limiting for sensitive ops (5 req/15min)
- `uploadRateLimiter`: File upload rate limiting (10 uploads/hour)

#### 5. Routes

**`backend/src/routes/auth.routes.ts`**

- `GET /api/v1/auth/w3id` - Initiate OAuth flow
- `GET /api/v1/auth/w3id/callback` - Handle OAuth callback
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and revoke session
- `GET /api/v1/auth/me` - Get current user profile

**`backend/src/routes/user.routes.ts`**

- `PATCH /api/v1/users/me` - Update user profile
- `POST /api/v1/users/me/avatar` - Upload avatar image
- `DELETE /api/v1/users/me/avatar` - Delete avatar image

---

### Authentication Flow

#### 1. Login Flow

```
User clicks "Login"
  ↓
Frontend → GET /api/v1/auth/w3id
  ↓
Backend generates CSRF state, stores in Redis
  ↓
Backend redirects to W3ID authorization URL
  ↓
User authenticates with W3ID
  ↓
W3ID redirects to /api/v1/auth/w3id/callback?code=...&state=...
  ↓
Backend verifies state, exchanges code for tokens
  ↓
Backend fetches user profile from W3ID
  ↓
Backend creates/updates user in database
  ↓
Backend generates JWT tokens (access + refresh)
  ↓
Backend stores session in Redis
  ↓
Backend sets httpOnly cookies
  ↓
Backend redirects to frontend
  ↓
User is logged in
```

#### 2. API Request Flow

```
Frontend makes API request with JWT in cookie/header
  ↓
authenticate middleware extracts token
  ↓
Token is verified using JWT_SECRET
  ↓
User is fetched from database
  ↓
User session attached to req.user
  ↓
Request proceeds to route handler
```

#### 3. Token Refresh Flow

```
Access token expires
  ↓
Frontend → POST /api/v1/auth/refresh (with refresh token)
  ↓
Backend verifies refresh token
  ↓
Backend generates new access token
  ↓
Backend sets new access token cookie
  ↓
Frontend retries original request
```

#### 4. Logout Flow

```
User clicks "Logout"
  ↓
Frontend → POST /api/v1/auth/logout
  ↓
Backend deletes session from Redis
  ↓
Backend clears cookies
  ↓
User is logged out
```

---

### WebSocket Authentication

WebSocket connections are authenticated during the handshake:

```javascript
// Client-side
const socket = io("http://localhost:3001", {
  auth: {
    token: accessToken,
  },
});

// Server-side (in server.ts)
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = verifyAccessToken(token);
  if (!payload) {
    return next(new Error("Invalid token"));
  }
  socket.userId = payload.userId;
  next();
});
```

---

### Security Features

#### 1. CSRF Protection

- OAuth state parameter stored in Redis
- One-time use (deleted after verification)
- 10-minute expiry

#### 2. Token Security

- Access tokens: 24-hour expiry (configurable)
- Refresh tokens: 7-day expiry (configurable)
- Tokens stored in httpOnly cookies (not accessible via JavaScript)
- Secure flag enabled in production

#### 3. Rate Limiting

- Auth endpoints: 100 requests per 15 minutes
- Sensitive operations: 5 requests per 15 minutes
- File uploads: 10 uploads per hour

#### 4. Input Validation

- Display names: max 40 characters
- File uploads: type and size validation
- Image processing with Sharp (resize, optimize)

#### 5. Session Management

- Sessions stored in Redis with TTL
- Automatic cleanup of expired sessions
- Support for logout from all devices

---

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# W3ID OAuth
W3ID_CLIENT_ID=your_client_id
W3ID_CLIENT_SECRET=your_client_secret
W3ID_AUTHORIZATION_URL=https://w3id.sso.ibm.com/auth/sps/oauth/oauth20/authorize
W3ID_TOKEN_URL=https://w3id.sso.ibm.com/auth/sps/oauth/oauth20/token
W3ID_USERINFO_URL=https://w3id.sso.ibm.com/auth/sps/oauth/oauth20/userinfo
W3ID_CALLBACK_URL=http://localhost:3001/api/v1/auth/w3id/callback
W3ID_SCOPE=openid profile email

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Application
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

### Database Schema

The authentication system uses the `users` table:

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,  -- W3ID user ID
    display_name VARCHAR(40) NOT NULL,
    avatar_url TEXT,
    spectator_mode BOOLEAN DEFAULT FALSE,
    theme_preference VARCHAR(10) DEFAULT 'dark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### Testing the Implementation

#### 1. Install Dependencies

```bash
cd backend
npm install
```

#### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your W3ID credentials
```

#### 3. Run Database Migrations

```bash
npm run db:migrate
```

#### 4. Start Redis

```bash
redis-server
```

#### 5. Start the Server

```bash
npm run dev
```

#### 6. Test Authentication

```bash
# Initiate OAuth flow
curl http://localhost:3001/api/v1/auth/w3id

# Get current user (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/auth/me

# Refresh token
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}' \
  http://localhost:3001/api/v1/auth/refresh

# Logout
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/auth/logout
```

---

### Error Handling

The authentication system handles various error scenarios:

- **Invalid/expired tokens**: Returns 401 Unauthorized
- **Missing authentication**: Returns 401 with clear error message
- **Rate limit exceeded**: Returns 429 Too Many Requests
- **OAuth errors**: Redirects to frontend with error parameter
- **Database errors**: Returns 500 with generic error message (details logged)
- **Redis connection errors**: Logged, graceful degradation

---

### Next Steps

To complete the authentication implementation:

1. **Frontend Integration**:
   - Implement login button that redirects to `/api/v1/auth/w3id`
   - Handle OAuth callback redirect
   - Store tokens and include in API requests
   - Implement token refresh logic
   - Add logout functionality

2. **WebSocket Integration**:
   - Pass JWT token during WebSocket connection
   - Handle authentication errors
   - Implement reconnection with token refresh

3. **Production Deployment**:
   - Set secure environment variables
   - Enable HTTPS
   - Configure proper CORS origins
   - Set up Redis cluster for high availability
   - Implement monitoring and logging

---

### Troubleshooting

**Issue**: "Failed to connect to Redis"

- **Solution**: Ensure Redis is running (`redis-server`)

**Issue**: "Invalid or expired token"

- **Solution**: Token may have expired, use refresh token to get new access token

**Issue**: "Authentication required" on WebSocket

- **Solution**: Ensure JWT token is passed in handshake auth

**Issue**: "Too many requests"

- **Solution**: Rate limit exceeded, wait before retrying

**Issue**: OAuth callback fails

- **Solution**: Verify W3ID credentials and callback URL in environment variables

---

### Implementation Complete ✅

The W3ID OAuth authentication system is now fully implemented with:

- ✅ OAuth 2.0 / OIDC integration
- ✅ JWT token management
- ✅ Redis session storage
- ✅ Protected API routes
- ✅ WebSocket authentication
- ✅ Rate limiting
- ✅ File upload handling
- ✅ Comprehensive error handling
- ✅ Security best practices

Ready for frontend integration and testing!
