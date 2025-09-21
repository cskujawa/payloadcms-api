import { ContentGeneratorParams, PostData } from './types.js';
export declare class ContentGenerator {
    /**
     * Generate a complete post from a prompt
     */
    static generatePost(params: ContentGeneratorParams): PostData;
    /**
     * Generate title from prompt
     */
    private static generateTitle;
    private static createGuideTitle;
    private static createBestPracticesTitle;
    private static createIntroTitle;
    private static createGeneralTitle;
    private static extractMainTopic;
    /**
     * Generate URL-friendly slug
     */
    private static generateSlug;
    /**
     * Generate meta description
     */
    private static generateMetaDescription;
    /**
     * Generate main content structure
     */
    private static generateContent;
    /**
     * Create lexical heading node
     */
    private static createHeading;
    /**
     * Create lexical paragraph node
     */
    private static createParagraph;
    /**
     * Create code block
     */
    private static createCodeBlock;
    /**
     * Create banner block
     */
    private static createBannerBlock;
    /**
     * Generate introduction paragraph
     */
    private static generateIntroduction;
    /**
     * Generate content sections
     */
    private static generateSections;
    /**
     * Generate conclusion
     */
    private static generateConclusion;
    /**
     * Detect if topic is technical
     */
    private static isTechnicalTopic;
    /**
     * Detect programming language from prompt
     */
    private static detectLanguage;
    /**
     * Generate sample code based on prompt
     */
    private static generateSampleCode;
    /**
     * Generate a unique block ID for PayloadCMS blocks
     */
    private static generateBlockId;
}
