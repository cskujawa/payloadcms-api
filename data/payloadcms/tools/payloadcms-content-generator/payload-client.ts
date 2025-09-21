// PayloadCMS HTTP API Client for Content Generator MCP Tool

import {
  PayloadCMSConfig,
  PayloadCMSCollection,
  PayloadCMSMedia,
  PayloadCMSUser,
  PayloadCMSCategory,
  PayloadCMSPost,
  PayloadCMSAuthResponse,
  PostData
} from './types.js';

export class PayloadCMSClient {
  private config: PayloadCMSConfig;
  private authToken: string | null = null;

  constructor(config?: PayloadCMSConfig) {
    this.config = {
      base_url: config?.base_url || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
      admin_email: config?.admin_email || process.env.PAYLOADCMS_TOOL_EMAIL || 'demo-author@example.com',
      admin_password: config?.admin_password || process.env.PAYLOADCMS_TOOL_PASSWORD || 'password'
    };
  }

  /**
   * Validate if a string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string | null | undefined): boolean {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Get authentication token from PayloadCMS API
   */
  async getAuthToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    try {
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

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Authentication failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const data: PayloadCMSAuthResponse = await response.json();

      if (!data.token) {
        throw new Error('No token received from authentication');
      }

      this.authToken = data.token;
      return this.authToken;
    } catch (error) {
      console.error('Failed to authenticate with PayloadCMS:', error);
      throw error;
    }
  }

  /**
   * Make authenticated HTTP request to PayloadCMS API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
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
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken) {
      await this.getAuthToken();
    }
  }

  /**
   * Get all available media assets
   */
  async getMedia(): Promise<PayloadCMSMedia[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.makeRequest('/media?limit=1000');
      const result: PayloadCMSCollection<PayloadCMSMedia> = await response.json();

      return result.docs || [];
    } catch (error) {
      console.error('Error fetching media:', error);
      return [];
    }
  }

  /**
   * Get all users
   */
  async getUsers(): Promise<PayloadCMSUser[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.makeRequest('/users?limit=100');
      const result: PayloadCMSCollection<PayloadCMSUser> = await response.json();

      return result.docs || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<PayloadCMSCategory[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.makeRequest('/categories?limit=1000');
      const result: PayloadCMSCollection<PayloadCMSCategory> = await response.json();

      return result.docs || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  /**
   * Create a new category
   */
  async createCategory(title: string): Promise<PayloadCMSCategory | null> {
    try {
      await this.ensureAuthenticated();

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      const response = await this.makeRequest('/categories', {
        method: 'POST',
        body: JSON.stringify({ title, slug }),
      });

      const category: PayloadCMSCategory = await response.json();
      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  /**
   * Get or create categories by title
   */
  async getOrCreateCategories(categoryTitles: string[]): Promise<string[]> {
    const existingCategories = await this.getCategories();
    const categoryIds: string[] = [];

    for (const title of categoryTitles) {
      // Check if category exists
      const existing = existingCategories.find(cat =>
        cat.title.toLowerCase() === title.toLowerCase()
      );

      if (existing) {
        categoryIds.push(existing.id);
      } else {
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
  async getDefaultAuthor(): Promise<string | null> {
    const users = await this.getUsers();

    // First, try to find the current admin user (from config)
    const currentAdmin = users.find(user =>
      user.email === this.config.admin_email!
    );

    if (currentAdmin && this.isValidObjectId(currentAdmin.id)) {
      return currentAdmin.id;
    }

    // Try to find demo author (legacy support)
    const demoAuthor = users.find(user =>
      user.email === 'demo-author@example.com'
    );

    if (demoAuthor && this.isValidObjectId(demoAuthor.id)) {
      return demoAuthor.id;
    }

    // Fall back to first available user
    if (users.length > 0 && this.isValidObjectId(users[0].id)) {
      return users[0].id;
    }

    return null;
  }

  /**
   * Get a random media asset for hero image
   */
  async getRandomHeroImage(): Promise<string | null> {
    const media = await this.getMedia();

    // Filter for image files
    const images = media.filter(m =>
      m.mimeType?.startsWith('image/') &&
      (m.width || 0) > 800 // Prefer larger images for hero
    );

    let selectedMedia: any = null;

    if (images.length === 0) {
      selectedMedia = media.length > 0 ? media[0] : null;
    } else {
      // Return random image
      selectedMedia = images[Math.floor(Math.random() * images.length)];
    }

    if (selectedMedia && this.isValidObjectId(selectedMedia.id)) {
      return selectedMedia.id;
    }

    return null;
  }

  /**
   * Create a new post
   */
  async createPost(postData: PostData): Promise<PayloadCMSPost | null> {
    try {
      await this.ensureAuthenticated();

      const response = await this.makeRequest('/posts', {
        method: 'POST',
        body: JSON.stringify(postData),
      });

      const responseData = await response.json();
      // PayloadCMS HTTP API returns the created post in a 'doc' property
      const createdPost: PayloadCMSPost = responseData.doc || responseData;
      return createdPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get all posts (for relationship management)
   */
  async getPosts(): Promise<PayloadCMSPost[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.makeRequest('/posts?limit=1000');
      const result: PayloadCMSCollection<PayloadCMSPost> = await response.json();

      return result.docs || [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  /**
   * Test connection to PayloadCMS
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.ensureAuthenticated();

      // Try to fetch a small number of posts to test the connection
      await this.makeRequest('/posts?limit=1');

      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get admin URL for a post
   */
  getAdminUrl(postId: string): string {
    return `${this.config.base_url}/admin/collections/posts/${postId}`;
  }

  getPublicUrl(slug: string): string {
    return `${this.config.base_url}/posts/${slug}`;
  }

  /**
   * Authenticate with custom credentials
   */
  async authenticate(email: string, password: string): Promise<boolean> {
    try {
      this.config.admin_email = email;
      this.config.admin_password = password;
      this.authToken = null; // Reset token to force re-authentication

      await this.getAuthToken();
      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }
}