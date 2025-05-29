import { QdrantClient } from '@qdrant/js-client-rest';
import { 
  VectorStoreConfig, 
  EmbeddingVector, 
  SearchQuery, 
  ContextSearchResult,
  CodeChunk 
} from '../types/contextEngine';
import { embeddingService } from './embeddingService';

export class VectorStoreService {
  private client: QdrantClient | null = null;
  private config: VectorStoreConfig | null = null;
  private isInitialized = false;

  /**
   * Initialize the vector store connection
   */
  async initialize(config: VectorStoreConfig): Promise<void> {
    try {
      this.config = config;
      
      this.client = new QdrantClient({
        url: config.url,
        apiKey: config.apiKey,
      });

      // Test connection
      await this.client.getCollections();
      
      // Ensure collection exists
      await this.ensureCollection();
      
      this.isInitialized = true;
      console.log('Vector store initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  /**
   * Ensure the collection exists with proper configuration
   */
  private async ensureCollection(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        col => col.name === this.config!.collectionName
      );

      if (!collectionExists) {
        // Create collection
        await this.client.createCollection(this.config.collectionName, {
          vectors: {
            size: this.config.vectorSize,
            distance: this.config.distance,
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        console.log(`Created collection: ${this.config.collectionName}`);
      }

      // Create index for better performance
      await this.createIndexes();

    } catch (error) {
      console.error('Failed to ensure collection:', error);
      throw error;
    }
  }

  /**
   * Create indexes for better search performance
   */
  private async createIndexes(): Promise<void> {
    if (!this.client || !this.config) return;

    try {
      // Create payload indexes for common filter fields
      const indexFields = [
        'filePath',
        'language',
        'type',
        'lastModified'
      ];

      for (const field of indexFields) {
        try {
          await this.client.createPayloadIndex(this.config.collectionName, {
            field_name: field,
            field_schema: 'keyword'
          });
        } catch (error) {
          // Index might already exist, ignore error
          console.debug(`Index for ${field} might already exist`);
        }
      }

    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }

  /**
   * Store embeddings in the vector database
   */
  async storeEmbeddings(embeddings: EmbeddingVector[]): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      const points = embeddings.map(embedding => ({
        id: embedding.id,
        vector: embedding.vector,
        payload: {
          chunkId: embedding.chunkId,
          filePath: embedding.metadata.filePath,
          language: embedding.metadata.language,
          type: embedding.metadata.type,
          lastModified: embedding.metadata.lastModified,
        }
      }));

      await this.client.upsert(this.config.collectionName, {
        wait: true,
        points
      });

      console.log(`Stored ${embeddings.length} embeddings`);

    } catch (error) {
      console.error('Failed to store embeddings:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async search(query: SearchQuery, chunks: Map<string, CodeChunk>): Promise<ContextSearchResult[]> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddingService.generateEmbedding(query.query);

      // Prepare search filters
      const filter: any = {};
      if (query.filters) {
        Object.entries(query.filters).forEach(([key, value]) => {
          filter[key] = { match: { value } };
        });
      }

      // Perform vector search
      const searchResult = await this.client.search(this.config.collectionName, {
        vector: queryEmbedding,
        limit: query.limit || 10,
        score_threshold: query.threshold || 0.7,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        with_payload: query.includeMetadata !== false,
      });

      // Convert results to ContextSearchResult format
      const results: ContextSearchResult[] = [];

      for (const point of searchResult) {
        const chunkId = point.payload?.chunkId as string;
        const chunk = chunks.get(chunkId);

        if (chunk && point.score !== undefined) {
          results.push({
            chunk,
            similarity: point.score,
            relevanceScore: this.calculateRelevanceScore(point.score, chunk, query.query),
            explanation: this.generateExplanation(chunk, query.query, point.score)
          });
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      return results;

    } catch (error) {
      console.error('Failed to search vectors:', error);
      throw error;
    }
  }

  /**
   * Delete embeddings by filter
   */
  async deleteEmbeddings(filter: Record<string, any>): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      const deleteFilter: any = {};
      Object.entries(filter).forEach(([key, value]) => {
        deleteFilter[key] = { match: { value } };
      });

      await this.client.delete(this.config.collectionName, {
        filter: deleteFilter,
        wait: true
      });

      console.log('Deleted embeddings with filter:', filter);

    } catch (error) {
      console.error('Failed to delete embeddings:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getStats(): Promise<any> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      const info = await this.client.getCollection(this.config.collectionName);
      return {
        pointsCount: info.points_count,
        vectorsCount: info.vectors_count,
        indexedVectorsCount: info.indexed_vectors_count,
        status: info.status
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }

  /**
   * Calculate relevance score based on similarity and content analysis
   */
  private calculateRelevanceScore(
    similarity: number, 
    chunk: CodeChunk, 
    query: string
  ): number {
    let score = similarity;

    // Boost score for exact keyword matches
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = chunk.content.toLowerCase().split(/\s+/);
    const exactMatches = queryWords.filter(word => contentWords.includes(word)).length;
    const exactMatchBoost = (exactMatches / queryWords.length) * 0.2;

    // Boost score for function/class names that match query
    if (chunk.metadata.name) {
      const nameMatch = queryWords.some(word => 
        chunk.metadata.name!.toLowerCase().includes(word)
      );
      if (nameMatch) score += 0.15;
    }

    // Boost score for recent files
    const daysSinceModified = (Date.now() - (chunk.metadata.lastModified || 0)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.max(0, (30 - daysSinceModified) / 30) * 0.1;

    // Boost score for certain chunk types
    const typeBoosts = {
      'function': 0.1,
      'class': 0.08,
      'interface': 0.06,
      'variable': 0.04,
      'comment': 0.02,
      'block': 0.0,
      'import': 0.01
    };

    const typeBoost = typeBoosts[chunk.type] || 0;

    return Math.min(1.0, score + exactMatchBoost + recencyBoost + typeBoost);
  }

  /**
   * Generate explanation for why a result is relevant
   */
  private generateExplanation(
    chunk: CodeChunk, 
    query: string, 
    similarity: number
  ): string {
    const explanations: string[] = [];

    // Similarity explanation
    if (similarity > 0.9) {
      explanations.push('Very high semantic similarity');
    } else if (similarity > 0.8) {
      explanations.push('High semantic similarity');
    } else if (similarity > 0.7) {
      explanations.push('Good semantic similarity');
    }

    // Content type explanation
    if (chunk.type === 'function' && chunk.metadata.name) {
      explanations.push(`Function: ${chunk.metadata.name}`);
    } else if (chunk.type === 'class' && chunk.metadata.name) {
      explanations.push(`Class: ${chunk.metadata.name}`);
    }

    // Keyword match explanation
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = chunk.content.toLowerCase();
    const matchingWords = queryWords.filter(word => contentWords.includes(word));
    
    if (matchingWords.length > 0) {
      explanations.push(`Matches keywords: ${matchingWords.join(', ')}`);
    }

    return explanations.join(' • ') || 'Semantic match found';
  }

  /**
   * Update embeddings for specific chunks
   */
  async updateEmbeddings(chunkIds: string[], newEmbeddings: EmbeddingVector[]): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      // Delete old embeddings
      for (const chunkId of chunkIds) {
        await this.client.delete(this.config.collectionName, {
          filter: {
            chunkId: { match: { value: chunkId } }
          },
          wait: true
        });
      }

      // Store new embeddings
      await this.storeEmbeddings(newEmbeddings);

    } catch (error) {
      console.error('Failed to update embeddings:', error);
      throw error;
    }
  }

  /**
   * Clear all data from the collection
   */
  async clearCollection(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Vector store not initialized');
    }

    try {
      await this.client.delete(this.config.collectionName, {
        filter: {},
        wait: true
      });

      console.log('Cleared all data from collection');

    } catch (error) {
      console.error('Failed to clear collection:', error);
      throw error;
    }
  }

  /**
   * Check if the service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): VectorStoreConfig | null {
    return this.config;
  }
}

// Singleton instance
export const vectorStoreService = new VectorStoreService();
