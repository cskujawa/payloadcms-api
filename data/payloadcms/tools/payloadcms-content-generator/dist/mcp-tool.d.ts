import { PostCreationRequest, ContentGeneratorResult, PayloadCMSConfig } from './types.js';
export declare class PayloadCMSContentGeneratorTool {
    private client;
    private config;
    constructor(config?: PayloadCMSConfig);
    /**
     * Create a new post from JSON data contract
     */
    createPostFromJSON(request: PostCreationRequest): Promise<ContentGeneratorResult>;
    /**
     * Enhance JSON-based post data with PayloadCMS-specific information
     */
    private enhancePostDataFromJSON;
    /**
     * Process media blocks and replace placeholders with actual media IDs
     */
    private processMediaBlocks;
    /**
     * Get tool configuration and status
     */
    getStatus(): Promise<any>;
    /**
     * Test the tool functionality
     */
    test(): Promise<ContentGeneratorResult>;
}
/**
 * Create a new PayloadCMS post from JSON data contract
 */
export declare function payloadcms_create_post_from_json(request: PostCreationRequest): Promise<ContentGeneratorResult>;
/**
 * Get tool status and configuration
 */
export declare function payloadcms_get_status(): Promise<any>;
/**
 * Test the tool functionality
 */
export declare function payloadcms_test_tool(): Promise<ContentGeneratorResult>;
export { PayloadCMSContentGeneratorTool as default };
