// Note: File watching is disabled in browser environment
// This is a mock implementation for development
import { FileChangeEvent, WatcherConfig } from '../types/contextEngine';
import { FileType } from '../types';
import { getFileLanguage } from '../utils/fileUtils';

export class FileWatcherService {
  private config: WatcherConfig;
  private changeHandlers: ((event: FileChangeEvent) => void)[] = [];
  private isWatching = false;

  constructor(config: Partial<WatcherConfig> = {}) {
    this.config = {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/.vscode/**',
        '**/.idea/**',
        '**/coverage/**',
        '**/*.log',
        '**/.DS_Store',
        '**/Thumbs.db',
        ...config.ignored || []
      ],
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 10,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50
      },
      ...config
    };
  }

  /**
   * Start watching a directory for file changes (mock implementation)
   */
  async startWatching(path: string): Promise<void> {
    console.log('File watching is not available in browser environment');
    this.isWatching = true;
  }

  /**
   * Stop watching for file changes (mock implementation)
   */
  async stopWatching(): Promise<void> {
    this.isWatching = false;
  }

  /**
   * Add a handler for file change events
   */
  onFileChange(handler: (event: FileChangeEvent) => void): () => void {
    this.changeHandlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.changeHandlers.indexOf(handler);
      if (index > -1) {
        this.changeHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Check if a file should be processed based on its extension
   */
  private shouldProcessFile(filePath: string): boolean {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs',
      '.swift', '.kt', '.scala', '.clj',
      '.html', '.css', '.scss', '.sass',
      '.json', '.xml', '.yaml', '.yml',
      '.md', '.txt', '.sql'
    ];

    return codeExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
  }

  /**
   * Handle file change events (mock implementation)
   */
  private handleFileChange(
    type: FileChangeEvent['type'],
    path: string,
    stats?: any
  ): void {
    // Mock implementation - just notify handlers
    const event: FileChangeEvent = {
      type,
      path,
      timestamp: Date.now(),
      stats: stats ? {
        size: stats.size,
        mtime: stats.mtime?.getTime() || Date.now()
      } : undefined
    };

    this.changeHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in file change handler:', error);
      }
    });
  }

  /**
   * Get current watching status
   */
  isActive(): boolean {
    return this.isWatching;
  }

  /**
   * Get list of watched paths (mock implementation)
   */
  getWatchedPaths(): string[] {
    return [];
  }

  /**
   * Update watcher configuration (mock implementation)
   */
  updateConfig(newConfig: Partial<WatcherConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Read file content for processing
   */
  async readFileContent(filePath: string): Promise<FileType | null> {
    try {
      // In a browser environment, we can't directly read files from the file system
      // This would need to be implemented differently for different environments
      // For now, return null as this will be handled by the file system utilities
      console.warn('Direct file reading not implemented in browser environment');
      return null;
    } catch (error) {
      console.error('Failed to read file:', filePath, error);
      return null;
    }
  }

  /**
   * Simulate file change for testing
   */
  simulateFileChange(type: FileChangeEvent['type'], path: string): void {
    this.handleFileChange(type, path);
  }
}

// Singleton instance for global use
export const fileWatcherService = new FileWatcherService();
