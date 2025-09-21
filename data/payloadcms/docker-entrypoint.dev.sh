#!/bin/sh
set -e

echo "🚀 PayloadCMS Docker Entrypoint"

# If package.json doesn't exist, initialize PayloadCMS project
if [ ! -f "package.json" ]; then
    echo "📦 No package.json found - initializing PayloadCMS project..."

    # Check if running as root, if so setup corepack then switch to node user
    if [ "$(id -u)" = "0" ]; then
        echo "🔧 Setting up corepack as root..."
        corepack enable
        corepack prepare pnpm@latest --activate

        echo "👤 Switching to node user for project initialization..."
        # Change ownership of working directory to node user
        chown -R node:node /app

        # Execute rest of script as node user
        exec su-exec node "$0" "$@"
    fi

    # Now running as node user - corepack should already be set up

    # Clone the simple-payload-starter repository
    echo "🏗️  Cloning simple-payload-starter project..."
    git clone --depth 1 https://github.com/gioruu/simple-payload-starter.git temp-project

    # Move files from cloned directory to current directory
    echo "📂 Moving project files to working directory..."

    if [ -d "temp-project" ]; then
        echo "✅ Found temp-project directory"
        # Move all files including hidden ones
        find temp-project -mindepth 1 -maxdepth 1 -exec mv {} . \; 2>/dev/null || true
        # Clean up temporary directory
        rm -rf temp-project
        echo "📂 Files moved successfully"

        # Copy .env.example to .env if it doesn't exist and configure it
        if [ -f ".env.example" ] && [ ! -f ".env" ]; then
            echo "⚙️  Setting up environment variables from .env.example..."
            cp .env.example .env
        fi

        # Update .env with environment values from Docker Compose
        echo "🔧 Updating environment variables..."

        # Update with values passed from docker-compose environment
        sed -i "s|DATABASE_URI=.*|DATABASE_URI=${DATABASE_URI}|" .env
        sed -i "s|PAYLOAD_SECRET=.*|PAYLOAD_SECRET=${PAYLOAD_SECRET}|" .env

        # Use NEXT_PUBLIC_SERVER_URL from environment (passed from host .env)
        if [ -n "${NEXT_PUBLIC_SERVER_URL}" ]; then
            sed -i "s|NEXT_PUBLIC_SERVER_URL=.*|NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}|" .env
            echo "📍 Using server URL from environment: ${NEXT_PUBLIC_SERVER_URL}"
        else
            # Fallback to existing value in .env
            CURRENT_SERVER_URL=$(grep "NEXT_PUBLIC_SERVER_URL=" .env | cut -d'=' -f2)
            echo "📍 Using server URL from .env: ${CURRENT_SERVER_URL}"
        fi

        # Add content generator environment variables
        echo "🔧 Adding content generator environment variables..."

        # First add from host environment if available
        if [ -n "${PAYLOADCMS_TOOL_EMAIL}" ] && [ -n "${PAYLOADCMS_TOOL_PASSWORD}" ]; then
            echo "" >> .env
            echo "# PayloadCMS Content Generator Tool Authentication (from host environment)" >> .env
            echo "PAYLOADCMS_TOOL_EMAIL=\"${PAYLOADCMS_TOOL_EMAIL}\"" >> .env
            echo "PAYLOADCMS_TOOL_PASSWORD=\"${PAYLOADCMS_TOOL_PASSWORD}\"" >> .env
            echo "PAYLOADCMS_TOOL_PORT=${PAYLOADCMS_TOOL_PORT:-3001}" >> .env
            echo "✅ Added content generator environment variables from host"
        elif [ -f "/app/toolsConfig/env-additions.txt" ]; then
            echo "" >> .env
            cat /app/toolsConfig/env-additions.txt >> .env
            echo "✅ Added content generator environment variables from backup config"
        else
            echo "⚠️  Content generator env variables not found, API authentication may fail"
        fi

        # Fix static generation conflicts
        echo "🔧 Fixing static generation conflicts..."
        if [ -f "src/app/(frontend)/posts/page.tsx" ]; then
            # Remove force-static to allow proper SSR for external API access
            sed -i '/export const dynamic = .force-static./d' src/app/\(frontend\)/posts/page.tsx
            # Change revalidate to a smaller value for better responsiveness
            sed -i 's/export const revalidate = 600/export const revalidate = 60/' src/app/\(frontend\)/posts/page.tsx
            echo "✅ Updated posts page configuration"
        fi

        # Fix Next.js image configuration
        echo "🔧 Fixing Next.js image configuration..."
        if [ -f "next.config.ts" ]; then
            # Replace NEXT_PUBLIC_SITE_URL with NEXT_PUBLIC_SERVER_URL
            sed -i 's/process\.env\.NEXT_PUBLIC_SITE_URL/process.env.NEXT_PUBLIC_SERVER_URL/g' next.config.ts
            echo "✅ Updated Next.js config to use NEXT_PUBLIC_SERVER_URL"
        fi

        # Fix homepage seeding data structure
        echo "🔧 Fixing homepage seed data structure..."
        if [ -f "src/app/(payload)/next/seed/seedData/home.ts" ]; then
            # Copy our fixed version over the broken one
            if [ -f "/app/seedData/home-fixed.ts" ]; then
                cp /app/seedData/home-fixed.ts "src/app/(payload)/next/seed/seedData/home.ts"
                echo "✅ Applied homepage seed fix - blocks structure corrected"
            else
                echo "⚠️  Fixed seed data not found, homepage may have empty content"
            fi
        fi

        # Fix auto-save intervals for better user experience
        echo "🔧 Fixing auto-save intervals in collections..."
        if [ -f "src/payload/collections/Posts/index.ts" ]; then
            if [ -f "/app/collectionFixes/Posts-index-fixed.ts" ]; then
                cp /app/collectionFixes/Posts-index-fixed.ts "src/payload/collections/Posts/index.ts"
                echo "✅ Applied Posts collection auto-save fix - changed from 100ms to 2000ms"
            else
                echo "⚠️  Posts collection fix not found, title editing may have interference"
            fi
        fi

        if [ -f "src/payload/collections/Pages/index.ts" ]; then
            if [ -f "/app/collectionFixes/Pages-index-fixed.ts" ]; then
                cp /app/collectionFixes/Pages-index-fixed.ts "src/payload/collections/Pages/index.ts"
                echo "✅ Applied Pages collection auto-save fix - changed from 100ms to 2000ms"
            else
                echo "⚠️  Pages collection fix not found, title editing may have interference"
            fi
        fi

        # Fix Logo component to use custom branding
        echo "🔧 Applying custom logo branding..."
        if [ -f "src/components/Logo/Logo.tsx" ]; then
            if [ -f "/app/componentFixes/Logo-fixed.tsx" ]; then
                cp /app/componentFixes/Logo-fixed.tsx "src/components/Logo/Logo.tsx"
                echo "✅ Applied custom logo fix - replaced PayloadCMS branding"
            else
                echo "⚠️  Logo fix not found, PayloadCMS branding will remain"
            fi
        fi

        # Fix Code block configuration for expanded language support
        echo "🔧 Fixing Code block language support..."
        if [ -f "src/payload/blocks/Code/config.ts" ]; then
            if [ -f "/app/componentFixes/Code-config-fixed.ts" ]; then
                cp /app/componentFixes/Code-config-fixed.ts "src/payload/blocks/Code/config.ts"
                echo "✅ Applied Code block fix - expanded language support for content generator"
            else
                echo "⚠️  Code block fix not found, content generator may have validation errors"
            fi
        fi

        # Setup content directory for Next.js static serving
        echo "🔧 Setting up content directory for static assets..."
        if [ -d "/app/content" ]; then
            # Create content symlink in public directory for Next.js static serving
            if [ ! -L "public/content" ] && [ ! -d "public/content" ]; then
                ln -sf /app/content public/content
                echo "✅ Created content symlink in public directory"
            fi
        fi
    else
        echo "❌ Cloned project directory not found! Available directories:"
        ls -la
    fi

    # Ensure Next.js config has standalone output for Docker
    if [ -f "next.config.mjs" ]; then
        echo "⚙️  Configuring Next.js for Docker standalone output..."
        if ! grep -q "output.*standalone" next.config.mjs; then
            # Add standalone output if not present
            sed -i "s/const nextConfig = {/const nextConfig = {\n  output: 'standalone',/" next.config.mjs
        fi
    fi

    # Set proper ownership (if running as root, change to node user)
    if [ "$(id -u)" = "0" ]; then
        chown -R node:node . 2>/dev/null || true
    fi

    echo "✅ PayloadCMS project initialized successfully"
else
    echo "✅ Existing PayloadCMS project found"

    # If running as root but project exists, switch to node user
    if [ "$(id -u)" = "0" ]; then
        echo "👤 Switching to node user..."
        chown -R node:node /app
        exec su-exec node "$0" "$@"
    fi
fi

# Now running as node user - ensure pnpm is available
if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 Setting up pnpm for node user..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# Ensure public/media directories exist with proper permissions
echo "📁 Ensuring media directories exist..."
if [ ! -d "public/media" ]; then
    echo "📁 Creating public/media directory..."
    mkdir -p public/media
fi
if [ ! -d "/public/media" ]; then
    echo "📁 Creating /public/media directory..."
    mkdir -p /public/media
fi
chown -R node:node public /public 2>/dev/null || true

# Merge additional dependencies for content generator tools
echo "🔧 Merging additional dependencies for content generator..."
if [ -f "/app/toolsDependencies/package-additions.json" ]; then
    # Use Node.js to merge package.json dependencies
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const additions = JSON.parse(fs.readFileSync('/app/toolsDependencies/package-additions.json', 'utf8'));

    // Merge dependencies
    pkg.dependencies = { ...pkg.dependencies, ...additions.dependencies };
    pkg.devDependencies = { ...pkg.devDependencies, ...additions.devDependencies };
    pkg.scripts = { ...pkg.scripts, ...additions.scripts };

    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('✅ Merged content generator dependencies and scripts');
    "
else
    echo "⚠️  Content generator dependencies not found, tools may not work"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Optimize dependencies and resolve warnings
echo "🔄 Updating dependencies and resolving warnings..."
pnpm update

# Fix security vulnerabilities
echo "🔒 Auditing and fixing security issues..."
pnpm audit --fix || echo "⚠️  Some audit fixes may require manual intervention"

# Update browser compatibility data
echo "🌐 Updating browser compatibility database..."
npx update-browserslist-db@latest || echo "⚠️  Browserslist update completed with warnings"

# Remove existing sharp and install platform-specific version
echo "🔧 Installing sharp for Alpine Linux (linuxmusl-x64)..."
pnpm remove sharp || true
npm install --platform=linuxmusl --arch=x64 sharp

# Build and start content generator tools
echo "🔧 Building content generator tools..."
if [ -d "tools/payloadcms-content-generator" ]; then
    cd tools/payloadcms-content-generator

    # Apply server fixes for TypeScript compatibility
    echo "🔧 Applying server fixes..."
    if [ -f "/app/toolsFixes/server-fixed.ts" ]; then
        cp /app/toolsFixes/server-fixed.ts server.ts
        echo "✅ Applied server TypeScript fixes - property names corrected"
    else
        echo "⚠️  Server fix not found, may have TypeScript property errors"
    fi

    # Build TypeScript to JavaScript
    echo "📦 Building TypeScript tools..."
    npm run build || echo "⚠️  Tool build failed, using ts-node fallback"

    # Start Express API server in background
    echo "🚀 Starting content generator API server on port 3001..."
    if [ -f "dist/server.js" ]; then
        nohup node dist/server.js > server.log 2>&1 &
        API_SERVER_PID=$!
        echo "✅ Content generator API server started (PID: $API_SERVER_PID)"
    else
        echo "🔄 Using ts-node fallback for API server..."
        nohup npx ts-node --esm server.ts > server.log 2>&1 &
        API_SERVER_PID=$!
        echo "✅ Content generator API server started with ts-node (PID: $API_SERVER_PID)"
    fi

    # Wait a moment for server to start
    sleep 2

    # Test server health
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ Content generator API server is healthy"
        echo "🔗 n8n endpoint ready: http://payloadcms-app:3001/api/create-post"
    else
        echo "⚠️  Content generator API server health check failed"
        echo "📋 Check server.log for details"
    fi

    cd /app
else
    echo "⚠️  Content generator tools directory not found"
fi

# Start development server
echo "🚀 Starting PayloadCMS development server..."
exec pnpm dev