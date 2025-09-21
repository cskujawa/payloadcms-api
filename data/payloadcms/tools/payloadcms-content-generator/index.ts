#!/usr/bin/env node

// Main entry point for PayloadCMS Content Generator MCP Tool

import {
  payloadcms_create_post_from_json,
  payloadcms_get_status,
  payloadcms_test_tool,
  PayloadCMSContentGeneratorTool
} from './mcp-tool.js';

import { PostCreationRequest, ContentGeneratorResult } from './types.js';
import { JSONProcessor } from './json-processor.js';

/**
 * Command line interface for the tool
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
PayloadCMS Content Generator MCP Tool

Usage:
  node index.js create-json <json-file>       Create post from JSON data contract
  node index.js create-json --stdin           Create post from JSON via stdin
  node index.js status                        Get tool status
  node index.js test                          Test tool functionality

JSON Data Contract Format:
  {
    "title": "Post Title",
    "slug": "optional-custom-slug",
    "meta": {
      "title": "SEO Title",
      "description": "SEO Description"
    },
    "blocks": [
      {
        "type": "heading",
        "content": "Section Title",
        "metadata": { "level": "h2" }
      },
      {
        "type": "paragraph",
        "content": "Paragraph content"
      },
      {
        "type": "code",
        "content": "console.log('hello');",
        "metadata": { "language": "javascript", "blockName": "Example" }
      },
      {
        "type": "banner",
        "content": "Important note",
        "metadata": { "style": "warning" }
      }
    ],
    "categories": ["Category1", "Category2"],
    "heroImage": true
  }

Examples:
  node index.js create-json post-data.json
  echo '{"title":"Test","meta":{"title":"Test","description":"Test"},"blocks":[]}' | node index.js create-json --stdin
    `);
    process.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'create-json':
        await handleCreateJSON(args.slice(1));
        break;
      case 'status':
        await handleStatus();
        break;
      case 'test':
        await handleTest();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Available commands: create-json, status, test');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Handle create-json command
 */
async function handleCreateJSON(args: string[]) {
  let jsonData: string;

  if (args.length === 0) {
    console.error('Error: JSON file path or --stdin is required for create-json command');
    process.exit(1);
  }

  try {
    if (args[0] === '--stdin') {
      // Read from stdin
      const chunks: Buffer[] = [];

      for await (const chunk of process.stdin) {
        chunks.push(chunk);
      }

      jsonData = Buffer.concat(chunks).toString('utf8');
    } else {
      // Read from file
      const fs = await import('fs/promises');
      const filePath = args[0];

      try {
        jsonData = await fs.readFile(filePath, 'utf8');
      } catch (error) {
        console.error(`Error: Could not read file "${filePath}"`);
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    }

    // Parse JSON
    let request: PostCreationRequest;
    try {
      request = JSON.parse(jsonData);
    } catch (error) {
      console.error('Error: Invalid JSON format');
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }

    console.log('🚀 Creating PayloadCMS post from JSON...');
    console.log(`Title: "${request.title}"`);

    if (request.categories && request.categories.length > 0) {
      console.log(`Categories: ${request.categories.join(', ')}`);
    }

    console.log(`Blocks: ${request.blocks.length} content blocks`);
    console.log('');

    const result = await payloadcms_create_post_from_json(request);

    if (result.success) {
      console.log('✅ Post created successfully!');
      console.log(`Title: ${result.title}`);
      console.log(`Slug: ${result.slug}`);
      console.log(`Post ID: ${result.post_id}`);
      console.log(`Admin URL: ${result.admin_url}`);
      if (result.public_url) {
        console.log(`Public URL: ${result.public_url}`);
      }
    } else {
      console.log('❌ Failed to create post');
      console.log(`Error: ${result.error}`);
      if (result.details) {
        console.log(`Details: ${result.details}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('Error processing JSON input:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}


/**
 * Handle status command
 */
async function handleStatus() {
  console.log('📊 PayloadCMS Content Generator Status\n');

  const status = await payloadcms_get_status();

  console.log('Configuration:');
  console.log(`  Base URL: ${status.config.base_url}`);
  console.log(`  Admin Email: ${status.config.admin_email}`);
  console.log(`  Connection: ${status.connection ? '✅ Connected' : '❌ Not Connected'}`);
  console.log('');

  console.log('Validation:');
  console.log(`  Valid: ${status.validation.valid ? '✅ Yes' : '❌ No'}`);

  if (status.validation.errors.length > 0) {
    console.log('  Errors:');
    status.validation.errors.forEach((error: string) => console.log(`    - ${error}`));
  }

  if (status.validation.warnings.length > 0) {
    console.log('  Warnings:');
    status.validation.warnings.forEach((warning: string) => console.log(`    - ${warning}`));
  }

  console.log('');

  console.log('Environment:');
  console.log(`  Working Directory: ${status.environment.cwd}`);
  console.log(`  .env file: ${status.environment.files.env_exists ? '✅ Found' : '❌ Not Found'}`);
  console.log(`  docker-compose.yaml: ${status.environment.files.docker_compose_exists ? '✅ Found' : '❌ Not Found'}`);
  console.log('');

  console.log('Environment Variables:');
  Object.entries(status.environment.env_vars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
}

/**
 * Handle test command
 */
async function handleTest() {
  console.log('🧪 Testing PayloadCMS Content Generator...\n');

  const result = await payloadcms_test_tool();

  if (result.success) {
    console.log('✅ Test completed successfully!');
    console.log(`Created test post: ${result.title}`);
    console.log(`Post ID: ${result.post_id}`);
    console.log(`Admin URL: ${result.admin_url}`);
  } else {
    console.log('❌ Test failed');
    console.log(`Error: ${result.error}`);
    if (result.details) {
      console.log(`Details: ${result.details}`);
    }
    process.exit(1);
  }
}

// Export functions for MCP usage
export {
  payloadcms_create_post_from_json,
  payloadcms_get_status,
  payloadcms_test_tool,
  PayloadCMSContentGeneratorTool
};

// Run main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}