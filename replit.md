# FitMuse

## Overview

FitMuse is a browser-based outfit recommendation application that helps users curate and style their wardrobe using AI. Users upload photos of their clothing items, select a mood and style preferences, and receive personalized outfit combinations from their own closet. The app uses OpenAI's vision capabilities to analyze clothing items and generate outfit recommendations based on predefined moodboards and style vibes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: shadcn/ui components built on top of Radix UI primitives, providing a comprehensive set of accessible, customizable components.

**Styling**: Tailwind CSS with a custom design system featuring:
- Fashion-focused color palette (soft creams, charcoals, pastels)
- Custom CSS variables for theming
- Custom fonts (Playfair Display for serif, DM Sans for sans-serif)
- Responsive design with mobile-first approach

**State Management**: React hooks for local state, with TanStack Query (React Query) for server state management and caching.

**Routing**: Wouter for lightweight client-side routing.

**Animations**: Framer Motion for smooth transitions and UI interactions.

**Key Design Decisions**:
- Single-page application with a landing page that transitions to the main interface
- Three-panel layout: Mood Selector, Closet Panel, and Creative Panel
- Client-side image preview and management before server analysis
- Modal overlay for displaying generated outfit recommendations

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Build System**: 
- Custom esbuild configuration for server bundling
- Vite for client bundling
- Production builds combine both into a single deployable artifact in `/dist`

**Development Setup**:
- Separate dev server processes for client (Vite) and server (tsx)
- Hot module replacement for rapid development
- Replit-specific integrations for development banners and error overlays

**API Structure**:
- RESTful endpoints for clothing analysis and outfit generation
- JSON-based request/response format
- Image data transmitted as base64-encoded strings

**Key API Endpoints**:
- `POST /api/analyze-clothing` - Analyzes a single clothing image
- `GET /api/moodboards` - Retrieves all mood configurations
- `GET /api/style-vibes` - Retrieves all style vibe configurations  
- `POST /api/generate-outfit` - Generates outfit recommendations from user's closet items

### Data Storage Solutions

**ORM**: Drizzle ORM for type-safe database interactions.

**Database Schema**:
- `users` table: Basic user authentication (username/password)
- `moodboards` table: Stores mood configurations (Calm, Energetic, Dark, Bright, Soft, Bold) with color palettes, textures, silhouettes, and styling logic
- `style_vibes` table: Stores style vibe configurations (Streetwear, Minimalist, Vintage, Sporty, Romantic, Casual) with similar attributes

**Database Dialect**: PostgreSQL configured via `DATABASE_URL` environment variable.

**Seeding Strategy**: Predefined moodboard and style vibe data seeded on application startup to ensure consistency.

**Design Rationale**: 
- Drizzle chosen for its TypeScript-first approach and lightweight footprint
- Structured data stored in database rather than hardcoded to allow future admin interfaces for customization
- Array columns used for multi-value fields (colors, textures, etc.) to maintain flexibility

### Authentication and Authorization

**Strategy**: Basic username/password authentication prepared in schema, but not currently implemented in routes.

**Session Management**: Infrastructure present for express-session with potential PostgreSQL session store (connect-pg-simple), but not actively used in current implementation.

**Design Note**: Authentication scaffolding exists but the current application focuses on the core outfit generation functionality. Full authentication would be implemented when user-specific closet persistence is added.

## External Dependencies

### AI Services

**OpenAI Integration**: 
- Uses Replit's AI Integrations service for OpenAI-compatible API access
- Vision API (GPT-4o model) for clothing image analysis
- Structured JSON responses for consistent data parsing
- Image analysis extracts: category, colors, style vibes, formality level, seasonality, and description

**Integration Method**: Base64-encoded images sent to OpenAI's chat completions endpoint with vision capabilities.

**Design Rationale**: OpenAI's vision models provide reliable clothing classification without requiring custom ML model training. The structured JSON output ensures predictable parsing and type safety.

### Third-Party Libraries

**UI Components**: 
- Radix UI primitives for accessible, unstyled component foundations
- shadcn/ui for pre-styled, customizable components
- Lucide React for consistent iconography

**Form Handling**: 
- React Hook Form with Zod resolvers for type-safe form validation
- Zod schemas generate TypeScript types from database schema definitions

**Image Processing**: 
- Browser FileReader API for client-side base64 encoding
- Canvas API for potential future image preprocessing

**Utilities**:
- clsx and tailwind-merge for conditional CSS class management
- date-fns for date formatting and manipulation
- nanoid for generating unique IDs

### Development Tools

**Replit Integrations**:
- `@replit/vite-plugin-runtime-error-modal` - Development error overlays
- `@replit/vite-plugin-cartographer` - Code navigation enhancements
- `@replit/vite-plugin-dev-banner` - Development environment indicators

**Custom Plugins**:
- `vite-plugin-meta-images` - Automatically updates OpenGraph meta tags with correct Replit domain for social sharing

### Build and Deployment

**Production Build Process**:
1. Client built with Vite to `/dist/public`
2. Server bundled with esbuild to `/dist/index.cjs`
3. Static file serving configured to serve client from `/dist/public`
4. Single Node.js process serves both API and static assets

**Environment Variables**:
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI service endpoint
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI service authentication
- `NODE_ENV` - Environment detection (development/production)

**Design Decisions**:
- Monorepo structure with shared types between client and server
- TypeScript path aliases for cleaner imports (`@/`, `@shared/`, `@assets/`)
- CommonJS output for server to reduce cold start times on deployment
- Selective bundling of server dependencies to optimize startup performance