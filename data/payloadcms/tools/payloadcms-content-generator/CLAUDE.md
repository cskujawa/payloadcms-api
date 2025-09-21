# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based Model Context Protocol (MCP) tool for creating PayloadCMS posts from structured JSON data contracts. The tool accepts pre-generated content structures from external AI services (like Ollama via n8n) and converts them into properly formatted PayloadCMS posts using the Lexical editor format and API structure.

**Key Design Philosophy**: This tool focuses purely on PayloadCMS post creation and formatting, not content generation. It's designed to work seamlessly with external AI services that generate intelligent content layouts using the defined JSON data contract.

## Core Development Commands

### Build and Development
```bash
# Build TypeScript to JavaScript
npm run build

# Start the CLI tool directly (development)
npm run dev

# Run the built version
npm start

# Run tests
npm test
```

### Content Creation Commands
```bash
# Create post from JSON file
node dist/index.js create-json post-data.json

# Create post from JSON via stdin (ideal for n8n integration)
echo '{"title":"Post Title","meta":{"title":"SEO Title","description":"Description"},"blocks":[...]}' | node dist/index.js create-json --stdin

# Get tool status and configuration
node dist/index.js status

# Run functionality test
node dist/index.js test

# Legacy prompt-based creation (deprecated)
node dist/index.js create "Your prompt here" [options]
```

### JSON Data Contract Format
The tool accepts structured JSON input with this schema:
```typescript
interface PostCreationRequest {
  title: string;
  slug?: string;
  meta: {
    title: string;
    description: string;
  };
  blocks: ContentBlock[];
  categories?: string[];
  heroImage?: boolean;
}

interface ContentBlock {
  type: 'paragraph' | 'heading' | 'code' | 'banner' | 'mediaBlock';
  content: string;
  metadata?: {
    language?: string;    // for code blocks
    level?: 'h2' | 'h3'; // for headings
    style?: 'info' | 'warning' | 'error' | 'success'; // for banners
    blockName?: string;   // optional block name
  };
}
```

## Architecture Overview

### Module Structure
The tool is organized into focused TypeScript modules:

- **`index.ts`**: CLI entry point with argument parsing and command routing
- **`mcp-tool.ts`**: MCP tool interface and main API functions
- **`json-processor.ts`**: Core JSON data contract processing and Lexical formatting
- **`payload-client.ts`**: PayloadCMS HTTP API client with authentication
- **`config.ts`**: Configuration management and auto-detection
- **`types.ts`**: Comprehensive TypeScript type definitions including JSON data contract
- **`test.ts`**: Test runner for functionality validation

### Key Design Patterns

#### **JSON Processing Pipeline**
1. **JSON Validation**: Validate input against PostCreationRequest schema
2. **Lexical Conversion**: Convert ContentBlocks to PayloadCMS Lexical format
3. **Enhancement**: Add author, hero images, and process media blocks
4. **Post Creation**: Submit structured data to PayloadCMS API

#### **PayloadCMS Integration**
1. **JWT Authentication**: Programmatic login with environment credentials
2. **Draft Creation**: Posts created as drafts for manual review and publishing
3. **Media Assignment**: Automatic hero image and media block population from demo assets
4. **URL Generation**: Return both admin and public URLs for created posts

#### **Configuration System**
- **Auto-detection**: Finds PayloadCMS URL from multiple sources (env vars, .env file, docker-compose.yaml)
- **Credential Management**: Reads from environment variables with fallback defaults
- **Validation**: Tests connectivity and reports configuration issues

### TypeScript Architecture

#### **Core Types** (`types.ts`)
- `PostCreationRequest`: JSON data contract input format
- `ContentBlock`: Individual content block structure
- `ContentGeneratorParams`: Legacy prompt-based parameters (deprecated)
- `ContentGeneratorResult`: Response format with success/error states
- `LexicalNode`/`LexicalRoot`: Lexical editor JSON structure
- `PayloadCMSPost`/`PayloadCMSMedia`/`PayloadCMSUser`: API response types

#### **Block System Types**
- `BannerBlock`: Info/warning/error/success notifications
- `CodeBlock`: Syntax-highlighted code examples with language specification
- `MediaBlock`: Image/video embedding with automatic media assignment

#### **Content Structure**
Posts are created with:
- Draft status for manual review workflow
- Lexical editor content (structured JSON from blocks)
- SEO metadata (title, description)
- Author assignment (automatic from default user)
- Hero image assignment (optional, from demo media)
- Slug generation (automatic or custom)
- Categories skipped (for manual assignment during review)

### Error Handling Strategy

#### **Layered Error Management**
1. **JSON Validation Errors**: Schema validation with detailed field-level messages
2. **Configuration Errors**: Clear messages for setup issues
3. **Authentication Errors**: JWT token and credential problems
4. **API Errors**: PayloadCMS validation and HTTP issues
5. **Block Processing Errors**: Lexical structure and formatting problems

#### **Graceful Degradation**
- Uses default demo credentials if environment variables not set
- Auto-detects PayloadCMS URL from multiple sources
- Provides detailed status reporting for troubleshooting
- Creates draft posts to avoid publishing incomplete content

### Environment Configuration

#### **Required Environment Variables**
```bash
PAYLOADCMS_TOOL_EMAIL="admin@example.com"
PAYLOADCMS_TOOL_PASSWORD="password"
```

#### **Optional Override Variables**
```bash
PAYLOADCMS_URL="http://localhost:3000"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
```

#### **Auto-Detection Sources**
1. Environment variables (highest priority)
2. `.env` file parsing
3. `docker-compose.yaml` port mapping
4. Default localhost:3000 (fallback)

## Development Workflow

### Building and Testing
```bash
# Full build and test cycle
npm run build && npm test

# Development with type checking
npm run dev

# Test specific functionality
node dist/index.js test

# Test JSON processing
echo '{"title":"Test","meta":{"title":"Test","description":"Test"},"blocks":[{"type":"paragraph","content":"Test content"}]}' | node dist/index.js create-json --stdin
```

### Adding New Features

#### **New Block Types**
1. Add block type to `ContentBlock` interface in `types.ts`
2. Add creation logic in `json-processor.ts`
3. Update Lexical formatting functions
4. Update validation in `validatePostCreationRequest`

#### **New API Methods**
1. Add method to `payload-client.ts`
2. Include proper error handling and typing
3. Update authentication flow if needed

#### **New Validation Rules**
1. Extend `validatePostCreationRequest` in `json-processor.ts`
2. Add specific field validation logic
3. Include clear error messages for debugging

### JSON Data Contract Evolution

#### **Block Type Development**
Currently supported block types:
- **heading**: H2/H3 section headers with configurable levels
- **paragraph**: Standard text content blocks
- **code**: Syntax-highlighted code with language specification
- **banner**: Styled notification blocks (info/warning/error/success)
- **mediaBlock**: Embedded media with automatic asset assignment

#### **Metadata Extension**
Each block type supports optional metadata for customization:
- Code blocks: `language`, `blockName`
- Headings: `level` (h2/h3), `blockName`
- Banners: `style`, `blockName`
- Media blocks: `blockName`

## Integration Workflows

### Recommended n8n → Ollama → PayloadCMS Flow

1. **n8n HTTP Trigger**: Receives content creation request
2. **n8n → Ollama**: Sends prompt with structured system message for JSON generation
3. **Ollama Processing**: Uses llama3.1:8b to generate PostCreationRequest JSON with intelligent layout
4. **n8n → PayloadCMS Tool**: Posts JSON to `create-json --stdin` endpoint
5. **Response Handling**: Returns admin and public URLs for immediate access

### System Message Template for Ollama
```
You are a content structure expert. Create a JSON object for a PayloadCMS post using this exact schema:

{
  "title": "Engaging title based on the prompt",
  "meta": {
    "title": "SEO-optimized title (different from main title)",
    "description": "150-character SEO description"
  },
  "blocks": [
    // Intelligent mix of heading, paragraph, code, banner, and mediaBlock types
    // Use headings to structure content logically (h2 for main sections, h3 for subsections)
    // Add code blocks for technical content with appropriate language
    // Use banners for important callouts and warnings
    // Add mediaBlock where images would enhance understanding
  ],
  "categories": ["relevant", "categories"], // Note: ignored by tool, for documentation only
  "heroImage": true // Set to true for posts that would benefit from hero images
}

Guidelines:
- Create engaging, well-structured content with clear hierarchy
- Vary block types for better user engagement and readability
- Focus on practical value and clear organization
- Use appropriate banner styles (info/warning/error/success) contextually
- Include code examples for technical topics with proper language specification

User prompt: [USER_PROMPT]
```

### MCP Tool Integration

#### **Exposed Functions**
- `payloadcms_create_post_from_json`: Create posts from JSON data contract
- `payloadcms_create_post`: Legacy prompt-based creation (deprecated)
- `payloadcms_get_status`: Get configuration and connection status
- `payloadcms_test_tool`: Run comprehensive functionality test

#### **API Usage Example**
```typescript
import { payloadcms_create_post_from_json } from './mcp-tool.js';

const result = await payloadcms_create_post_from_json({
  title: "Advanced Docker Strategies",
  meta: {
    title: "Docker Best Practices Guide",
    description: "Learn advanced containerization techniques for production."
  },
  blocks: [
    {
      type: "heading",
      content: "Container Optimization",
      metadata: { level: "h2" }
    },
    {
      type: "paragraph",
      content: "Modern containerization requires careful attention to performance and security."
    },
    {
      type: "code",
      content: "FROM node:18-alpine\nWORKDIR /app",
      metadata: { language: "javascript", blockName: "Dockerfile Example" }
    }
  ],
  heroImage: true
});
```

## Language Support Expansion

### Code Block Language Support
The PayloadCMS Code block configuration has been expanded to support a comprehensive set of programming and markup languages. This expansion was made to align with common development needs and prevent validation errors during content generation.

#### **Original Support** (3 languages)
- `typescript`, `javascript`, `css`

#### **Expanded Support** (12 languages)
- **Programming**: `typescript`, `javascript`, `python`
- **Web Technologies**: `css`, `html`, `xml`
- **Shell/Scripting**: `bash`
- **Data/Config**: `json`, `yaml`
- **Infrastructure**: `dockerfile`
- **Database**: `sql`
- **Documentation**: `markdown`

#### **Configuration Files Updated**
1. **PayloadCMS Code Block**: `/src/payload/blocks/Code/config.ts`
2. **Content Generator Validation**: `json-processor.ts`
3. **System Prompt**: `system-prompt.md`

#### **Debugging Process Used**
This expansion was the result of debugging the "Content > Language field invalid" error:
1. **Enhanced logging** revealed specific language validation failures
2. **Request tracing** showed Ollama generating unsupported languages
3. **Source analysis** identified PayloadCMS configuration limitations
4. **Systematic expansion** of supported languages to match common usage

## Enhanced Logging and Debugging

### Server Logging Features
The HTTP server (running on port 3001) provides detailed request tracking:

- **Request IDs**: Each request gets a unique ID for tracing through logs
- **Request structure logging**: Headers, body structure, and block breakdowns
- **Validation logging**: Detailed field-level validation results
- **PayloadCMS API response logging**: Captures API validation errors
- **Error stack traces**: Full error details for debugging

### Debug Endpoints

#### **GET /api/debug/sample-request**
Returns a sample JSON request for testing:
```bash
curl http://localhost:3001/api/debug/sample-request
```

#### **POST /api/debug/validate-json**
Tests JSON validation without creating posts:
```bash
curl -X POST http://localhost:3001/api/debug/validate-json \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","meta":{"title":"Test","description":"Test"},"blocks":[]}'
```

#### **POST /api/debug/convert-lexical**
Tests Lexical conversion without PayloadCMS API calls:
```bash
curl -X POST http://localhost:3001/api/debug/convert-lexical \
  -H "Content-Type: application/json" \
  -d @sample-post.json
```

### Field Mapping Requirements

#### **Code Blocks**
PayloadCMS Code blocks support a comprehensive set of programming and markup languages:
- **Supported languages**: `typescript`, `javascript`, `css`, `html`, `python`, `bash`, `json`, `yaml`, `dockerfile`, `sql`, `markdown`, `xml`
- **Field mapping**: Uses `code` field for content, `language` as separate field
- **Automatic language validation**: Invalid languages default to `javascript`
- **Syntax highlighting**: PayloadCMS admin provides syntax highlighting for all supported languages

Example:
```json
{
  "type": "code",
  "content": "console.log('Hello');",
  "metadata": {
    "language": "javascript",
    "blockName": "Sample Code"
  }
}
```

#### **Banner Blocks**
Banner blocks use Lexical rich text format:
- **Supported styles**: `info`, `warning`, `error`, `success`
- **Content structure**: Wrapped in Lexical paragraph nodes
- **Field mapping**: `content` contains Lexical JSON, `style` as separate field

#### **Heading Blocks**
- **Supported levels**: `h2`, `h3` only
- **Level validation**: Invalid levels default to `h2`

### Monitoring and Log Analysis

#### **Real-time Server Logs**
Monitor the content generator server:
```bash
# Follow logs in Docker container
docker compose logs -f payloadcms-app | grep -E "\[(.*)\]|ERROR|WARN"

# Monitor specific process
docker compose exec payloadcms-app ps aux | grep server.ts
```

#### **PayloadCMS API Error Patterns**
Common validation errors from PayloadCMS:
- `"Content > Content, Content > Language"`: Code block field mapping issue
- `"required field missing"`: Missing required block fields
- `"invalid field type"`: Incorrect Lexical structure

#### **Request Tracing**
Each request gets a unique ID for tracing:
1. Look for `🚀 [requestId]` in logs for request start
2. Follow `📝 [requestId]` for structure analysis
3. Check `❌ [requestId]` for validation failures
4. Track `⚙️ [requestId]` for PayloadCMS API calls

### Testing Workflow

#### **Full Integration Test**
1. **Get sample data**: `GET /api/debug/sample-request`
2. **Validate JSON**: `POST /api/debug/validate-json` with sample data
3. **Test conversion**: `POST /api/debug/convert-lexical` with sample data
4. **Create post**: `POST /api/create-post` with sample data
5. **Check logs**: Monitor for request ID and any errors

#### **n8n Integration Testing**
For testing the full n8n → Ollama → PayloadCMS workflow:

1. **Test Python parser** with known Ollama output
2. **Test API endpoint** with parsed data
3. **Monitor logs** for field validation issues
4. **Check PayloadCMS admin** for successful post creation

### Common Issues and Solutions

#### **Language Validation Errors**
```
Error: "Content > Language" field invalid
```
**Solution**: Ensure code block languages are one of the supported values: `typescript`, `javascript`, `css`, `html`, `python`, `bash`, `json`, `yaml`, `dockerfile`, `sql`, `markdown`, `xml`

#### **Block Structure Errors**
```
Error: "Content > Content" field invalid
```
**Solution**: Code blocks should not have `blockName` field in the Lexical structure

#### **Authentication Errors**
```
Error: JWT token invalid or expired
```
**Solution**: Check `PAYLOADCMS_TOOL_EMAIL` and `PAYLOADCMS_TOOL_PASSWORD` environment variables

### Troubleshooting

### Common Build Issues
- **TypeScript errors**: Run `npm run build` to see compilation issues
- **Module resolution**: Ensure ES modules are properly configured
- **Missing dependencies**: Run `npm install` for development dependencies

### Runtime Issues
- **JSON validation errors**: Use debug endpoints to test validation
- **Authentication failures**: Check credentials with `node dist/index.js status`
- **Connection problems**: Verify PayloadCMS is running and accessible
- **Block creation errors**: Verify supported block types and metadata structure
- **Field mapping errors**: Use `/api/debug/convert-lexical` to test Lexical conversion

### Configuration Debugging
```bash
# Check current configuration
node dist/index.js status

# Test with sample JSON
echo '{"title":"Test","meta":{"title":"Test","description":"Test"},"blocks":[]}' | node dist/index.js create-json --stdin

# Run built-in test
node dist/index.js test

# Test HTTP server endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/debug/sample-request
```

### Advanced Debugging

#### **Direct PayloadCMS API Testing**
Test PayloadCMS API directly:
```bash
# Login and get JWT
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Create post with JWT
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d @converted-lexical-data.json
```

#### **Lexical Structure Validation**
The Lexical editor expects specific JSON structure. Use the debug endpoints to validate:
1. Input JSON → `/api/debug/validate-json`
2. Converted Lexical → `/api/debug/convert-lexical`
3. Final API call → `/api/create-post`

## Important Notes

- **Draft Workflow**: All posts created as drafts for manual review and publishing
- **Category Management**: Categories intentionally skipped during creation for manual assignment
- **ES Modules**: Uses `"type": "module"` in package.json
- **Node.js Requirements**: Requires Node.js >=18.0.0
- **TypeScript Target**: Compiled to ES2022 target
- **Build Output**: Builds to `./dist` directory with type declarations
- **Development Execution**: Uses ts-node for development execution
- **API Integration**: All interactions use fetch with proper error handling
- **Media Handling**: Automatically assigns demo media for hero images and media blocks