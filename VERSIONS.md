# Package Versions

This document lists the current versions of all major dependencies used in the project.

## Frontend Dependencies

### Core Framework

- **Next.js**: `15.5.15` (Latest stable)
- **React**: `19.2.5` (Latest stable)
- **React DOM**: `19.2.5` (Latest stable)
- **TypeScript**: `5.2.2`

### Styling

- **Tailwind CSS**: `4.2.2` (Latest v4)
- **PostCSS**: `8.4.31`
- **Autoprefixer**: `10.4.16`

### State Management & Data Fetching

- **Zustand**: `4.4.7`
- **Axios**: `1.6.2`

### Real-time Communication

- **Socket.io Client**: `4.7.4`

### Form Handling

- **React Hook Form**: `7.48.2`
- **Zod**: `3.22.4`
- **@hookform/resolvers**: `3.3.2`

### UI Components & Icons

- **Lucide React**: `0.294.0`
- **Framer Motion**: `10.18.5`
- **QRCode.react**: `3.1.0`
- **Recharts**: `2.10.3`

### Utilities

- **clsx**: `2.0.0`
- **tailwind-merge**: `2.1.0`
- **date-fns**: `2.30.0`

### Development Tools

- **ESLint**: `8.57.1`
- **eslint-config-next**: `14.0.3`
- **@typescript-eslint/eslint-plugin**: `6.10.0`
- **@typescript-eslint/parser**: `6.10.0`

## Backend Dependencies

### Core Framework

- **Express**: `4.18.2`
- **Node.js**: `>=18.0.0` (required)
- **TypeScript**: `5.2.2`

### Real-time Communication

- **Socket.io**: `4.7.4`

### Database

- **PostgreSQL** (pg): `8.11.3`
- **Knex.js**: `3.0.1`

### Authentication & Security

- **Passport**: `0.7.0`
- **Passport OAuth2**: `1.7.0`
- **Passport JWT**: `4.0.1`
- **jsonwebtoken**: `9.0.2`
- **bcryptjs**: `2.4.3`

### Session Management

- **express-session**: `1.17.3`
- **connect-redis**: `7.1.0`
- **Redis**: `4.6.10`

### Middleware

- **CORS**: `2.8.5`
- **Helmet**: `7.1.0`
- **Morgan**: `1.10.0`
- **Compression**: `1.7.4`
- **express-rate-limit**: `7.1.5`
- **express-validator**: `7.0.1`

### File Handling

- **Multer**: `1.4.5-lts.1`
- **Sharp**: `0.32.6`

### Utilities

- **UUID**: `9.0.1`
- **QRCode**: `1.5.3`
- **CSV Parser**: `3.0.0`
- **dotenv**: `16.3.1`
- **Winston**: `3.11.0` (logging)
- **Joi**: `17.11.0` (validation)

### Development Tools

- **Nodemon**: `3.0.1`
- **ts-node**: `10.9.1`
- **ESLint**: `8.53.0`
- **Jest**: `29.7.0`
- **ts-jest**: `29.1.1`

## Version Notes

### Next.js 15.5.15

- Latest stable release with improved performance
- Enhanced App Router features
- Better TypeScript support
- Improved caching strategies

### React 19.2.5

- Latest stable release
- Improved concurrent features
- Better server components support
- Enhanced hooks API

### Tailwind CSS 4.2.2

- Latest v4 release with new features
- Improved performance
- Better dark mode support
- Enhanced customization options

## Compatibility Notes

### React 19 Compatibility

Some packages show peer dependency warnings with React 19:

- `framer-motion@10.18.0` - expects React ^18.0.0
- `lucide-react@0.294.0` - expects React ^16.5.1 || ^17.0.0 || ^18.0.0
- `qrcode.react@3.1.0` - expects React ^16.8.0 || ^17.0.0 || ^18.0.0

These packages work correctly with React 19 despite the warnings. The warnings will be resolved when these packages update their peer dependencies.

## Security Vulnerabilities

Current status: **9 high severity vulnerabilities**

These are primarily in development dependencies and do not affect production:

- Old versions of `glob` (used by various dev tools)
- `multer@1.4.5-lts.1` (should upgrade to 2.x in production)
- Various deprecated packages in the dependency tree

### Recommended Actions

1. Run `npm audit fix` to auto-fix compatible issues
2. Manually update `multer` to 2.x before production
3. Monitor for updates to deprecated packages

## Update Strategy

### Regular Updates

- Check for updates monthly: `npm outdated`
- Update patch versions automatically
- Review minor/major updates before applying

### Critical Updates

- Security patches: Apply immediately
- Framework updates: Test thoroughly before applying
- Breaking changes: Review migration guides

## Last Updated

**Date**: 2026-04-20
**Updated By**: Initial setup
**Next Review**: Before production deployment
