// Main MCP Tool Implementation for PayloadCMS Content Generator
import { JSONProcessor } from './json-processor.js';
import { PayloadCMSClient } from './payload-client.js';
import { ConfigManager } from './config.js';
export class PayloadCMSContentGeneratorTool {
    client;
    config;
    constructor(config) {
        this.config = config || ConfigManager.detectConfig();
        this.client = new PayloadCMSClient(this.config);
    }
    /**
     * Create a new post from JSON data contract
     */
    async createPostFromJSON(request) {
        try {
            // Validate JSON input
            const validation = JSONProcessor.validatePostCreationRequest(request);
            if (!validation.valid) {
                return {
                    success: false,
                    error: 'Invalid JSON input',
                    details: validation.errors.join(', ')
                };
            }
            // Test connection to PayloadCMS Local API
            const isConnected = await this.client.testConnection();
            if (!isConnected) {
                return {
                    success: false,
                    error: 'Could not connect to PayloadCMS Local API',
                    details: 'Failed to initialize PayloadCMS Local API. Ensure the tool is running inside the PayloadCMS container.'
                };
            }
            // Process JSON input to PayloadCMS format
            const postData = JSONProcessor.processPostCreationRequest(request);
            // Enhance post data with PayloadCMS-specific information
            const enhancedPostData = await this.enhancePostDataFromJSON(postData, request);
            // Create the post
            const createdPost = await this.client.createPost(enhancedPostData);
            if (!createdPost) {
                return {
                    success: false,
                    error: 'Failed to create post',
                    details: 'Post creation returned null - check PayloadCMS logs for details'
                };
            }
            return {
                success: true,
                post_id: createdPost.id,
                slug: createdPost.slug,
                title: createdPost.title,
                admin_url: this.client.getAdminUrl(createdPost.id),
                public_url: this.client.getPublicUrl(createdPost.slug)
            };
        }
        catch (error) {
            console.error('Error in createPostFromJSON:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error instanceof Error ? error.stack : 'No additional details available'
            };
        }
    }
    /**
     * Enhance JSON-based post data with PayloadCMS-specific information
     */
    async enhancePostDataFromJSON(postData, request) {
        const enhanced = { ...postData };
        try {
            // Add author
            const authorId = await this.client.getDefaultAuthor();
            if (authorId) {
                enhanced.authors = [authorId];
            }
            // Add hero image if requested
            if (request.heroImage) {
                const heroImageId = await this.client.getRandomHeroImage();
                if (heroImageId) {
                    enhanced.heroImage = heroImageId;
                    enhanced.meta.image = heroImageId;
                }
            }
            // Categories are skipped - posts created as drafts for manual review and categorization
            // Process media blocks - replace 'random' with actual media IDs
            await this.processMediaBlocks(enhanced);
            return enhanced;
        }
        catch (error) {
            console.error('Error enhancing JSON post data:', error);
            return enhanced; // Return basic post data if enhancement fails
        }
    }
    /**
     * Process media blocks and replace placeholders with actual media IDs
     */
    async processMediaBlocks(postData) {
        const processBlocks = (blocks) => {
            return blocks.map(async (block) => {
                if (block.type === 'block' && block.fields?.blockType === 'mediaBlock') {
                    if (block.fields.media === 'random') {
                        const mediaId = await this.client.getRandomHeroImage();
                        if (mediaId) {
                            block.fields.media = mediaId;
                        }
                    }
                }
                if (block.children && Array.isArray(block.children)) {
                    await Promise.all(processBlocks(block.children));
                }
            });
        };
        if (postData.content?.root?.children) {
            await Promise.all(processBlocks(postData.content.root.children));
        }
    }
    /**
     * Get tool configuration and status
     */
    async getStatus() {
        const configValidation = await ConfigManager.validateConfig(this.config);
        const envInfo = ConfigManager.getEnvironmentInfo();
        return {
            config: {
                base_url: this.config.base_url,
                admin_email: this.config.admin_email,
            },
            validation: configValidation,
            environment: envInfo,
            connection: await this.client.testConnection(),
        };
    }
    /**
     * Test the tool functionality
     */
    async test() {
        const testRequest = {
            title: 'Test Post - PayloadCMS Content Generation',
            meta: {
                title: 'Test Post - PayloadCMS Content Generation',
                description: 'A test post to verify the PayloadCMS content generator tool functionality'
            },
            blocks: [
                {
                    type: 'heading',
                    content: 'Tool Functionality Test',
                    metadata: { level: 'h2' }
                },
                {
                    type: 'paragraph',
                    content: 'This is a test post created to verify that the PayloadCMS content generator tool is working correctly.'
                },
                {
                    type: 'banner',
                    content: 'This post was generated automatically as part of the tool testing process.',
                    metadata: { style: 'info' }
                }
            ],
            categories: ['Testing', 'PayloadCMS'],
            heroImage: true
        };
        return await this.createPostFromJSON(testRequest);
    }
}
// MCP Tool Interface Functions
// These functions provide the actual MCP interface
/**
 * Create a new PayloadCMS post from JSON data contract
 */
export async function payloadcms_create_post_from_json(request) {
    const tool = new PayloadCMSContentGeneratorTool();
    return await tool.createPostFromJSON(request);
}
/**
 * Get tool status and configuration
 */
export async function payloadcms_get_status() {
    const tool = new PayloadCMSContentGeneratorTool();
    return await tool.getStatus();
}
/**
 * Test the tool functionality
 */
export async function payloadcms_test_tool() {
    const tool = new PayloadCMSContentGeneratorTool();
    return await tool.test();
}
// Export the main class for direct usage
export { PayloadCMSContentGeneratorTool as default };
