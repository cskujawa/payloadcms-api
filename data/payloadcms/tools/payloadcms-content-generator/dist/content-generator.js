// Content Generation Logic for PayloadCMS Posts
export class ContentGenerator {
    /**
     * Generate a complete post from a prompt
     */
    static generatePost(params) {
        const { prompt, style = 'professional', length = 'medium' } = params;
        // Generate title from prompt
        const title = this.generateTitle(prompt);
        const slug = this.generateSlug(title);
        // Generate main content based on prompt
        const content = this.generateContent(prompt, style, length);
        // Generate meta information
        const meta = {
            title: title,
            description: this.generateMetaDescription(prompt, title),
        };
        return {
            slug,
            _status: 'published',
            title,
            content,
            meta,
            relatedPosts: [],
        };
    }
    /**
     * Generate title from prompt
     */
    static generateTitle(prompt) {
        // Extract key concepts and create an engaging title
        const words = prompt.toLowerCase().split(/\s+/);
        // Common title patterns based on content type
        if (words.includes('guide') || words.includes('tutorial') || words.includes('how')) {
            return this.createGuideTitle(prompt);
        }
        else if (words.includes('best') && words.includes('practice')) {
            return this.createBestPracticesTitle(prompt);
        }
        else if (words.includes('introduction') || words.includes('getting') && words.includes('started')) {
            return this.createIntroTitle(prompt);
        }
        else {
            return this.createGeneralTitle(prompt);
        }
    }
    static createGuideTitle(prompt) {
        // Extract main topic
        const topic = this.extractMainTopic(prompt);
        return `Complete Guide to ${topic}`;
    }
    static createBestPracticesTitle(prompt) {
        const topic = this.extractMainTopic(prompt);
        return `${topic}: Best Practices and Implementation Guide`;
    }
    static createIntroTitle(prompt) {
        const topic = this.extractMainTopic(prompt);
        return `Getting Started with ${topic}`;
    }
    static createGeneralTitle(prompt) {
        const topic = this.extractMainTopic(prompt);
        return `Understanding ${topic}: A Comprehensive Overview`;
    }
    static extractMainTopic(prompt) {
        // Simple extraction - this could be enhanced with NLP
        const words = prompt.split(/\s+/);
        const importantWords = words.filter(word => word.length > 3 &&
            !['about', 'with', 'using', 'creating', 'building', 'implementing'].includes(word.toLowerCase()));
        return importantWords.slice(0, 3).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    /**
     * Generate URL-friendly slug
     */
    static generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    /**
     * Generate meta description
     */
    static generateMetaDescription(prompt, title) {
        const baseDescription = `Learn about ${title.toLowerCase()}. This comprehensive guide covers key concepts, best practices, and practical implementation strategies.`;
        return baseDescription.substring(0, 160);
    }
    /**
     * Generate main content structure
     */
    static generateContent(prompt, style, length) {
        const children = [];
        // Add introduction paragraph
        children.push(this.createHeading('Introduction', 'h2'));
        children.push(this.createParagraph(this.generateIntroduction(prompt, style)));
        // Add main content sections based on length
        const sections = this.generateSections(prompt, style, length);
        sections.forEach(section => {
            children.push(this.createHeading(section.title, 'h2'));
            section.content.forEach((item) => {
                if (item.type === 'paragraph') {
                    children.push(this.createParagraph(item.text));
                }
                else if (item.type === 'code') {
                    children.push(this.createCodeBlock(item.code, item.language, item.title));
                }
                else if (item.type === 'banner') {
                    children.push(this.createBannerBlock(item.text, item.style || 'info'));
                }
            });
        });
        // Add conclusion
        children.push(this.createHeading('Conclusion', 'h2'));
        children.push(this.createParagraph(this.generateConclusion(prompt, style)));
        return {
            root: {
                type: 'root',
                children,
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
            },
        };
    }
    /**
     * Create lexical heading node
     */
    static createHeading(text, tag) {
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
            format: '',
            indent: 0,
            tag,
            version: 1,
        };
    }
    /**
     * Create lexical paragraph node
     */
    static createParagraph(text) {
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
            format: '',
            indent: 0,
            textFormat: 0,
            version: 1,
        };
    }
    /**
     * Create code block
     */
    static createCodeBlock(code, language, title) {
        return {
            type: 'block',
            fields: {
                blockName: title || 'Code Example',
                blockType: 'code',
                code,
                language,
                id: this.generateBlockId(),
            },
            format: '',
            version: 2,
        };
    }
    /**
     * Create banner block
     */
    static createBannerBlock(text, style) {
        return {
            type: 'block',
            fields: {
                blockName: 'Important Note',
                blockType: 'banner',
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
                style,
                id: this.generateBlockId(),
            },
            format: '',
            version: 2,
        };
    }
    /**
     * Generate introduction paragraph
     */
    static generateIntroduction(prompt, style) {
        const topic = this.extractMainTopic(prompt);
        if (style === 'technical') {
            return `This technical guide explores ${topic.toLowerCase()} with a focus on implementation details, best practices, and real-world applications. We'll cover key concepts, common challenges, and proven solutions.`;
        }
        else if (style === 'casual') {
            return `Let's dive into ${topic.toLowerCase()}! This guide will walk you through everything you need to know, from the basics to advanced techniques, in a straightforward and approachable way.`;
        }
        else {
            return `${topic} represents a crucial aspect of modern development practices. This comprehensive overview examines core principles, methodologies, and practical implementation strategies.`;
        }
    }
    /**
     * Generate content sections
     */
    static generateSections(prompt, style, length) {
        const topic = this.extractMainTopic(prompt);
        const sections = [];
        // Basic sections for any topic
        sections.push({
            title: 'Key Concepts and Fundamentals',
            content: [
                {
                    type: 'paragraph',
                    text: `Understanding the fundamental concepts of ${topic.toLowerCase()} is essential for effective implementation. This section covers the core principles and terminology you need to know.`
                }
            ]
        });
        // Add technical implementation section if it's a technical topic
        if (this.isTechnicalTopic(prompt)) {
            sections.push({
                title: 'Implementation and Setup',
                content: [
                    {
                        type: 'paragraph',
                        text: 'Let\'s explore the practical implementation steps and configuration requirements.'
                    },
                    {
                        type: 'code',
                        language: this.detectLanguage(prompt),
                        code: this.generateSampleCode(prompt),
                        title: 'Basic Implementation Example'
                    }
                ]
            });
        }
        sections.push({
            title: 'Best Practices and Common Pitfalls',
            content: [
                {
                    type: 'paragraph',
                    text: 'Following established best practices helps ensure successful implementation and maintainability.'
                },
                {
                    type: 'banner',
                    text: 'Important: Always consider security implications and performance impact when implementing these solutions.',
                    style: 'warning'
                }
            ]
        });
        // Add more sections for longer content
        if (length === 'long') {
            sections.push({
                title: 'Advanced Techniques and Optimization',
                content: [
                    {
                        type: 'paragraph',
                        text: 'Advanced techniques can significantly improve performance and functionality when properly implemented.'
                    }
                ]
            });
            sections.push({
                title: 'Real-World Examples and Case Studies',
                content: [
                    {
                        type: 'paragraph',
                        text: 'Examining real-world implementations provides valuable insights into practical applications and potential challenges.'
                    }
                ]
            });
        }
        return sections;
    }
    /**
     * Generate conclusion
     */
    static generateConclusion(prompt, style) {
        const topic = this.extractMainTopic(prompt);
        return `${topic} offers powerful capabilities for modern development workflows. By understanding the core concepts and following best practices outlined in this guide, you can effectively implement these solutions in your projects. Continue exploring and experimenting to discover additional possibilities and optimizations.`;
    }
    /**
     * Detect if topic is technical
     */
    static isTechnicalTopic(prompt) {
        const technicalKeywords = ['api', 'docker', 'kubernetes', 'react', 'node', 'javascript', 'python', 'database', 'deployment', 'configuration', 'setup', 'implementation'];
        return technicalKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
    }
    /**
     * Detect programming language from prompt
     */
    static detectLanguage(prompt) {
        // For now, always return 'javascript' to ensure compatibility
        // TODO: Check PayloadCMS language configuration and use supported languages
        return 'javascript';
    }
    /**
     * Generate sample code based on prompt
     */
    static generateSampleCode(prompt) {
        const language = this.detectLanguage(prompt);
        if (language === 'docker' || prompt.toLowerCase().includes('docker')) {
            return `# Dockerfile example
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]`;
        }
        else if (language === 'python') {
            return `# Python implementation example
def main():
    """Main function implementation"""
    print("Hello, World!")

if __name__ == "__main__":
    main()`;
        }
        else {
            return `// JavaScript implementation example
const config = {
  environment: 'production',
  debug: false
};

function initialize() {
  console.log('Initializing application...');
  return config;
}

export { initialize, config };`;
        }
    }
    /**
     * Generate a unique block ID for PayloadCMS blocks
     */
    static generateBlockId() {
        // Generate a random hex string similar to PayloadCMS IDs
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
