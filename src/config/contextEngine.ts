import { ContextEngineConfig } from '../types/contextEngine';

/**
 * Default configuration for the Context Engine
 */
export const defaultContextEngineConfig: ContextEngineConfig = {
  vectorStore: {
    url: process.env.REACT_APP_QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.REACT_APP_QDRANT_API_KEY,
    collectionName: 'morpheus-code',
    vectorSize: 1536, // OpenAI ada-002 embedding size
    distance: 'cosine'
  },

  aiProvider: {
    name: 'OpenAI',
    type: 'openai',
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
    baseUrl: process.env.REACT_APP_OPENAI_BASE_URL,
    models: ['gpt-4', 'gpt-3.5-turbo'],
    maxTokens: 4000,
    supportsStreaming: true
  },

  fileWatcher: {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/*.log',
      '**/.DS_Store',
      '**/Thumbs.db'
    ],
    persistent: true,
    ignoreInitial: true,
    followSymlinks: false,
    depth: 10,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  },

  project: {
    excludePatterns: [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.log',
      '.DS_Store',
      'Thumbs.db'
    ],
    includePatterns: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.py',
      '**/*.java',
      '**/*.cpp',
      '**/*.c',
      '**/*.h',
      '**/*.cs',
      '**/*.php',
      '**/*.rb',
      '**/*.go',
      '**/*.rs',
      '**/*.swift',
      '**/*.kt',
      '**/*.scala',
      '**/*.clj',
      '**/*.html',
      '**/*.css',
      '**/*.scss',
      '**/*.sass',
      '**/*.json',
      '**/*.xml',
      '**/*.yaml',
      '**/*.yml',
      '**/*.md',
      '**/*.txt',
      '**/*.sql'
    ],
    maxFileSize: 1024 * 1024, // 1MB
    chunkSize: 1000,
    chunkOverlap: 200,
    embeddingModel: 'text-embedding-ada-002',
    llmProvider: 'openai',
    llmModel: 'gpt-4',
    enableRealTimeIndexing: true,
    enableAICompletion: true,
    enableContextualChat: true
  },

  ui: {
    enableHoverTooltips: true,
    enableInlineSuggestions: true,
    enableContextPanel: true,
    suggestionDelay: 1000,
    maxSuggestions: 5
  }
};

/**
 * Development configuration with mock services
 */
export const developmentConfig: ContextEngineConfig = {
  ...defaultContextEngineConfig,
  vectorStore: {
    ...defaultContextEngineConfig.vectorStore,
    url: 'mock://localhost:6333' // Use mock vector store for development
  },
  aiProvider: {
    ...defaultContextEngineConfig.aiProvider,
    apiKey: 'demo-key' // Use mock AI provider for development
  }
};

/**
 * Production configuration
 */
export const productionConfig: ContextEngineConfig = {
  ...defaultContextEngineConfig,
  project: {
    ...defaultContextEngineConfig.project,
    enableRealTimeIndexing: false, // Disable for better performance in production
    chunkSize: 1500, // Larger chunks for production
    chunkOverlap: 300
  },
  ui: {
    ...defaultContextEngineConfig.ui,
    suggestionDelay: 1500, // Longer delay to reduce API calls
    maxSuggestions: 3
  }
};

/**
 * Get configuration based on environment
 */
export function getContextEngineConfig(): ContextEngineConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: ContextEngineConfig): string[] {
  const errors: string[] = [];

  // Validate vector store config
  if (!config.vectorStore.url) {
    errors.push('Vector store URL is required');
  }
  if (config.vectorStore.vectorSize <= 0) {
    errors.push('Vector size must be positive');
  }

  // Validate AI provider config
  if (!config.aiProvider.apiKey && config.aiProvider.type !== 'local') {
    errors.push('AI provider API key is required');
  }
  if (config.aiProvider.models.length === 0) {
    errors.push('At least one AI model must be specified');
  }

  // Validate project config
  if (config.project.maxFileSize <= 0) {
    errors.push('Max file size must be positive');
  }
  if (config.project.chunkSize <= 0) {
    errors.push('Chunk size must be positive');
  }
  if (config.project.chunkOverlap < 0) {
    errors.push('Chunk overlap cannot be negative');
  }
  if (config.project.chunkOverlap >= config.project.chunkSize) {
    errors.push('Chunk overlap must be less than chunk size');
  }

  return errors;
}

/**
 * Create a custom configuration
 */
export function createCustomConfig(overrides: Partial<ContextEngineConfig>): ContextEngineConfig {
  return {
    ...defaultContextEngineConfig,
    ...overrides,
    vectorStore: {
      ...defaultContextEngineConfig.vectorStore,
      ...overrides.vectorStore
    },
    aiProvider: {
      ...defaultContextEngineConfig.aiProvider,
      ...overrides.aiProvider
    },
    fileWatcher: {
      ...defaultContextEngineConfig.fileWatcher,
      ...overrides.fileWatcher
    },
    project: {
      ...defaultContextEngineConfig.project,
      ...overrides.project
    },
    ui: {
      ...defaultContextEngineConfig.ui,
      ...overrides.ui
    }
  };
}

/**
 * Language-specific configurations
 */
export const languageConfigs = {
  typescript: {
    includePatterns: ['**/*.ts', '**/*.tsx'],
    excludePatterns: ['**/*.d.ts', '**/node_modules/**'],
    chunkSize: 800,
    embeddingModel: 'text-embedding-ada-002'
  },
  javascript: {
    includePatterns: ['**/*.js', '**/*.jsx'],
    excludePatterns: ['**/node_modules/**', '**/dist/**'],
    chunkSize: 800,
    embeddingModel: 'text-embedding-ada-002'
  },
  python: {
    includePatterns: ['**/*.py'],
    excludePatterns: ['**/__pycache__/**', '**/venv/**', '**/env/**'],
    chunkSize: 1000,
    embeddingModel: 'text-embedding-ada-002'
  },
  java: {
    includePatterns: ['**/*.java'],
    excludePatterns: ['**/target/**', '**/build/**'],
    chunkSize: 1200,
    embeddingModel: 'text-embedding-ada-002'
  }
};

/**
 * Get language-specific configuration
 */
export function getLanguageConfig(language: string): Partial<ContextEngineConfig> | null {
  const config = languageConfigs[language as keyof typeof languageConfigs];
  if (!config) return null;

  return {
    project: {
      ...defaultContextEngineConfig.project,
      includePatterns: config.includePatterns,
      excludePatterns: [...defaultContextEngineConfig.project.excludePatterns, ...config.excludePatterns],
      chunkSize: config.chunkSize,
      embeddingModel: config.embeddingModel
    }
  };
}
