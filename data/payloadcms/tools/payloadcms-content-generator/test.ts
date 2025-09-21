// Test script for PayloadCMS Content Generator

import { PayloadCMSContentGeneratorTool } from './mcp-tool.js';
import { PostCreationRequest } from './types.js';

async function runTests() {
  console.log('🧪 PayloadCMS Content Generator Tests\n');

  const tool = new PayloadCMSContentGeneratorTool();

  // Test 1: Get Status
  console.log('Test 1: Getting tool status...');
  try {
    const status = await tool.getStatus();
    console.log('✅ Status retrieved successfully');
    console.log(`Connection: ${status.connection ? 'Connected' : 'Not Connected'}`);
    console.log(`Base URL: ${status.config.base_url}\n`);
  } catch (error) {
    console.log('❌ Status test failed:', error);
  }

  // Test 2: Create a simple post from JSON
  console.log('Test 2: Creating a simple post from JSON...');
  try {
    const simpleRequest: PostCreationRequest = {
      title: 'Simple Test Post - Web Development Guide',
      meta: {
        title: 'Web Development Guide for Beginners',
        description: 'A comprehensive guide to getting started with web development'
      },
      blocks: [
        {
          type: 'heading',
          content: 'Getting Started with Web Development',
          metadata: { level: 'h2' }
        },
        {
          type: 'paragraph',
          content: 'Web development is an exciting field that combines creativity and technical skills to build websites and applications.'
        },
        {
          type: 'banner',
          content: 'This is a test post created to verify the JSON-based content generation.',
          metadata: { style: 'info' }
        }
      ],
      categories: ['Web Development', 'Beginner'],
      heroImage: true
    };

    const result1 = await tool.createPostFromJSON(simpleRequest);
    if (result1.success) {
      console.log('✅ Simple post created successfully');
      console.log(`Title: ${result1.title}`);
      console.log(`Slug: ${result1.slug}\n`);
    } else {
      console.log('❌ Simple post creation failed:', result1.error);
    }
  } catch (error) {
    console.log('❌ Simple post test failed:', error);
  }

  // Test 3: Create a technical post with code blocks
  console.log('Test 3: Creating a technical post with code blocks...');
  try {
    const technicalRequest: PostCreationRequest = {
      title: 'Advanced Docker Strategies for Microservices',
      meta: {
        title: 'Docker Containerization for Microservices Architecture',
        description: 'Learn advanced Docker techniques for building and deploying microservices at scale'
      },
      blocks: [
        {
          type: 'heading',
          content: 'Docker Best Practices',
          metadata: { level: 'h2' }
        },
        {
          type: 'paragraph',
          content: 'Implementing microservices with Docker requires careful consideration of container design, networking, and orchestration.'
        },
        {
          type: 'code',
          content: 'FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]',
          metadata: {
            language: 'dockerfile',
            blockName: 'Optimized Dockerfile'
          }
        },
        {
          type: 'banner',
          content: 'Always use specific image tags in production to ensure consistency.',
          metadata: { style: 'warning' }
        },
        {
          type: 'mediaBlock',
          content: '',
          metadata: {
            blockName: 'Docker Architecture Diagram'
          }
        }
      ],
      categories: ['Docker', 'DevOps', 'Microservices'],
      heroImage: true
    };

    const result2 = await tool.createPostFromJSON(technicalRequest);
    if (result2.success) {
      console.log('✅ Technical post created successfully');
      console.log(`Title: ${result2.title}`);
      console.log(`Admin URL: ${result2.admin_url}\n`);
    } else {
      console.log('❌ Technical post creation failed:', result2.error);
    }
  } catch (error) {
    console.log('❌ Technical post test failed:', error);
  }

  // Test 4: Test JSON validation
  console.log('Test 4: Testing JSON validation...');
  try {
    const invalidRequest: any = {
      title: '', // Empty title should fail
      meta: {
        title: 'Test',
        description: 'Test description'
      },
      blocks: []
    };

    const result3 = await tool.createPostFromJSON(invalidRequest);
    if (!result3.success && result3.error?.includes('Invalid')) {
      console.log('✅ JSON validation working correctly');
    } else {
      console.log('❌ JSON validation failed - should have rejected invalid input');
    }
  } catch (error) {
    console.log('❌ JSON validation test failed:', error);
  }

  // Test 5: Use the built-in test function
  console.log('Test 5: Running built-in test function...');
  try {
    const testResult = await tool.test();
    if (testResult.success) {
      console.log('✅ Built-in test passed');
      console.log(`Test post: ${testResult.title}`);
    } else {
      console.log('❌ Built-in test failed:', testResult.error);
    }
  } catch (error) {
    console.log('❌ Built-in test failed:', error);
  }

  console.log('\n🏁 Tests completed!');
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});