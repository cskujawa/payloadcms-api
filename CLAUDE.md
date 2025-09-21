# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Docker-based PayloadCMS development environment that automatically creates and manages a PayloadCMS v3 instance with MongoDB using the enhanced `gioruu/simple-payload-starter` template. The repository uses Docker Compose for orchestration and includes automated project initialization scripts that clone and configure a modern, feature-rich PayloadCMS starter with improved frontend capabilities.

## Core Commands

### Setup and Environment Management
```bash
# Initial setup - creates .env, builds containers, starts services
./scripts/setup.sh

# Complete cleanup - removes all containers, volumes, and data
./scripts/manage.sh cleanup

# Complete cleanup without confirmation prompts
./scripts/manage.sh cleanup --yes
```

### Docker Operations
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f
docker compose logs -f payloadcms-app

# Rebuild containers
docker compose build
```

### Service Health Checks
```bash
# Check MongoDB connectivity
docker compose exec payloadcms-db mongosh --eval "db.adminCommand('ping')"

# Check PayloadCMS web interface
curl -f http://localhost:3000/admin
```

## Architecture

### Container Structure
- **payloadcms-app**: Main application container running PayloadCMS v3 with Next.js and enhanced starter template
  - Includes Git for repository cloning
  - Build tools for native module compilation (vips-dev, build-base, python3, make, g++)
  - Platform-specific sharp module for image processing
- **payloadcms-db**: MongoDB database container with WiredTiger storage engine

### Key Directories
- `data/payloadcms/`: Contains Docker configuration and will house the generated PayloadCMS project
- `scripts/`: Management scripts for setup and cleanup operations

### Network Configuration
- Internal Docker network: `payloadcms` for inter-service communication
- External network: `smart-tilde` proxy network for external access
- MongoDB accessible internally at `payloadcms-db:27017`

### Volume Management
- `payloadcms_db_data`: Persistent MongoDB data storage
- `payloadcms_node_modules`: Node.js dependencies cache
- `./data/payloadcms:/app`: Source code volume mount for live development

## Development Workflow

### First-Time Setup
1. The setup script automatically creates a secure `.env` file with randomly generated secrets
2. PayloadCMS project is initialized automatically by cloning the `gioruu/simple-payload-starter` repository
3. Environment variables are configured from the starter's `.env.example` template
4. MongoDB database is configured with the connection string from environment variables
5. Admin interface becomes available at `http://localhost:3000/admin`

### Environment Variables
Key variables in `.env`:
- `PAYLOAD_SECRET`: Secure random string for PayloadCMS (auto-generated)
- `DATABASE_URI`: MongoDB connection string (defaults to internal Docker network)
- `PAYLOADCMS_HOST_PORT`: External port for web access (default: 3000)
- `NEXT_PUBLIC_SERVER_URL`: Public URL for PayloadCMS instance

### Port Management
- Default external port: 3000 (configurable via `PAYLOADCMS_HOST_PORT`)
- Setup script includes port conflict detection and prevention
- MongoDB runs on internal network only (no external port exposure)

### Auto-Initialization Process
The Docker entrypoint (`data/payloadcms/docker-entrypoint.dev.sh`) handles:
1. Detecting if PayloadCMS project exists
2. Cloning the `gioruu/simple-payload-starter` repository if needed
3. Setting up environment variables from the starter's `.env.example` template
4. Configuring Next.js for Docker standalone output
5. Installing dependencies with pnpm
6. Installing platform-specific sharp module for Alpine Linux image processing
7. Starting development server

## Security Considerations

- Secrets are auto-generated during setup for security
- MongoDB is isolated on internal Docker network
- Custom Docker files in `data/payloadcms/` are preserved during cleanup operations
- Environment file (`.env`) is excluded from Git via `.gitignore`

## Troubleshooting

### Common Issues
- Port conflicts: Setup script checks and reports conflicting services
- Service health: Use health check commands to verify MongoDB and PayloadCMS status
- First startup: PayloadCMS may take time to initialize on first run
- Sharp module errors: Image processing module requires platform-specific compilation for Alpine Linux

### Log Analysis
- Application logs: `docker compose logs -f payloadcms-app`
- Database logs: Disabled by default in docker-compose.yaml
- Setup logs: Console output from `./scripts/setup.sh`

### Sharp Module Issues
If you encounter sharp module errors (Cannot find module 'sharp-linuxmusl-x64.node'):
1. The entrypoint automatically handles platform-specific sharp installation
2. Dockerfile includes necessary build dependencies: `vips-dev`, `build-base`, `python3`, `make`, `g++`
3. Manual fix: `docker compose exec payloadcms-app npm install --platform=linuxmusl --arch=x64 sharp`
4. For persistent issues, rebuild containers: `docker compose build --no-cache`

## Notes for Development

- The PayloadCMS project is created dynamically, so no package.json exists in the repository root
- Development uses pnpm package manager within containers
- Live reloading is enabled through volume mounts
- Next.js telemetry is disabled in the container environment
- Container runs as non-root `node` user for security

## Enhanced Template Features

This environment uses the `gioruu/simple-payload-starter` template which provides:

### Frontend Enhancements
- **Modern Stack**: TypeScript + Next.js 15 with App Router
- **Styling**: Tailwind CSS with responsive design
- **UI Components**: shadcn/ui component library integration
- **Dark Mode**: Built-in dark mode support with theme switching

### Content Management
- **Block-based Building**: Simplified page building with reusable content blocks
- **SEO Optimization**: Built-in meta tags, Open Graph, and structured data
- **Blog System**: Ready-to-use blog with categories and post management
- **Media Handling**: Optimized image processing with sharp integration

### Developer Experience
- **TypeScript**: Full type safety with generated Payload types
- **Live Preview**: Real-time content preview functionality
- **Turbopack**: Fast development builds with Next.js Turbopack
- **Clean Architecture**: Simplified folder structure compared to official template