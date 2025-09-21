# PayloadCMS Content Generator

A streamlined tool for creating PayloadCMS posts from structured JSON data contracts. Features both CLI and HTTP API interfaces, designed to work seamlessly with external AI services (like Ollama via n8n) for intelligent content generation and layout.

## ✨ Features

- **🎯 JSON Data Contract**: Accepts structured JSON input for precise content control
- **🌐 HTTP API**: REST API endpoint for seamless n8n integration
- **🖥️ CLI Interface**: Command-line tool for direct usage and testing
- **🤖 AI-Friendly**: Designed for integration with AI services (Ollama, ChatGPT, etc.)
- **🔗 Full PayloadCMS Integration**: Direct API integration with authentication
- **📝 Draft Workflow**: Creates posts as drafts for manual review and publishing
- **🖼️ Media Integration**: Uses existing demo media for hero images and blocks
- **👤 Author Assignment**: Automatically links posts with configured authors
- **⚙️ Environment-Based Configuration**: Zero-config setup in PayloadCMS Docker environment

## ⚠️ Prerequisites

**Database Seeding Required**: The content generator requires a seeded PayloadCMS database to function properly. The tool relies on:
- **Demo media assets** for hero images and media blocks
- **Seeded user accounts** for post author assignment
- **Demo categories** for content organization
- **Reference content** for rich automated post creation

**Setup Steps:**
1. Complete PayloadCMS setup and admin user creation
2. **Seed the database** via the admin dashboard (follow the seeding instructions)
3. Verify seeding completed successfully before using content generation

## 🚀 Quick Start

### 1. HTTP API (Recommended for n8n)

```bash
# Start the HTTP server
docker compose exec payloadcms-app npm run start:server --prefix /app/tools/payloadcms-content-generator

# The API will be available at:
# http://payloadcms-app:3001/api/create-post
```

### 2. CLI Usage

```bash
# Create a post from JSON file
docker compose exec payloadcms-app node /app/tools/payloadcms-content-generator/dist/index.js create-json post-data.json

# Create a post from JSON via stdin
echo '{"title":"My Post","meta":{"title":"My Post","description":"Description"},"blocks":[]}' | \
  docker compose exec -T payloadcms-app node /app/tools/payloadcms-content-generator/dist/index.js create-json --stdin
```

### 3. JSON Data Contract Format

```json
{
  "title": "Complete Guide to Docker Best Practices",
  "slug": "docker-best-practices-guide",
  "meta": {
    "title": "Docker Best Practices - Complete Guide",
    "description": "Learn Docker best practices for production deployments, security, and performance optimization."
  },
  "blocks": [
    {
      "type": "heading",
      "content": "Introduction to Docker",
      "metadata": { "level": "h2" }
    },
    {
      "type": "paragraph",
      "content": "Docker has revolutionized how we deploy and manage applications. This guide covers essential best practices for production use."
    },
    {
      "type": "code",
      "content": "FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production",
      "metadata": {
        "language": "dockerfile",
        "blockName": "Multi-stage Dockerfile Example"
      }
    },
    {
      "type": "banner",
      "content": "Always use specific base image tags in production to ensure consistency across deployments.",
      "metadata": {
        "style": "warning",
        "blockName": "Production Tip"
      }
    },
    {
      "type": "mediaBlock",
      "content": "",
      "metadata": {
        "blockName": "Docker Architecture Diagram"
      }
    }
  ],
  "categories": ["Docker", "DevOps", "Best Practices"],
  "heroImage": true
}
```

## 📚 JSON Schema Reference

### Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Post title |
| `slug` | string | ❌ | URL slug (auto-generated if not provided) |
| `meta` | object | ✅ | SEO metadata |
| `blocks` | array | ✅ | Content blocks |
| `categories` | array | ❌ | Category names (created if they don't exist) |
| `heroImage` | boolean | ❌ | Whether to assign a random demo hero image |

### Meta Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | SEO title |
| `description` | string | ✅ | SEO description |

### Content Blocks

#### Heading Block
```json
{
  "type": "heading",
  "content": "Section Title",
  "metadata": {
    "level": "h2"  // or "h3"
  }
}
```

#### Paragraph Block
```json
{
  "type": "paragraph",
  "content": "Paragraph text content with full Markdown-like formatting support."
}
```

#### Code Block
```json
{
  "type": "code",
  "content": "console.log('Hello, World!');",
  "metadata": {
    "language": "javascript",
    "blockName": "Optional block title"
  }
}
```

#### Banner Block
```json
{
  "type": "banner",
  "content": "Important notification or callout text",
  "metadata": {
    "style": "info",  // info, warning, error, success
    "blockName": "Optional block title"
  }
}
```

#### Media Block
```json
{
  "type": "mediaBlock",
  "content": "",
  "metadata": {
    "blockName": "Optional block title"
  }
}
```

## 🌐 HTTP API Reference

### Endpoints

#### Health Check
```
GET /health
```
Returns server health status and basic information.

#### Tool Status
```
GET /api/status
```
Returns PayloadCMS connection status and configuration details.

#### Create Post
```
POST /api/create-post
Content-Type: application/json

{
  "title": "Post Title",
  "meta": {
    "title": "SEO Title",
    "description": "SEO Description"
  },
  "blocks": [...],
  "categories": ["Category1"],
  "heroImage": true
}
```

### n8n Integration

**HTTP Request Node Configuration:**
- **URL**: `http://payloadcms-app:3001/api/create-post`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON data contract (from Ollama response)

**Response Format:**
```json
{
  "success": true,
  "post_id": "68d01af5162f7b698116faf2",
  "slug": "post-slug",
  "title": "Post Title",
  "admin_url": "http://localhost:3000/admin/collections/posts/68d01af5162f7b698116faf2",
  "public_url": "http://localhost:3000/posts/post-slug"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error description",
  "details": "Additional error details"
}
```

### Starting the HTTP Server

```bash
# Development mode
npm run dev:server

# Production mode
npm run build
npm run start:server

# Or with Docker
docker compose exec payloadcms-app npm run start:server --prefix /app/tools/payloadcms-content-generator
```

## 🔄 Integration Workflow

### Recommended n8n → Ollama → PayloadCMS Flow

1. **n8n HTTP Trigger**: Receives content request
2. **n8n → Ollama**: Sends prompt with structured system message
3. **Ollama Processing**: Generates JSON using the data contract
4. **n8n → PayloadCMS Tool**: Posts JSON to HTTP API endpoint
5. **Response**: Returns full article URL

### System Message Example for Ollama

```
You are a content structure expert. Create a JSON object for a PayloadCMS post using this exact schema:

{
  "title": "Engaging title based on the prompt",
  "meta": {
    "title": "SEO-optimized title",
    "description": "150-char SEO description"
  },
  "blocks": [
    // Intelligent mix of heading, paragraph, code, banner, and mediaBlock types
    // Use headings to structure content logically
    // Add code blocks for technical content
    // Use banners for important callouts
    // Add mediaBlock where images would enhance understanding
  ],
  "categories": ["relevant", "categories"],
  "heroImage": true
}

Create engaging, well-structured content. Vary block types for better user engagement. Focus on practical value and clear organization.

User prompt: [USER_PROMPT]
```

## 🛠️ Command Reference

### create-json Command

```bash
# From file
node dist/index.js create-json <json-file>

# From stdin (ideal for automation)
node dist/index.js create-json --stdin

# Examples
node dist/index.js create-json blog-post.json
echo '{"title":"Test","meta":{"title":"Test","description":"Test"},"blocks":[]}' | node dist/index.js create-json --stdin
```


### Utility Commands

```bash
# Check status and configuration
node dist/index.js status

# Test functionality
node dist/index.js test
```

## ⚙️ Configuration

### Environment Variables

```bash
# Required: PayloadCMS authentication
PAYLOADCMS_TOOL_EMAIL="your-admin@example.com"
PAYLOADCMS_TOOL_PASSWORD="your-admin-password"

# Optional: Override PayloadCMS URL (auto-detected by default)
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# Optional: HTTP server port (default: 3001)
PAYLOADCMS_TOOL_PORT="3001"
```

### Auto-Detection

The tool automatically detects PayloadCMS configuration:
- URL from environment variables or docker-compose.yaml
- Falls back to demo credentials if not configured
- Works out-of-the-box in PayloadCMS Docker environment

## 🧪 Testing

### Built-in Test

```bash
node dist/index.js test
```

### Manual JSON Test

```bash
# Create test JSON file
cat > test-post.json << 'EOF'
{
  "title": "Test Post from JSON",
  "meta": {
    "title": "Test Post",
    "description": "Testing the JSON data contract"
  },
  "blocks": [
    {
      "type": "heading",
      "content": "Test Heading",
      "metadata": { "level": "h2" }
    },
    {
      "type": "paragraph",
      "content": "This is a test paragraph to verify the JSON processing works correctly."
    },
    {
      "type": "banner",
      "content": "This is a test banner to verify block creation.",
      "metadata": { "style": "info" }
    }
  ],
  "categories": ["Testing", "JSON"],
  "heroImage": true
}
EOF

# Test the post creation
docker compose exec payloadcms-app node /app/tools/payloadcms-content-generator/dist/index.js create-json test-post.json
```

## 📝 Response Format

Successful post creation returns:

```json
{
  "success": true,
  "post_id": "65f8a2b4c1d2e3f4a5b6c7d8",
  "slug": "test-post-from-json",
  "title": "Test Post from JSON",
  "admin_url": "http://localhost:3000/admin/collections/posts/65f8a2b4c1d2e3f4a5b6c7d8",
  "public_url": "http://localhost:3000/posts/test-post-from-json"
}
```

## 🔍 Troubleshooting

### Common Issues

#### Database Not Seeded
```
Error: No media found / No users found / API request failed
```
**Solution**: Seed the PayloadCMS database with demo content:
1. Visit http://localhost:3000/admin
2. Follow the database seeding instructions on the admin dashboard
3. Verify seeding completed successfully
4. Retry content generation

#### JSON Validation Errors
```
Error: Invalid JSON input
```
**Solution**: Check JSON syntax and ensure all required fields are present.

#### Authentication Errors
```
Error: Could not connect to PayloadCMS Local API
```
**Solution**: Verify PayloadCMS is running and credentials are correct:
```bash
node dist/index.js status
```

#### File Not Found
```
Error: Could not read file "filename.json"
```
**Solution**: Check file path and permissions.

### Debug Mode

For detailed error information:
```bash
# Check current configuration
node dist/index.js status

# Test with sample data
node dist/index.js test
```

## 🔗 API Integration

### MCP Functions

```javascript
import { payloadcms_create_post_from_json } from './mcp-tool.js';

const result = await payloadcms_create_post_from_json({
  title: "API Generated Post",
  meta: {
    title: "API Post",
    description: "Generated via API"
  },
  blocks: [
    {
      type: "paragraph",
      content: "This post was created via the API."
    }
  ],
  categories: ["API", "Automation"],
  heroImage: true
});

if (result.success) {
  console.log(`Post created: ${result.public_url}`);
}
```

### HTTP Integration Example

```bash
# Direct HTTP request to the API
curl -X POST "http://payloadcms-app:3001/api/create-post" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Docker Security Best Practices",
    "meta": {
      "title": "Docker Security - Complete Guide",
      "description": "Learn essential Docker security practices for production deployments"
    },
    "blocks": [
      {
        "type": "heading",
        "content": "Container Security Fundamentals",
        "metadata": { "level": "h2" }
      },
      {
        "type": "paragraph",
        "content": "Securing Docker containers requires a multi-layered approach covering image security, runtime protection, and network isolation."
      }
    ],
    "categories": ["Docker", "Security"],
    "heroImage": true
  }'
```

## 📊 Success Metrics

A successful run produces:
- ✅ Valid JSON schema validation
- ✅ PayloadCMS post creation with proper structure
- ✅ Category creation and assignment
- ✅ Media assignment (if requested)
- ✅ SEO metadata population
- ✅ Both admin and public URLs returned

## 🤝 Contributing

1. Edit TypeScript source files
2. Run `npm run build` to compile
3. Test with `node dist/index.js test`
4. Verify JSON processing with sample data

## 📄 License

MIT License - Part of the PayloadCMS Docker setup project.