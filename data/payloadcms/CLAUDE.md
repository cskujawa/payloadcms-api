# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simplified PayloadCMS v3 website template built with Next.js 15, TypeScript, and Tailwind CSS. It's designed to be a cleaner, more streamlined version of the official Payload Website Template while maintaining essential functionality including block-based page building, blog posts, live preview, and SEO features.

**Enhanced with Automatic Fixes**: This setup includes automatic patches for known template issues, ensuring optimal user experience out of the box without manual intervention.

## Core Development Commands

### Development
```bash
# Start development server with Turbopack
pnpm dev

# Generate Payload types
pnpm generate:types

# Generate import map
pnpm generate:importmap

# Run Payload CLI commands
pnpm payload

# Run initial setup script (creates admin user, etc.)
pnpm setup
```

### Build and Production
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Code Quality
```bash
# Run ESLint
pnpm lint

# Build TypeScript (check for type errors)
pnpm build
```

## Architecture Overview

### Directory Structure
- `src/app/(frontend)/` - Next.js App Router pages for the public website
- `src/app/(payload)/` - Payload admin panel and API routes
- `src/payload/` - Payload CMS configuration
  - `collections/` - Content collections (Pages, Posts, Users, Media, Categories)
  - `globals/` - Global configurations (Header, Footer)
  - `blocks/` - Reusable content blocks for the layout builder
  - `fields/` - Custom field configurations
  - `hooks/` - Payload lifecycle hooks
  - `plugins/` - Plugin configurations
- `src/components/` - React components for the frontend
- `src/lib/` - Utility functions and helpers

### Key Configuration Files
- `src/payload.config.ts` - Main Payload CMS configuration
- `next.config.ts` - Next.js configuration with Payload integration
- `tailwind.config.mjs` - Tailwind CSS configuration with shadcn/ui theme
- `tsconfig.json` - TypeScript configuration with path aliases

### Collections Architecture
- **Pages**: Block-based layout builder with draft/live preview support
- **Posts**: Blog posts with categories and SEO integration
- **Users**: Authentication-enabled admin users
- **Media**: File uploads with image optimization using Sharp
- **Categories**: Taxonomy for organizing posts

### Block System
The template uses a flexible block system for page building:
- `HighImpact`, `MediumImpact`, `LowImpact` - Hero blocks with different visual impact
- `Content` - Rich text content blocks using Lexical editor
- `MediaBlock` - Image and video display blocks
- `CallToAction` - CTA sections
- `Archive` - Post/content listing blocks

### Frontend Architecture
- Uses Next.js App Router with layout nesting
- Separate layouts for frontend (`(frontend)`) and admin (`(payload)`)
- Theme provider with dark mode support
- TypeScript with strict null checks enabled
- ESLint configuration extends Next.js core web vitals

### Database and Environment
- MongoDB adapter by default (`@payloadcms/db-mongodb`)
- Environment variables in `.env` file:
  - `DATABASE_URI` - MongoDB connection string
  - `PAYLOAD_SECRET` - JWT encryption secret
  - `NEXT_PUBLIC_SERVER_URL` - Public URL for the application

### SEO and Performance Features
- Built-in SEO plugin with meta tag generation
- Live preview functionality for content editors
- Draft versioning with scheduled publishing
- Redirects plugin for URL management
- Payload Cloud integration ready

### Important Development Notes
- Uses pnpm as package manager (specified in packageManager field)
- Turbopack support for faster development builds
- TypeScript types are auto-generated to `src/payload-types.ts`
- Custom path aliases configured (`@/*` maps to `src/*`)
- ESLint rules configured for TypeScript with Next.js standards
- No test framework currently configured in the project

### Working with Blocks
When creating new blocks:
1. Add block configuration in `src/payload/blocks/[BlockName]/config.ts`
2. Create React component in `src/payload/blocks/[BlockName]/Component.tsx`
3. Add to the blocks array in collection configurations
4. Register in `RenderBlocks.tsx` for frontend rendering

### Content Management Workflow
- Content is managed through Payload admin at `/admin`
- Pages and posts support draft/published workflow
- Live preview available during editing
- SEO fields automatically integrated
- Automatic revalidation on content changes via hooks

## Automatic Fixes and Patches

This project includes several automatic fixes that are applied during setup to resolve known issues with the upstream template. These fixes are preserved across cleanup cycles and require no manual intervention.

### Homepage Seed Data Fix

**File**: `seedData/home-fixed.ts`
**Target**: `src/app/(payload)/next/seed/seedData/home.ts`
**Issue**: Original seed data creates homepage with empty blocks array (`"blocks":[]`)
**Fix**: Properly structured seed data with complete block definitions including:
- High impact hero sections with images and CTAs
- Feature highlight blocks with descriptions
- Content blocks with rich text formatting
- Proper block relationships and metadata

**Application**: Automatically copied during project initialization in `docker-entrypoint.dev.sh` lines 84-92

### Collection Auto-Save Interval Fixes

**Files**:
- `collectionFixes/Posts-index-fixed.ts`
- `collectionFixes/Pages-index-fixed.ts`

**Targets**:
- `src/payload/collections/Posts/index.ts`
- `src/payload/collections/Pages/index.ts`

**Issue**: Original template uses 100ms auto-save interval causing:
- Title field typing interference
- Character overwrites during input
- Poor user experience due to save/restore conflicts

**Fix**: Changed auto-save interval from `100ms` to `2000ms`:
```typescript
versions: {
  drafts: {
    autosave: {
      interval: 2000, // Fixed: Changed from 100ms to 2000ms for better user experience
    },
    schedulePublish: true,
  },
  maxPerDoc: 50,
}
```

**Application**: Automatically applied during setup in `docker-entrypoint.dev.sh` lines 94-112

### Fix Persistence System

**Preservation**: All fixes are backed up during cleanup and restored automatically
**Backup Logic**: `scripts/manage.sh` lines 101-104 and 123-126
**Restoration**: Automatic during every fresh setup via `docker-entrypoint.dev.sh`
**No Manual Steps**: Developers don't need to remember to apply these fixes

### Troubleshooting Fix Application

If fixes aren't being applied:
1. Check fix files exist in container: `docker compose exec payloadcms-app ls /app/seedData/ /app/collectionFixes/`
2. Verify entrypoint logic: Look for "🔧 Fixing" messages in setup logs
3. Manual application if needed:
   ```bash
   docker compose exec payloadcms-app cp /app/seedData/home-fixed.ts src/app/\(payload\)/next/seed/seedData/home.ts
   docker compose exec payloadcms-app cp /app/collectionFixes/Posts-index-fixed.ts src/payload/collections/Posts/index.ts
   docker compose exec payloadcms-app cp /app/collectionFixes/Pages-index-fixed.ts src/payload/collections/Pages/index.ts
   ```

### Modifying Fixes

To update or add fixes:
1. Edit files in `data/payloadcms/seedData/` or `data/payloadcms/collectionFixes/`
2. Update `docker-entrypoint.dev.sh` if adding new fix targets
3. Update `scripts/manage.sh` to preserve new fix files during cleanup
4. Test with full cleanup/setup cycle