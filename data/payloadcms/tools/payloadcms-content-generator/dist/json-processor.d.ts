import { PostCreationRequest, PostData } from './types.js';
export declare class JSONProcessor {
    /**
     * Convert JSON data contract to PayloadCMS PostData format
     */
    static processPostCreationRequest(request: PostCreationRequest): PostData;
    /**
     * Convert content blocks array to Lexical editor format
     */
    private static convertBlocksToLexical;
    /**
     * Create lexical heading node
     */
    private static createHeading;
    /**
     * Create lexical paragraph node
     */
    private static createParagraph;
    /**
     * Create code block - PayloadCMS expects only 'code' field, language is separate
     */
    private static createCodeBlock;
    /**
     * Create banner block with proper Lexical content structure
     */
    private static createBannerBlock;
    /**
     * Create media block (placeholder for future media selection)
     */
    private static createMediaBlock;
    /**
     * Generate URL-friendly slug from title
     */
    private static generateSlug;
    /**
     * Generate a unique block ID for PayloadCMS blocks
     */
    private static generateBlockId;
    /**
     * Validate JSON input against the PostCreationRequest schema
     */
    static validatePostCreationRequest(data: any): {
        valid: boolean;
        errors: string[];
    };
}
