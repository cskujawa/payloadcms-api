// PayloadCMS HTTP API Client for Content Generator MCP Tool
export class PayloadCMSClient {
    config;
    authToken = null;
    constructor(config) {
        this.config = {
            base_url: config?.base_url || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
            admin_email: config?.admin_email || process.env.PAYLOADCMS_TOOL_EMAIL || 'demo-author@example.com',
            admin_password: config?.admin_password || process.env.PAYLOADCMS_TOOL_PASSWORD || 'password'
        };
    }
    /**
     * Safely mask credentials for logging
     */
    maskCredentials(email, password) {
        const maskedEmail = email.replace(/(.{3}).*@/, '$1***@');
        const maskedPassword = '*'.repeat(Math.min(password.length, 8));
        return `${maskedEmail} / ${maskedPassword}`;
    }
    /**
     * Validate if a string is a valid MongoDB ObjectId
     */
    isValidObjectId(id) {
        if (!id || typeof id !== 'string')
            return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    }
    /**
     * Get authentication token from PayloadCMS API
     */
    async getAuthToken() {
        if (this.authToken) {
            console.log(`🔑 DEBUG: Using cached auth token (${this.authToken.substring(0, 20)}...)`);
            return this.authToken;
        }
        try {
            console.log(`🔑 DEBUG: Attempting authentication to ${this.config.base_url}/api/users/login`);
            console.log(`🔑 DEBUG: Using credentials: ${this.maskCredentials(this.config.admin_email, this.config.admin_password)}`);
            const response = await fetch(`${this.config.base_url}/api/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.config.admin_email,
                    password: this.config.admin_password,
                }),
            });
            console.log(`🔑 DEBUG: Auth response status: ${response.status} ${response.statusText}`);
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`🔑 DEBUG: Auth failed - Response body:`, errorBody);
                throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = await response.json();
            console.log(`🔑 DEBUG: Auth response keys:`, Object.keys(data));
            if (!data.token) {
                console.error(`🔑 DEBUG: No token in response:`, data);
                throw new Error('No token received from authentication');
            }
            this.authToken = data.token;
            console.log(`🔑 DEBUG: Auth successful, token received (${data.token.substring(0, 20)}...)`);
            return this.authToken;
        }
        catch (error) {
            console.error(`🔑 DEBUG: Authentication error:`, error);
            console.error(`🔑 DEBUG: Config being used:`, {
                base_url: this.config.base_url,
                admin_email: this.config.admin_email,
                admin_password: this.config.admin_password ? `[${this.config.admin_password.length} chars]` : 'undefined'
            });
            throw error;
        }
    }
    /**
     * Make authenticated HTTP request to PayloadCMS API
     */
    async makeRequest(endpoint, options = {}) {
        const token = await this.getAuthToken();
        const response = await fetch(`${this.config.base_url}/api${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `JWT ${token}`,
                ...options.headers,
            },
        });
        if (!response.ok) {
            // Log the response body for debugging
            const errorBody = await response.text();
            console.error(`API request failed: ${response.status} ${response.statusText}`);
            console.error('Response body:', errorBody);
            throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
        }
        return response;
    }
    /**
     * Ensure authentication is ready
     */
    async ensureAuthenticated() {
        if (!this.authToken) {
            await this.getAuthToken();
        }
    }
    /**
     * Get all available media assets
     */
    async getMedia() {
        try {
            await this.ensureAuthenticated();
            const response = await this.makeRequest('/media?limit=1000');
            const result = await response.json();
            return result.docs || [];
        }
        catch (error) {
            console.error('Error fetching media:', error);
            return [];
        }
    }
    /**
     * Get all users
     */
    async getUsers() {
        try {
            await this.ensureAuthenticated();
            const response = await this.makeRequest('/users?limit=100');
            const result = await response.json();
            return result.docs || [];
        }
        catch (error) {
            console.error('Error fetching users:', error);
            return [];
        }
    }
    /**
     * Get all categories
     */
    async getCategories() {
        try {
            await this.ensureAuthenticated();
            const response = await this.makeRequest('/categories?limit=1000');
            const result = await response.json();
            return result.docs || [];
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }
    /**
     * Create a new category
     */
    async createCategory(title) {
        try {
            await this.ensureAuthenticated();
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const response = await this.makeRequest('/categories', {
                method: 'POST',
                body: JSON.stringify({ title, slug }),
            });
            const category = await response.json();
            return category;
        }
        catch (error) {
            console.error('Error creating category:', error);
            return null;
        }
    }
    /**
     * Get or create categories by title
     */
    async getOrCreateCategories(categoryTitles) {
        const existingCategories = await this.getCategories();
        const categoryIds = [];
        for (const title of categoryTitles) {
            // Check if category exists
            const existing = existingCategories.find(cat => cat.title.toLowerCase() === title.toLowerCase());
            if (existing) {
                categoryIds.push(existing.id);
            }
            else {
                // Create new category
                const newCategory = await this.createCategory(title);
                if (newCategory) {
                    categoryIds.push(newCategory.id);
                }
            }
        }
        return categoryIds;
    }
    /**
     * Get default author (current admin user or first available user)
     */
    async getDefaultAuthor() {
        const users = await this.getUsers();
        console.log(`👤 DEBUG: Found ${users.length} users in system`);
        // First, try to find the current admin user (from config)
        const currentAdmin = users.find(user => user.email === this.config.admin_email);
        if (currentAdmin) {
            console.log(`👤 DEBUG: Using current admin user: ${this.maskCredentials(currentAdmin.email, 'hidden')}`);
            console.log(`👤 DEBUG: Admin user ID: ${currentAdmin.id} (valid: ${this.isValidObjectId(currentAdmin.id)})`);
            if (!this.isValidObjectId(currentAdmin.id)) {
                console.error(`👤 DEBUG: INVALID OBJECTID for admin user! ID: "${currentAdmin.id}"`);
                return null;
            }
            return currentAdmin.id;
        }
        // Try to find demo author (legacy support)
        const demoAuthor = users.find(user => user.email === 'demo-author@example.com');
        if (demoAuthor) {
            console.log(`👤 DEBUG: Using demo author: demo-author@example.com`);
            console.log(`👤 DEBUG: Demo author ID: ${demoAuthor.id} (valid: ${this.isValidObjectId(demoAuthor.id)})`);
            if (!this.isValidObjectId(demoAuthor.id)) {
                console.error(`👤 DEBUG: INVALID OBJECTID for demo author! ID: "${demoAuthor.id}"`);
                return null;
            }
            return demoAuthor.id;
        }
        // Fall back to first available user
        if (users.length > 0) {
            console.log(`👤 DEBUG: Using first available user: ${this.maskCredentials(users[0].email, 'hidden')}`);
            console.log(`👤 DEBUG: First user ID: ${users[0].id} (valid: ${this.isValidObjectId(users[0].id)})`);
            if (!this.isValidObjectId(users[0].id)) {
                console.error(`👤 DEBUG: INVALID OBJECTID for first user! ID: "${users[0].id}"`);
                return null;
            }
            return users[0].id;
        }
        console.error(`👤 DEBUG: No users found in system!`);
        return null;
    }
    /**
     * Get a random media asset for hero image
     */
    async getRandomHeroImage() {
        const media = await this.getMedia();
        console.log(`🖼️ DEBUG: Found ${media.length} media items`);
        // Filter for image files
        const images = media.filter(m => m.mimeType?.startsWith('image/') &&
            (m.width || 0) > 800 // Prefer larger images for hero
        );
        let selectedMedia = null;
        if (images.length === 0) {
            selectedMedia = media.length > 0 ? media[0] : null;
        }
        else {
            // Return random image
            selectedMedia = images[Math.floor(Math.random() * images.length)];
        }
        if (selectedMedia) {
            console.log(`🖼️ DEBUG: Selected media: ${selectedMedia.filename} (ID: ${selectedMedia.id})`);
            console.log(`🖼️ DEBUG: Media ID valid: ${this.isValidObjectId(selectedMedia.id)}`);
            if (!this.isValidObjectId(selectedMedia.id)) {
                console.error(`🖼️ DEBUG: INVALID OBJECTID for media! ID: "${selectedMedia.id}"`);
                return null;
            }
            return selectedMedia.id;
        }
        console.log(`🖼️ DEBUG: No media found`);
        return null;
    }
    /**
     * Create a new post
     */
    async createPost(postData) {
        try {
            await this.ensureAuthenticated();
            console.log(`📝 DEBUG: Creating post with data:`);
            console.log(`📝 DEBUG: - Title: "${postData.title}"`);
            console.log(`📝 DEBUG: - Slug: "${postData.slug}"`);
            console.log(`📝 DEBUG: - Status: "${postData._status}"`);
            console.log(`📝 DEBUG: - Authors: ${JSON.stringify(postData.authors)}`);
            console.log(`📝 DEBUG: - HeroImage: ${postData.heroImage || 'none'}`);
            console.log(`📝 DEBUG: - Categories: ${JSON.stringify(postData.categories)}`);
            // Validate ObjectIds in the post data
            if (postData.authors) {
                postData.authors.forEach((authorId, index) => {
                    if (!this.isValidObjectId(authorId)) {
                        console.error(`📝 DEBUG: INVALID AUTHOR OBJECTID at index ${index}: "${authorId}"`);
                    }
                });
            }
            if (postData.heroImage && !this.isValidObjectId(postData.heroImage)) {
                console.error(`📝 DEBUG: INVALID HERO IMAGE OBJECTID: "${postData.heroImage}"`);
            }
            if (postData.categories) {
                postData.categories.forEach((categoryId, index) => {
                    if (!this.isValidObjectId(categoryId)) {
                        console.error(`📝 DEBUG: INVALID CATEGORY OBJECTID at index ${index}: "${categoryId}"`);
                    }
                });
            }
            const response = await this.makeRequest('/posts', {
                method: 'POST',
                body: JSON.stringify(postData),
            });
            const responseData = await response.json();
            // PayloadCMS HTTP API returns the created post in a 'doc' property
            const createdPost = responseData.doc || responseData;
            return createdPost;
        }
        catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }
    /**
     * Get all posts (for relationship management)
     */
    async getPosts() {
        try {
            await this.ensureAuthenticated();
            const response = await this.makeRequest('/posts?limit=1000');
            const result = await response.json();
            return result.docs || [];
        }
        catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    }
    /**
     * Test connection to PayloadCMS
     */
    async testConnection() {
        try {
            await this.ensureAuthenticated();
            // Try to fetch a small number of posts to test the connection
            await this.makeRequest('/posts?limit=1');
            return true;
        }
        catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
    /**
     * Get admin URL for a post
     */
    getAdminUrl(postId) {
        return `${this.config.base_url}/admin/collections/posts/${postId}`;
    }
    getPublicUrl(slug) {
        return `${this.config.base_url}/posts/${slug}`;
    }
    /**
     * Authenticate with custom credentials
     */
    async authenticate(email, password) {
        try {
            this.config.admin_email = email;
            this.config.admin_password = password;
            this.authToken = null; // Reset token to force re-authentication
            await this.getAuthToken();
            return true;
        }
        catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }
}
