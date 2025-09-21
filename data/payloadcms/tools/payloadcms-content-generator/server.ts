#!/usr/bin/env node

// HTTP server for PayloadCMS Content Generator
// Exposes REST API endpoint for n8n integration

import express from 'express';
import cors from 'cors';
import { payloadcms_create_post_from_json, payloadcms_get_status } from './mcp-tool.js';
import { PostCreationRequest } from './types.js';

const app = express();
const PORT = parseInt(process.env.PAYLOADCMS_TOOL_PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'PayloadCMS Content Generator',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = await payloadcms_get_status();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Main content creation endpoint
app.post('/api/create-post', async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);

  try {
    console.log(`🚀 [${requestId}] Incoming request to /api/create-post`);
    console.log(`📥 [${requestId}] Request headers:`, {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'content-length': req.headers['content-length']
    });

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.log(`❌ [${requestId}] Invalid request body:`, typeof req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Request body must be a valid JSON object',
        requestId
      });
    }

    console.log(`📝 [${requestId}] Request body structure:`, {
      title: req.body.title ? `"${req.body.title}"` : 'missing',
      meta: req.body.meta ? 'present' : 'missing',
      blocks: Array.isArray(req.body.blocks) ? `${req.body.blocks.length} blocks` : 'invalid',
      categories: req.body.categories ? `${req.body.categories.length} categories` : 'none',
      heroImage: req.body.heroImage || 'not specified'
    });

    // Log block details for debugging
    if (Array.isArray(req.body.blocks)) {
      console.log(`🧱 [${requestId}] Block breakdown:`);
      req.body.blocks.forEach((block: any, index: number) => {
        console.log(`   [${index}] ${block.type}: "${block.content?.substring(0, 50)}${block.content?.length > 50 ? '...' : ''}"`,
          block.metadata ? `(metadata: ${Object.keys(block.metadata).join(', ')})` : '');
      });
    }

    const request: PostCreationRequest = req.body;

    // Basic validation
    if (!request.title || typeof request.title !== 'string') {
      console.log(`❌ [${requestId}] Title validation failed:`, request.title);
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid title',
        details: 'Title is required and must be a string',
        requestId
      });
    }

    if (!request.meta || !request.meta.title || !request.meta.description) {
      console.log(`❌ [${requestId}] Meta validation failed:`, request.meta);
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid meta data',
        details: 'Meta object with title and description is required',
        requestId
      });
    }

    if (!Array.isArray(request.blocks)) {
      console.log(`❌ [${requestId}] Blocks validation failed:`, typeof request.blocks);
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid blocks',
        details: 'Blocks must be an array',
        requestId
      });
    }

    console.log(`🚀 [${requestId}] Creating PayloadCMS post via HTTP API...`);
    console.log(`📋 [${requestId}] Title: "${request.title}"`);
    console.log(`📋 [${requestId}] Blocks: ${request.blocks.length} content blocks`);
    console.log(`📋 [${requestId}] Meta: title="${request.meta.title}", description="${request.meta.description.substring(0, 100)}..."`);

    if (request.categories && request.categories.length > 0) {
      console.log(`📋 [${requestId}] Categories: ${request.categories.join(', ')}`);
    }

    // Create the post
    console.log(`⚙️ [${requestId}] Calling payloadcms_create_post_from_json...`);
    const result = await payloadcms_create_post_from_json(request);

    if (result.success) {
      console.log(`✅ [${requestId}] Post created successfully: ${result.title}`);
      console.log(`🔗 [${requestId}] Admin URL: ${result.admin_url}`);
      console.log(`🌐 [${requestId}] Public URL: ${result.public_url}`);
      res.json({ ...result, requestId });
    } else {
      console.log(`❌ [${requestId}] Failed to create post: ${result.error}`);
      console.log(`📄 [${requestId}] Error details:`, result.details);
      res.status(400).json({ ...result, requestId });
    }

  } catch (error) {
    console.error(`💥 [${requestId}] Server error:`, error);
    console.error(`💥 [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      requestId
    });
  }
});

// Debug endpoint for testing JSON validation
app.post('/api/debug/validate-json', (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);

  try {
    console.log(`🔍 [${requestId}] Debug validation request`);

    // Log the raw request body
    console.log(`📥 [${requestId}] Raw request body:`, JSON.stringify(req.body, null, 2));

    // Import validation function
    const { JSONProcessor } = require('./json-processor.js');
    const validation = JSONProcessor.validatePostCreationRequest(req.body);

    console.log(`📊 [${requestId}] Validation result:`, validation);

    res.json({
      success: true,
      requestId,
      validation,
      originalData: req.body,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Debug validation error:`, error);
    res.status(500).json({
      success: false,
      error: 'Debug validation failed',
      details: error instanceof Error ? error.message : String(error),
      requestId
    });
  }
});

// Debug endpoint for testing Lexical conversion
app.post('/api/debug/convert-lexical', (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 15);

  try {
    console.log(`🔄 [${requestId}] Debug Lexical conversion request`);

    const { JSONProcessor } = require('./json-processor.js');
    const processedData = JSONProcessor.processPostCreationRequest(req.body);

    console.log(`📄 [${requestId}] Processed data:`, JSON.stringify(processedData, null, 2));

    res.json({
      success: true,
      requestId,
      originalData: req.body,
      processedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`💥 [${requestId}] Debug conversion error:`, error);
    res.status(500).json({
      success: false,
      error: 'Debug conversion failed',
      details: error instanceof Error ? error.message : String(error),
      requestId
    });
  }
});

// Sample data endpoint for testing
app.get('/api/debug/sample-request', (req, res) => {
  const sampleRequest = {
    title: "Debug Test Post",
    meta: {
      title: "Debug Test Post - SEO Title",
      description: "This is a sample post for debugging the PayloadCMS content generator."
    },
    blocks: [
      {
        type: "heading",
        content: "Introduction",
        metadata: { level: "h2" }
      },
      {
        type: "paragraph",
        content: "This is a sample paragraph for testing purposes."
      },
      {
        type: "code",
        content: "console.log('Hello World');",
        metadata: {
          language: "javascript",
          blockName: "Sample Code"
        }
      },
      {
        type: "banner",
        content: "This is a test banner for debugging.",
        metadata: {
          style: "info",
          blockName: "Debug Banner"
        }
      }
    ],
    categories: ["Debug", "Testing"],
    heroImage: true
  };

  res.json({
    success: true,
    sampleRequest,
    usage: "POST this data to /api/create-post or /api/debug/validate-json",
    timestamp: new Date().toISOString()
  });
});

// Handle 404s
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    details: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    available_endpoints: {
      'GET /health': 'Health check',
      'GET /api/status': 'Tool status and configuration',
      'POST /api/create-post': 'Create PayloadCMS post from JSON data contract'
    }
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Unhandled server error',
    details: error.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 PayloadCMS Content Generator HTTP API');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Endpoints available:`);
  console.log(`   GET  /health           - Health check`);
  console.log(`   GET  /api/status       - Tool status`);
  console.log(`   POST /api/create-post  - Create post from JSON`);
  console.log('');
  console.log('🔌 Ready for n8n integration!');
  console.log(`   n8n HTTP Request URL: http://payloadcms-app:${PORT}/api/create-post`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});