// Configuration and Environment Detection for PayloadCMS Content Generator
import * as fs from 'fs';
import * as path from 'path';
export class ConfigManager {
    /**
     * Detect PayloadCMS configuration from environment
     * For HTTP API, we need base URL and authentication credentials
     */
    static detectConfig() {
        // Detect base URL for HTTP API calls
        const baseUrl = this.detectBaseUrl();
        return {
            base_url: baseUrl,
            admin_email: process.env.PAYLOADCMS_TOOL_EMAIL || 'demo-author@example.com',
            admin_password: process.env.PAYLOADCMS_TOOL_PASSWORD || 'password',
        };
    }
    /**
     * Detect PayloadCMS base URL
     */
    static detectBaseUrl() {
        // 1. Check environment variable
        if (process.env.PAYLOADCMS_URL) {
            return process.env.PAYLOADCMS_URL;
        }
        // 2. Check NEXT_PUBLIC_SERVER_URL from .env file
        const envUrl = this.readEnvFile();
        if (envUrl) {
            return envUrl;
        }
        // 3. Try to detect from docker-compose.yaml
        const dockerUrl = this.detectFromDockerCompose();
        if (dockerUrl) {
            return dockerUrl;
        }
        // 4. Default to localhost
        return 'http://localhost:3000';
    }
    /**
     * Read PayloadCMS URL from .env file
     */
    static readEnvFile() {
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (!fs.existsSync(envPath)) {
                return null;
            }
            const envContent = fs.readFileSync(envPath, 'utf-8');
            const lines = envContent.split('\n');
            for (const line of lines) {
                if (line.startsWith('NEXT_PUBLIC_SERVER_URL=')) {
                    const url = line.split('=')[1]?.trim().replace(/"/g, '');
                    if (url) {
                        return url;
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.warn('Could not read .env file:', error);
            return null;
        }
    }
    /**
     * Detect URL from docker-compose.yaml
     */
    static detectFromDockerCompose() {
        try {
            const composePath = path.join(process.cwd(), 'docker-compose.yaml');
            if (!fs.existsSync(composePath)) {
                return null;
            }
            const composeContent = fs.readFileSync(composePath, 'utf-8');
            // Look for port mapping
            const portMatch = composeContent.match(/- "(\d+):3000"/);
            if (portMatch) {
                const port = portMatch[1];
                // Try to detect server IP
                const serverIp = this.detectServerIp();
                return `http://${serverIp}:${port}`;
            }
            return null;
        }
        catch (error) {
            console.warn('Could not read docker-compose.yaml:', error);
            return null;
        }
    }
    /**
     * Detect server IP address
     */
    static detectServerIp() {
        try {
            const { execSync } = require('child_process');
            // Try to get IP from route command
            try {
                const ip = execSync("ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \\K\\S+' | head -1", { encoding: 'utf-8' }).trim();
                if (ip && ip !== '127.0.0.1') {
                    return ip;
                }
            }
            catch (e) {
                // Ignore error and try next method
            }
            // Try hostname -I
            try {
                const ip = execSync('hostname -I 2>/dev/null', { encoding: 'utf-8' }).trim().split(' ')[0];
                if (ip && ip !== '127.0.0.1') {
                    return ip;
                }
            }
            catch (e) {
                // Ignore error and fall back
            }
            return 'localhost';
        }
        catch (error) {
            return 'localhost';
        }
    }
    /**
     * Test if PayloadCMS is accessible via HTTP API
     */
    static async testPayloadCMSConnection(baseUrl) {
        try {
            const testUrl = baseUrl || this.detectBaseUrl();
            const response = await fetch(`${testUrl}/api/posts?limit=1`);
            // Even unauthenticated requests should return a proper error, not network error
            return response.status === 401 || response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get default authentication credentials
     */
    static getDefaultCredentials() {
        return {
            email: process.env.PAYLOADCMS_TOOL_EMAIL || 'demo-author@example.com',
            password: process.env.PAYLOADCMS_TOOL_PASSWORD || 'password',
        };
    }
    /**
     * Validate configuration
     */
    static async validateConfig(config) {
        const errors = [];
        const warnings = [];
        // Check if PayloadCMS HTTP API is accessible
        const isAccessible = await this.testPayloadCMSConnection(config.base_url);
        if (!isAccessible) {
            errors.push('PayloadCMS HTTP API not accessible - ensure PayloadCMS is running and URL is correct');
        }
        // Check if using default credentials
        if (config.admin_email === 'demo-author@example.com') {
            warnings.push('Using default demo credentials - consider setting PAYLOADCMS_TOOL_EMAIL and PAYLOADCMS_TOOL_PASSWORD');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Get environment info for debugging
     */
    static getEnvironmentInfo() {
        return {
            cwd: process.cwd(),
            env_vars: {
                PAYLOADCMS_URL: process.env.PAYLOADCMS_URL || 'not set',
                PAYLOADCMS_TOOL_EMAIL: process.env.PAYLOADCMS_TOOL_EMAIL || 'not set',
                PAYLOADCMS_TOOL_PASSWORD: process.env.PAYLOADCMS_TOOL_PASSWORD ? '***' : 'not set',
                NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'not set',
            },
            files: {
                env_exists: fs.existsSync(path.join(process.cwd(), '.env')),
                docker_compose_exists: fs.existsSync(path.join(process.cwd(), 'docker-compose.yaml')),
            },
        };
    }
}
