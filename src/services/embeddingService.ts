import OpenAI from 'openai';
import { CodeChunk, EmbeddingVector } from '../types/contextEngine';
import { v4 as uuidv4 } from 'uuid';

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private isInitialized = false;
  private model = 'text-embedding-ada-002';
  private maxTokens = 8191; // Max tokens for ada-002
  private batchSize = 100; // Process embeddings in batches

  /**
   * Initialize the embedding service
   */
  async initialize(apiKey?: string, model?: string): Promise<void> {
    try {
      if (!apiKey) {
        // Try to get from environment or use a placeholder
        apiKey = process.env.OPENAI_API_KEY || 'placeholder-key';
      }

      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
      });

      if (model) {
        this.model = model;
      }

      // Test the connection with a simple embedding
      await this.generateEmbedding('test');
      
      this.isInitialized = true;
      console.log('Embedding service initialized successfully');

    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      // Don't throw error to allow fallback to local embeddings
      this.isInitialized = false;
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized || !this.openai) {
      // Fallback to mock embedding for development
      return this.generateMockEmbedding(text);
    }

    try {
      // Truncate text if it's too long
      const truncatedText = this.truncateText(text);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedText,
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Fallback to mock embedding
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate embeddings for multiple code chunks
   */
  async generateEmbeddings(chunks: CodeChunk[]): Promise<EmbeddingVector[]> {
    const embeddings: EmbeddingVector[] = [];

    // Process in batches to avoid rate limits
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const batchEmbeddings = await this.processBatch(batch);
      embeddings.push(...batchEmbeddings);

      // Add delay between batches to respect rate limits
      if (i + this.batchSize < chunks.length) {
        await this.delay(100);
      }
    }

    return embeddings;
  }

  /**
   * Process a batch of chunks
   */
  private async processBatch(chunks: CodeChunk[]): Promise<EmbeddingVector[]> {
    const embeddings: EmbeddingVector[] = [];

    for (const chunk of chunks) {
      try {
        const text = this.prepareTextForEmbedding(chunk);
        const vector = await this.generateEmbedding(text);

        embeddings.push({
          id: uuidv4(),
          vector,
          chunkId: chunk.id,
          metadata: {
            filePath: chunk.filePath,
            language: chunk.language,
            type: chunk.type,
            lastModified: Date.now()
          }
        });

      } catch (error) {
        console.error('Failed to generate embedding for chunk:', chunk.id, error);
      }
    }

    return embeddings;
  }

  /**
   * Prepare text for embedding by combining content with metadata
   */
  private prepareTextForEmbedding(chunk: CodeChunk): string {
    const parts: string[] = [];

    // Add file path context
    parts.push(`File: ${chunk.filePath}`);

    // Add language context
    parts.push(`Language: ${chunk.language}`);

    // Add type context
    parts.push(`Type: ${chunk.type}`);

    // Add name if available
    if (chunk.metadata.name) {
      parts.push(`Name: ${chunk.metadata.name}`);
    }

    // Add signature if available
    if (chunk.metadata.signature) {
      parts.push(`Signature: ${chunk.metadata.signature}`);
    }

    // Add docstring if available
    if (chunk.metadata.docstring) {
      parts.push(`Documentation: ${chunk.metadata.docstring}`);
    }

    // Add the actual content
    parts.push(`Content: ${chunk.content}`);

    return parts.join('\n');
  }

  /**
   * Truncate text to fit within token limits
   */
  private truncateText(text: string): string {
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = this.maxTokens * 4;
    
    if (text.length <= maxChars) {
      return text;
    }

    // Truncate and add indicator
    return text.substring(0, maxChars - 20) + '\n[...truncated]';
  }

  /**
   * Generate mock embedding for development/fallback
   */
  private generateMockEmbedding(text: string): number[] {
    // Generate a deterministic but pseudo-random embedding based on text
    const hash = this.simpleHash(text);
    const embedding: number[] = [];
    
    // Generate 1536 dimensions (same as ada-002)
    for (let i = 0; i < 1536; i++) {
      // Use hash and index to generate pseudo-random values
      const value = Math.sin(hash + i) * 0.5;
      embedding.push(value);
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple hash function for generating deterministic mock embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Delay function for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update embedding model
   */
  setModel(model: string): void {
    this.model = model;
    
    // Update max tokens based on model
    const modelLimits: Record<string, number> = {
      'text-embedding-ada-002': 8191,
      'text-embedding-3-small': 8191,
      'text-embedding-3-large': 8191,
    };

    this.maxTokens = modelLimits[model] || 8191;
  }

  /**
   * Get current model information
   */
  getModelInfo(): { model: string; maxTokens: number; isInitialized: boolean } {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      isInitialized: this.isInitialized
    };
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude1 = Math.sqrt(norm1);
    const magnitude2 = Math.sqrt(norm2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Batch generate embeddings with progress callback
   */
  async generateEmbeddingsWithProgress(
    chunks: CodeChunk[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<EmbeddingVector[]> {
    const embeddings: EmbeddingVector[] = [];
    let completed = 0;

    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize);
      const batchEmbeddings = await this.processBatch(batch);
      embeddings.push(...batchEmbeddings);

      completed += batch.length;
      if (onProgress) {
        onProgress(completed, chunks.length);
      }

      // Add delay between batches
      if (i + this.batchSize < chunks.length) {
        await this.delay(100);
      }
    }

    return embeddings;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get embedding dimension for current model
   */
  getEmbeddingDimension(): number {
    const dimensions: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };

    return dimensions[this.model] || 1536;
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
