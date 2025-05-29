import OpenAI from 'openai';
import { 
  AIProvider, 
  ChatMessage, 
  ContextSearchResult, 
  CodeSuggestion 
} from '../types/contextEngine';
import { FileType } from '../types';
import { contextEngineService } from './contextEngine';
import { v4 as uuidv4 } from 'uuid';

export class AIService {
  private openai: OpenAI | null = null;
  private provider: AIProvider | null = null;
  private isInitialized = false;

  /**
   * Initialize the AI service with provider configuration
   */
  async initialize(provider: AIProvider): Promise<void> {
    try {
      this.provider = provider;

      switch (provider.type) {
        case 'openai':
          this.openai = new OpenAI({
            apiKey: provider.apiKey || 'placeholder-key',
            baseURL: provider.baseUrl,
            dangerouslyAllowBrowser: true // Note: Use backend proxy in production
          });
          break;

        case 'anthropic':
          // Anthropic integration would go here
          console.log('Anthropic integration not yet implemented');
          break;

        case 'local':
          // Local model integration would go here
          console.log('Local model integration not yet implemented');
          break;

        default:
          throw new Error(`Unsupported AI provider: ${provider.type}`);
      }

      // Test the connection
      if (this.openai) {
        await this.testConnection();
      }

      this.isInitialized = true;
      console.log(`AI service initialized with ${provider.type} provider`);

    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      // Don't throw to allow graceful degradation
      this.isInitialized = false;
    }
  }

  /**
   * Test the AI provider connection
   */
  private async testConnection(): Promise<void> {
    if (!this.openai) return;

    try {
      await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
    } catch (error) {
      console.warn('AI provider connection test failed:', error);
    }
  }

  /**
   * Generate a chat response with context
   */
  async generateChatResponse(
    messages: ChatMessage[],
    context?: ContextSearchResult[]
  ): Promise<ChatMessage> {
    if (!this.isInitialized || !this.openai || !this.provider) {
      throw new Error('AI service not initialized');
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const conversationMessages = this.buildConversationMessages(messages, systemPrompt);

      const response = await this.openai.chat.completions.create({
        model: this.provider.models[0] || 'gpt-4',
        messages: conversationMessages,
        max_tokens: this.provider.maxTokens,
        temperature: 0.7,
        stream: false
      });

      const content = response.choices[0]?.message?.content || 'No response generated';

      return {
        id: uuidv4(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        context,
        metadata: {
          model: this.provider.models[0],
          tokens: response.usage?.total_tokens,
          finishReason: response.choices[0]?.finish_reason
        }
      };

    } catch (error) {
      console.error('Failed to generate chat response:', error);
      throw error;
    }
  }

  /**
   * Generate code suggestions for a specific position
   */
  async generateCodeSuggestions(
    file: FileType,
    position: { line: number; column: number },
    context?: ContextSearchResult[]
  ): Promise<CodeSuggestion[]> {
    if (!this.isInitialized || !this.openai || !this.provider) {
      return [];
    }

    try {
      const prompt = this.buildCodeSuggestionPrompt(file, position, context);

      const response = await this.openai.chat.completions.create({
        model: this.provider.models[0] || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code completion assistant. Provide helpful, contextually relevant code suggestions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        n: 3 // Generate multiple suggestions
      });

      const suggestions: CodeSuggestion[] = [];

      response.choices.forEach((choice, index) => {
        const content = choice.message?.content?.trim();
        if (content) {
          suggestions.push({
            id: uuidv4(),
            type: 'completion',
            content,
            confidence: this.calculateConfidence(choice.finish_reason, index),
            position,
            context: context || []
          });
        }
      });

      return suggestions.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Failed to generate code suggestions:', error);
      return [];
    }
  }

  /**
   * Generate code documentation
   */
  async generateDocumentation(
    code: string,
    language: string,
    context?: ContextSearchResult[]
  ): Promise<string> {
    if (!this.isInitialized || !this.openai || !this.provider) {
      throw new Error('AI service not initialized');
    }

    try {
      const prompt = this.buildDocumentationPrompt(code, language, context);

      const response = await this.openai.chat.completions.create({
        model: this.provider.models[0] || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical writer. Generate clear, comprehensive documentation for code.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.5
      });

      return response.choices[0]?.message?.content || 'Unable to generate documentation';

    } catch (error) {
      console.error('Failed to generate documentation:', error);
      throw error;
    }
  }

  /**
   * Explain code functionality
   */
  async explainCode(
    code: string,
    language: string,
    context?: ContextSearchResult[]
  ): Promise<string> {
    if (!this.isInitialized || !this.openai || !this.provider) {
      throw new Error('AI service not initialized');
    }

    try {
      const prompt = this.buildExplanationPrompt(code, language, context);

      const response = await this.openai.chat.completions.create({
        model: this.provider.models[0] || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Explain code clearly and concisely, focusing on functionality and purpose.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Unable to explain code';

    } catch (error) {
      console.error('Failed to explain code:', error);
      throw error;
    }
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context?: ContextSearchResult[]): string {
    let prompt = `You are Morpheus IDE's AI assistant, an expert software developer with deep knowledge of multiple programming languages and frameworks.

Your role is to help developers by:
- Answering questions about code
- Providing code suggestions and completions
- Explaining complex concepts
- Helping with debugging and optimization
- Offering best practices and design patterns

Always provide accurate, helpful, and contextually relevant responses.`;

    if (context && context.length > 0) {
      prompt += '\n\nRelevant code context:\n';
      context.forEach((result, index) => {
        prompt += `\n--- Context ${index + 1} (${result.chunk.type} from ${result.chunk.filePath}) ---\n`;
        prompt += result.chunk.content;
        if (result.explanation) {
          prompt += `\n// Relevance: ${result.explanation}`;
        }
      });
    }

    return prompt;
  }

  /**
   * Build conversation messages for chat
   */
  private buildConversationMessages(
    messages: ChatMessage[],
    systemPrompt: string
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const conversationMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent messages (limit to last 10 to stay within token limits)
    const recentMessages = messages.slice(-10);
    
    recentMessages.forEach(message => {
      if (message.role !== 'system') {
        conversationMessages.push({
          role: message.role,
          content: message.content
        });
      }
    });

    return conversationMessages;
  }

  /**
   * Build prompt for code suggestions
   */
  private buildCodeSuggestionPrompt(
    file: FileType,
    position: { line: number; column: number },
    context?: ContextSearchResult[]
  ): string {
    const lines = file.content.split('\n');
    const currentLine = lines[position.line - 1] || '';
    const beforeCursor = currentLine.substring(0, position.column);
    const afterCursor = currentLine.substring(position.column);

    // Get surrounding context (5 lines before and after)
    const startLine = Math.max(0, position.line - 6);
    const endLine = Math.min(lines.length, position.line + 5);
    const surroundingCode = lines.slice(startLine, endLine).join('\n');

    let prompt = `File: ${file.name} (${file.language})
Current position: Line ${position.line}, Column ${position.column}

Code context:
\`\`\`${file.language}
${surroundingCode}
\`\`\`

Current line: "${currentLine}"
Before cursor: "${beforeCursor}"
After cursor: "${afterCursor}"

Please suggest appropriate code completions for this position. Consider:
- The current context and surrounding code
- Language-specific syntax and conventions
- Common patterns and best practices
- Variable names and function signatures in scope

Provide only the completion text, not the full line.`;

    if (context && context.length > 0) {
      prompt += '\n\nRelevant code patterns from the project:\n';
      context.slice(0, 3).forEach((result, index) => {
        prompt += `\n${index + 1}. ${result.chunk.type} from ${result.chunk.filePath}:\n`;
        prompt += `\`\`\`${result.chunk.language}\n${result.chunk.content}\n\`\`\`\n`;
      });
    }

    return prompt;
  }

  /**
   * Build prompt for documentation generation
   */
  private buildDocumentationPrompt(
    code: string,
    language: string,
    context?: ContextSearchResult[]
  ): string {
    let prompt = `Generate comprehensive documentation for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Please include:
- Purpose and functionality
- Parameters and return values
- Usage examples
- Any important notes or considerations

Use appropriate documentation format for ${language} (JSDoc, docstrings, etc.).`;

    if (context && context.length > 0) {
      prompt += '\n\nRelated code context:\n';
      context.slice(0, 2).forEach((result, index) => {
        prompt += `\n${index + 1}. ${result.chunk.filePath}:\n`;
        prompt += `\`\`\`${result.chunk.language}\n${result.chunk.content}\n\`\`\`\n`;
      });
    }

    return prompt;
  }

  /**
   * Build prompt for code explanation
   */
  private buildExplanationPrompt(
    code: string,
    language: string,
    context?: ContextSearchResult[]
  ): string {
    let prompt = `Explain the following ${language} code in clear, simple terms:

\`\`\`${language}
${code}
\`\`\`

Please explain:
- What this code does
- How it works
- Key concepts or patterns used
- Any potential issues or improvements`;

    if (context && context.length > 0) {
      prompt += '\n\nRelated code for additional context:\n';
      context.slice(0, 2).forEach((result, index) => {
        prompt += `\n${index + 1}. From ${result.chunk.filePath}:\n`;
        prompt += `\`\`\`${result.chunk.language}\n${result.chunk.content}\n\`\`\`\n`;
      });
    }

    return prompt;
  }

  /**
   * Calculate confidence score for suggestions
   */
  private calculateConfidence(finishReason?: string, index?: number): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on finish reason
    if (finishReason === 'stop') {
      confidence += 0.1;
    } else if (finishReason === 'length') {
      confidence -= 0.1;
    }

    // Adjust based on choice index (first choice is usually best)
    if (index !== undefined) {
      confidence -= index * 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): AIProvider | null {
    return this.provider;
  }

  /**
   * Update provider configuration
   */
  async updateProvider(provider: AIProvider): Promise<void> {
    await this.initialize(provider);
  }
}

// Singleton instance
export const aiService = new AIService();
