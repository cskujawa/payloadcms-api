import { PayloadCMSConfig } from './types.js';
export declare class ConfigManager {
    /**
     * Detect PayloadCMS configuration from environment
     * For HTTP API, we need base URL and authentication credentials
     */
    static detectConfig(): PayloadCMSConfig;
    /**
     * Detect PayloadCMS base URL
     */
    private static detectBaseUrl;
    /**
     * Read PayloadCMS URL from .env file
     */
    private static readEnvFile;
    /**
     * Detect URL from docker-compose.yaml
     */
    private static detectFromDockerCompose;
    /**
     * Detect server IP address
     */
    private static detectServerIp;
    /**
     * Test if PayloadCMS is accessible via HTTP API
     */
    static testPayloadCMSConnection(baseUrl?: string): Promise<boolean>;
    /**
     * Get default authentication credentials
     */
    static getDefaultCredentials(): {
        email: string;
        password: string;
    };
    /**
     * Validate configuration
     */
    static validateConfig(config: PayloadCMSConfig): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Get environment info for debugging
     */
    static getEnvironmentInfo(): any;
}
