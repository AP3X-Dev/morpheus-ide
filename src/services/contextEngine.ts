import { 
  ContextEngineConfig, 
  CodeChunk, 
  EmbeddingVector, 
  ContextSearchResult,
  FileChangeEvent,
  ProjectContext,
  SearchQuery
} from '../types/contextEngine';
import { FileType, FolderType } from '../types';
import { fileWatcherService } from './fileWatcher';
import { codeParserService } from './codeParser';
import { embeddingService } from './embeddingService';
import { vectorStoreService } from './vectorStore';

export class ContextEngineService {
  private config: ContextEngineConfig | null = null;
  private isInitialized = false;
  private chunks: Map<string, CodeChunk> = new Map();
  private fileToChunks: Map<string, string[]> = new Map();
  private isIndexing = false;
  private indexingProgress = 0;

  /**
   * Initialize the context engine with configuration
   */
  async initialize(config: ContextEngineConfig): Promise<void> {
    try {
      this.config = config;

      // Initialize all services
      await Promise.all([
        codeParserService.initialize(),
        embeddingService.initialize(config.aiProvider.apiKey, config.project.embeddingModel),
        vectorStoreService.initialize(config.vectorStore)
      ]);

      // Set up file watcher
      this.setupFileWatcher();

      this.isInitialized = true;
      console.log('Context engine initialized successfully');

    } catch (error) {
      console.error('Failed to initialize context engine:', error);
      throw error;
    }
  }

  /**
   * Index a project's files
   */
  async indexProject(files: (FileType | FolderType)[], onProgress?: (progress: number) => void): Promise<ProjectContext> {
    if (!this.isInitialized) {
      throw new Error('Context engine not initialized');
    }

    this.isIndexing = true;
    this.indexingProgress = 0;

    try {
      // Clear existing data
      this.chunks.clear();
      this.fileToChunks.clear();
      await vectorStoreService.clearCollection();

      // Extract all files
      const allFiles = this.extractFiles(files);
      const totalFiles = allFiles.length;

      console.log(`Starting indexing of ${totalFiles} files`);

      // Process files in batches
      const batchSize = 10;
      let processedFiles = 0;
      let totalChunks = 0;

      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        
        // Parse files into chunks
        const batchChunks: CodeChunk[] = [];
        for (const file of batch) {
          if (this.shouldProcessFile(file)) {
            const fileChunks = await codeParserService.parseFile(file);
            batchChunks.push(...fileChunks);
            
            // Store chunk mappings
            const chunkIds = fileChunks.map(chunk => chunk.id);
            this.fileToChunks.set(file.name, chunkIds);
            
            fileChunks.forEach(chunk => {
              this.chunks.set(chunk.id, chunk);
            });
          }
          
          processedFiles++;
          this.indexingProgress = (processedFiles / totalFiles) * 0.7; // 70% for parsing
          
          if (onProgress) {
            onProgress(this.indexingProgress);
          }
        }

        // Generate embeddings for batch
        if (batchChunks.length > 0) {
          const embeddings = await embeddingService.generateEmbeddings(batchChunks);
          await vectorStoreService.storeEmbeddings(embeddings);
          totalChunks += batchChunks.length;
        }

        // Update progress
        this.indexingProgress = 0.7 + ((i + batchSize) / totalFiles) * 0.3; // 30% for embedding
        if (onProgress) {
          onProgress(this.indexingProgress);
        }
      }

      // Create project context
      const projectContext: ProjectContext = {
        id: `project-${Date.now()}`,
        name: 'Current Project',
        rootPath: '/',
        language: this.detectProjectLanguages(allFiles),
        lastIndexed: Date.now(),
        totalFiles: allFiles.length,
        totalChunks,
        settings: this.config!.project
      };

      this.isIndexing = false;
      this.indexingProgress = 1.0;

      if (onProgress) {
        onProgress(1.0);
      }

      console.log(`Indexing completed: ${totalFiles} files, ${totalChunks} chunks`);
      return projectContext;

    } catch (error) {
      this.isIndexing = false;
      console.error('Failed to index project:', error);
      throw error;
    }
  }

  /**
   * Search for relevant code context
   */
  async searchContext(query: string, filters?: Record<string, any>): Promise<ContextSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Context engine not initialized');
    }

    try {
      const searchQuery: SearchQuery = {
        query,
        filters,
        limit: 20,
        threshold: 0.7,
        includeMetadata: true
      };

      const results = await vectorStoreService.search(searchQuery, this.chunks);
      
      // Post-process results for better ranking
      return this.rankResults(results, query);

    } catch (error) {
      console.error('Failed to search context:', error);
      throw error;
    }
  }

  /**
   * Handle file changes for real-time indexing
   */
  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    if (!this.config?.project.enableRealTimeIndexing || this.isIndexing) {
      return;
    }

    try {
      switch (event.type) {
        case 'add':
        case 'change':
          await this.reindexFile(event.path);
          break;
          
        case 'unlink':
          await this.removeFileFromIndex(event.path);
          break;
          
        case 'unlinkDir':
          await this.removeDirectoryFromIndex(event.path);
          break;
      }
    } catch (error) {
      console.error('Failed to handle file change:', event, error);
    }
  }

  /**
   * Re-index a single file
   */
  private async reindexFile(filePath: string): Promise<void> {
    try {
      // Remove existing chunks for this file
      await this.removeFileFromIndex(filePath);

      // Note: In a real implementation, you would read the file content
      // For now, we'll skip this as it requires file system access
      console.log(`Would re-index file: ${filePath}`);

    } catch (error) {
      console.error('Failed to re-index file:', filePath, error);
    }
  }

  /**
   * Remove file from index
   */
  private async removeFileFromIndex(filePath: string): Promise<void> {
    try {
      const chunkIds = this.fileToChunks.get(filePath);
      if (chunkIds) {
        // Remove chunks from memory
        chunkIds.forEach(chunkId => {
          this.chunks.delete(chunkId);
        });

        // Remove from vector store
        await vectorStoreService.deleteEmbeddings({ filePath });

        // Remove mapping
        this.fileToChunks.delete(filePath);
      }
    } catch (error) {
      console.error('Failed to remove file from index:', filePath, error);
    }
  }

  /**
   * Remove directory from index
   */
  private async removeDirectoryFromIndex(dirPath: string): Promise<void> {
    try {
      const filesToRemove: string[] = [];
      
      for (const filePath of this.fileToChunks.keys()) {
        if (filePath.startsWith(dirPath)) {
          filesToRemove.push(filePath);
        }
      }

      for (const filePath of filesToRemove) {
        await this.removeFileFromIndex(filePath);
      }
    } catch (error) {
      console.error('Failed to remove directory from index:', dirPath, error);
    }
  }

  /**
   * Setup file watcher for real-time updates
   */
  private setupFileWatcher(): void {
    if (!this.config?.project.enableRealTimeIndexing) {
      return;
    }

    fileWatcherService.onFileChange((event) => {
      this.handleFileChange(event);
    });
  }

  /**
   * Extract all files from the file tree
   */
  private extractFiles(items: (FileType | FolderType)[]): FileType[] {
    const files: FileType[] = [];

    const traverse = (items: (FileType | FolderType)[]) => {
      for (const item of items) {
        if ('content' in item) {
          files.push(item);
        } else {
          traverse(item.items);
        }
      }
    };

    traverse(items);
    return files;
  }

  /**
   * Check if a file should be processed
   */
  private shouldProcessFile(file: FileType): boolean {
    if (!this.config) return false;

    const { excludePatterns, includePatterns, maxFileSize } = this.config.project;

    // Check file size
    if (file.content.length > maxFileSize) {
      return false;
    }

    // Check exclude patterns
    if (excludePatterns.some(pattern => this.matchesPattern(file.name, pattern))) {
      return false;
    }

    // Check include patterns
    if (includePatterns.length > 0) {
      return includePatterns.some(pattern => this.matchesPattern(file.name, pattern));
    }

    return true;
  }

  /**
   * Check if filename matches a pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(filename);
  }

  /**
   * Detect project languages
   */
  private detectProjectLanguages(files: FileType[]): string[] {
    const languages = new Set<string>();
    
    files.forEach(file => {
      languages.add(file.language);
    });

    return Array.from(languages);
  }

  /**
   * Rank search results
   */
  private rankResults(results: ContextSearchResult[], query: string): ContextSearchResult[] {
    // Additional ranking logic can be added here
    return results.sort((a, b) => {
      // Primary sort by relevance score
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      // Secondary sort by similarity
      return b.similarity - a.similarity;
    });
  }

  /**
   * Get indexing progress
   */
  getIndexingProgress(): number {
    return this.indexingProgress;
  }

  /**
   * Check if currently indexing
   */
  isCurrentlyIndexing(): boolean {
    return this.isIndexing;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    const vectorStats = await vectorStoreService.getStats();
    
    return {
      isInitialized: this.isInitialized,
      totalChunks: this.chunks.size,
      totalFiles: this.fileToChunks.size,
      isIndexing: this.isIndexing,
      indexingProgress: this.indexingProgress,
      vectorStore: vectorStats,
      services: {
        parser: codeParserService.isReady(),
        embedding: embeddingService.isReady(),
        vectorStore: vectorStoreService.isReady(),
        fileWatcher: fileWatcherService.isActive()
      }
    };
  }

  /**
   * Shutdown the context engine
   */
  async shutdown(): Promise<void> {
    try {
      await fileWatcherService.stopWatching();
      this.chunks.clear();
      this.fileToChunks.clear();
      this.isInitialized = false;
      
      console.log('Context engine shut down successfully');
    } catch (error) {
      console.error('Failed to shutdown context engine:', error);
    }
  }
}

// Singleton instance
export const contextEngineService = new ContextEngineService();
