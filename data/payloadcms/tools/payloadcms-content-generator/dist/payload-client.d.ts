import { PayloadCMSConfig, PayloadCMSMedia, PayloadCMSUser, PayloadCMSCategory, PayloadCMSPost, PostData } from './types.js';
export declare class PayloadCMSClient {
    private config;
    private authToken;
    constructor(config?: PayloadCMSConfig);
    /**
     * Safely mask credentials for logging
     */
    private maskCredentials;
    /**
     * Validate if a string is a valid MongoDB ObjectId
     */
    private isValidObjectId;
    /**
     * Get authentication token from PayloadCMS API
     */
    getAuthToken(): Promise<string>;
    /**
     * Make authenticated HTTP request to PayloadCMS API
     */
    private makeRequest;
    /**
     * Ensure authentication is ready
     */
    private ensureAuthenticated;
    /**
     * Get all available media assets
     */
    getMedia(): Promise<PayloadCMSMedia[]>;
    /**
     * Get all users
     */
    getUsers(): Promise<PayloadCMSUser[]>;
    /**
     * Get all categories
     */
    getCategories(): Promise<PayloadCMSCategory[]>;
    /**
     * Create a new category
     */
    createCategory(title: string): Promise<PayloadCMSCategory | null>;
    /**
     * Get or create categories by title
     */
    getOrCreateCategories(categoryTitles: string[]): Promise<string[]>;
    /**
     * Get default author (current admin user or first available user)
     */
    getDefaultAuthor(): Promise<string | null>;
    /**
     * Get a random media asset for hero image
     */
    getRandomHeroImage(): Promise<string | null>;
    /**
     * Create a new post
     */
    createPost(postData: PostData): Promise<PayloadCMSPost | null>;
    /**
     * Get all posts (for relationship management)
     */
    getPosts(): Promise<PayloadCMSPost[]>;
    /**
     * Test connection to PayloadCMS
     */
    testConnection(): Promise<boolean>;
    /**
     * Get admin URL for a post
     */
    getAdminUrl(postId: string): string;
    getPublicUrl(slug: string): string;
    /**
     * Authenticate with custom credentials
     */
    authenticate(email: string, password: string): Promise<boolean>;
}
