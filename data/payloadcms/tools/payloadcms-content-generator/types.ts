// TypeScript definitions for PayloadCMS Content Generator MCP Tool

// Legacy interface - kept for backward compatibility
export interface ContentGeneratorParams {
  prompt: string;
  content_type: 'post' | 'page';
  style?: 'professional' | 'technical' | 'casual' | 'creative';
  length?: 'short' | 'medium' | 'long';
  categories?: string[];
  author_email?: string;
}

// New JSON Data Contract interfaces
export interface PostCreationRequest {
  title: string;
  slug?: string;
  meta: {
    title: string;
    description: string;
  };
  blocks: ContentBlock[];
  categories?: string[];
  heroImage?: boolean; // Whether to assign a random demo image
}

export interface ContentBlock {
  type: 'paragraph' | 'heading' | 'code' | 'banner' | 'mediaBlock';
  content: string;
  metadata?: {
    language?: string; // for code blocks
    level?: 'h2' | 'h3'; // for headings
    style?: 'info' | 'warning' | 'error' | 'success'; // for banners
    blockName?: string; // optional block name
  };
}

export interface ContentGeneratorResult {
  success: boolean;
  post_id?: string;
  admin_url?: string;
  public_url?: string;
  slug?: string;
  title?: string;
  error?: string;
  details?: string;
}

export interface PayloadCMSConfig {
  base_url: string;
  admin_email?: string;
  admin_password?: string;
  auth_token?: string;
}

// Lexical Editor Types
export interface LexicalNode {
  type: string;
  children?: LexicalNode[];
  text?: string;
  detail?: number;
  format?: number;
  mode?: string;
  style?: string;
  version: number;
  direction?: string;
  indent?: number;
  tag?: string;
  textFormat?: number;
  fields?: any;
}

export interface LexicalRoot {
  root: {
    type: 'root';
    children: LexicalNode[];
    direction: string;
    format: string;
    indent: number;
    version: number;
  };
}

// Block Types
export interface BannerBlock {
  type: 'block';
  fields: {
    blockName?: string;
    blockType: 'banner';
    content: LexicalRoot;
    style: 'info' | 'warning' | 'error' | 'success';
  };
  format: string;
  version: number;
}

export interface CodeBlock {
  type: 'block';
  fields: {
    blockName?: string;
    blockType: 'code';
    code: string;
    language: string;
  };
  format: string;
  version: number;
}

export interface MediaBlock {
  type: 'block';
  fields: {
    blockName?: string;
    blockType: 'mediaBlock';
    media: string; // Media ID
  };
  format: string;
  version: number;
}

// Post Structure
export interface PostData {
  slug: string;
  _status: 'published' | 'draft';
  authors?: string[]; // User IDs
  content: LexicalRoot;
  heroImage?: string; // Media ID
  meta: {
    description: string;
    image?: string; // Media ID
    title: string;
  };
  categories?: string[]; // Category IDs
  relatedPosts?: string[]; // Post IDs
  title: string;
}

// PayloadCMS API Response Types
export interface PayloadCMSMedia {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
  alt?: string;
}

export interface PayloadCMSUser {
  id: string;
  email: string;
  name?: string;
}

export interface PayloadCMSCategory {
  id: string;
  title: string;
  slug: string;
}

export interface PayloadCMSPost {
  id: string;
  title: string;
  slug: string;
  _status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PayloadCMSAuthResponse {
  message?: string;
  user?: PayloadCMSUser;
  token?: string;
  exp?: number;
}

export interface PayloadCMSCollection<T = any> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number;
  nextPage?: number;
}