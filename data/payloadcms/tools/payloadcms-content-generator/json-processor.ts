// JSON Processing Logic for PayloadCMS Posts
// Converts JSON data contract to PayloadCMS-compatible format

import {
  PostCreationRequest,
  ContentBlock,
  PostData,
  LexicalRoot,
  LexicalNode,
  BannerBlock,
  CodeBlock,
  MediaBlock
} from './types.js';

export class JSONProcessor {
  /**
   * Convert JSON data contract to PayloadCMS PostData format
   */
  static processPostCreationRequest(request: PostCreationRequest): PostData {
    const { title, slug, meta, blocks, categories, heroImage } = request;

    // Generate slug if not provided
    const finalSlug = slug || this.generateSlug(title);

    // Convert blocks to Lexical format
    const content = this.convertBlocksToLexical(blocks);

    return {
      slug: finalSlug,
      _status: 'draft',
      title,
      content,
      meta: {
        title: meta.title,
        description: meta.description,
      },
      heroImage: heroImage ? 'random' : undefined,
      relatedPosts: [],
    };
  }

  /**
   * Convert content blocks array to Lexical editor format
   */
  private static convertBlocksToLexical(blocks: ContentBlock[]): LexicalRoot {
    const children: LexicalNode[] = [];

    blocks.forEach(block => {
      switch (block.type) {
        case 'heading':
          children.push(this.createHeading(block.content, block.metadata?.level || 'h2'));
          break;
        case 'paragraph':
          children.push(this.createParagraph(block.content));
          break;
        case 'code':
          children.push(this.createCodeBlock(
            block.content,
            block.metadata?.language || 'javascript',
            block.metadata?.blockName || 'Code Example'
          ));
          break;
        case 'banner':
          children.push(this.createBannerBlock(
            block.content,
            block.metadata?.style || 'info',
            block.metadata?.blockName || 'Important Note'
          ));
          break;
        case 'mediaBlock':
          children.push(this.createMediaBlock(block.metadata?.blockName || 'Media'));
          break;
        default:
          // Fallback to paragraph for unknown types
          children.push(this.createParagraph(block.content));
      }
    });

    return {
      root: {
        type: 'root',
        children,
        direction: 'ltr',
        format: '' as any,
        indent: 0 as any,
        version: 1,
      },
    };
  }

  /**
   * Create lexical heading node
   */
  private static createHeading(text: string, tag: 'h2' | 'h3'): LexicalNode {
    return {
      type: 'heading',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '' as any,
      indent: 0 as any,
      tag,
      version: 1,
    };
  }

  /**
   * Create lexical paragraph node
   */
  private static createParagraph(text: string): LexicalNode {
    return {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '' as any,
      indent: 0 as any,
      textFormat: 0 as any,
      version: 1,
    };
  }

  /**
   * Create code block - PayloadCMS expects only 'code' field, language is separate
   */
  private static createCodeBlock(code: string, language: string, blockName: string): any {
    // Validate language against PayloadCMS allowed values
    const allowedLanguages = [
      'typescript', 'javascript', 'css', 'html', 'python', 'bash',
      'json', 'yaml', 'dockerfile', 'sql', 'markdown', 'xml'
    ];
    const validLanguage = allowedLanguages.includes(language) ? language : 'javascript';

    if (language !== validLanguage) {
      console.warn(`⚠️ Language "${language}" not supported, using "${validLanguage}" instead`);
    }

    return {
      type: 'block',
      fields: {
        blockType: 'code',
        language: validLanguage,
        code,
        id: this.generateBlockId(),
      },
      format: '' as any,
      version: 2,
    };
  }

  /**
   * Create banner block with proper Lexical content structure
   */
  private static createBannerBlock(
    text: string,
    style: 'info' | 'warning' | 'error' | 'success',
    blockName: string
  ): any {
    return {
      type: 'block',
      fields: {
        blockType: 'banner',
        style,
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        id: this.generateBlockId(),
      },
      format: '' as any,
      version: 2,
    };
  }

  /**
   * Create media block (placeholder for future media selection)
   */
  private static createMediaBlock(blockName: string): any {
    return {
      type: 'block',
      fields: {
        blockType: 'mediaBlock',
        media: 'random', // Will be replaced with actual media ID during post creation
        id: this.generateBlockId(),
      },
      format: '' as any,
      version: 2,
    };
  }

  /**
   * Generate URL-friendly slug from title
   */
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Generate a unique block ID for PayloadCMS blocks
   */
  private static generateBlockId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Validate JSON input against the PostCreationRequest schema
   */
  static validatePostCreationRequest(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }

    if (!data.meta || typeof data.meta !== 'object') {
      errors.push('meta is required and must be an object');
    } else {
      if (!data.meta.title || typeof data.meta.title !== 'string') {
        errors.push('meta.title is required and must be a string');
      }
      if (!data.meta.description || typeof data.meta.description !== 'string') {
        errors.push('meta.description is required and must be a string');
      }
    }

    if (!data.blocks || !Array.isArray(data.blocks)) {
      errors.push('blocks is required and must be an array');
    } else {
      data.blocks.forEach((block: any, index: number) => {
        if (!block.type || typeof block.type !== 'string') {
          errors.push(`blocks[${index}].type is required and must be a string`);
        } else if (!['paragraph', 'heading', 'code', 'banner', 'mediaBlock'].includes(block.type)) {
          errors.push(`blocks[${index}].type must be one of: paragraph, heading, code, banner, mediaBlock`);
        }

        if (block.type !== 'mediaBlock' && (!block.content || typeof block.content !== 'string')) {
          errors.push(`blocks[${index}].content is required and must be a string`);
        } else if (block.type === 'mediaBlock' && typeof block.content !== 'string') {
          errors.push(`blocks[${index}].content must be a string (can be empty for mediaBlock)`);
        }

        // Validate metadata if provided
        if (block.metadata && typeof block.metadata !== 'object') {
          errors.push(`blocks[${index}].metadata must be an object if provided`);
        }

        // Validate specific block type requirements
        if (block.type === 'code' && block.metadata?.language) {
          const allowedLanguages = [
            'typescript', 'javascript', 'css', 'html', 'python', 'bash',
            'json', 'yaml', 'dockerfile', 'sql', 'markdown', 'xml'
          ];
          if (!allowedLanguages.includes(block.metadata.language)) {
            errors.push(`blocks[${index}].metadata.language must be one of: ${allowedLanguages.join(', ')}`);
          }
        }

        if (block.type === 'heading' && block.metadata?.level) {
          const allowedLevels = ['h2', 'h3'];
          if (!allowedLevels.includes(block.metadata.level)) {
            errors.push(`blocks[${index}].metadata.level must be one of: ${allowedLevels.join(', ')}`);
          }
        }

        if (block.type === 'banner' && block.metadata?.style) {
          const allowedStyles = ['info', 'warning', 'error', 'success'];
          if (!allowedStyles.includes(block.metadata.style)) {
            errors.push(`blocks[${index}].metadata.style must be one of: ${allowedStyles.join(', ')}`);
          }
        }
      });
    }

    // Check optional fields
    if (data.slug && (typeof data.slug !== 'string' || data.slug.trim().length === 0)) {
      errors.push('slug must be a non-empty string if provided');
    }

    if (data.categories && !Array.isArray(data.categories)) {
      errors.push('categories must be an array if provided');
    } else if (data.categories) {
      data.categories.forEach((category: any, index: number) => {
        if (typeof category !== 'string' || category.trim().length === 0) {
          errors.push(`categories[${index}] must be a non-empty string`);
        }
      });
    }

    if (data.heroImage && typeof data.heroImage !== 'boolean') {
      errors.push('heroImage must be a boolean if provided');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}