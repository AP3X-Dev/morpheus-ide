import { FileType, FolderType } from './index';

// Core Context Engine Types
export interface CodeChunk {
  id: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'import' | 'comment' | 'block';
  metadata: {
    name?: string;
    signature?: string;
    docstring?: string;
    complexity?: number;
    dependencies?: string[];
  };
}

export interface EmbeddingVector {
  id: string;
  vector: number[];
  chunkId: string;
  metadata: {
    filePath: string;
    language: string;
    type: string;
    lastModified: number;
  };
}

export interface ContextSearchResult {
  chunk: CodeChunk;
  similarity: number;
  relevanceScore: number;
  explanation?: string;
}

export interface CodeRelationship {
  sourceId: string;
  targetId: string;
  type: 'imports' | 'calls' | 'extends' | 'implements' | 'references' | 'defines';
  strength: number;
  metadata?: Record<string, any>;
}

export interface ProjectContext {
  id: string;
  name: string;
  rootPath: string;
  language: string[];
  framework?: string;
  lastIndexed: number;
  totalFiles: number;
  totalChunks: number;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  excludePatterns: string[];
  includePatterns: string[];
  maxFileSize: number;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  llmProvider: 'openai' | 'anthropic' | 'local';
  llmModel: string;
  enableRealTimeIndexing: boolean;
  enableAICompletion: boolean;
  enableContextualChat: boolean;
}

// AI Integration Types
export interface AIProvider {
  name: string;
  type: 'openai' | 'anthropic' | 'local';
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  maxTokens: number;
  supportsStreaming: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: ContextSearchResult[];
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  projectId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// File System Watcher Types
export interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: number;
  stats?: {
    size: number;
    mtime: number;
  };
}

export interface WatcherConfig {
  ignored: string[];
  persistent: boolean;
  ignoreInitial: boolean;
  followSymlinks: boolean;
  depth: number;
  awaitWriteFinish: {
    stabilityThreshold: number;
    pollInterval: number;
  };
}

// Vector Store Types
export interface VectorStoreConfig {
  url: string;
  apiKey?: string;
  collectionName: string;
  vectorSize: number;
  distance: 'cosine' | 'euclidean' | 'dot';
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
}

// UI Component Types
export interface ContextPanelState {
  isOpen: boolean;
  activeTab: 'search' | 'chat' | 'relationships' | 'insights';
  searchQuery: string;
  searchResults: ContextSearchResult[];
  isLoading: boolean;
  error?: string;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'documentation' | 'fix';
  content: string;
  confidence: number;
  position: {
    line: number;
    column: number;
  };
  context: ContextSearchResult[];
}

// Configuration Types
export interface ContextEngineConfig {
  vectorStore: VectorStoreConfig;
  aiProvider: AIProvider;
  fileWatcher: WatcherConfig;
  project: ProjectSettings;
  ui: {
    enableHoverTooltips: boolean;
    enableInlineSuggestions: boolean;
    enableContextPanel: boolean;
    suggestionDelay: number;
    maxSuggestions: number;
  };
}

// Store Types (for Zustand)
export interface ContextEngineStore {
  // State
  isInitialized: boolean;
  currentProject: ProjectContext | null;
  contextPanel: ContextPanelState;
  activeChatSession: ChatSession | null;
  recentSearches: string[];
  suggestions: CodeSuggestion[];
  
  // Actions
  initializeEngine: (config: ContextEngineConfig) => Promise<void>;
  indexProject: (files: (FileType | FolderType)[]) => Promise<void>;
  searchContext: (query: string, filters?: Record<string, any>) => Promise<ContextSearchResult[]>;
  startChatSession: (projectId: string) => ChatSession;
  sendMessage: (sessionId: string, content: string) => Promise<ChatMessage>;
  generateSuggestions: (file: FileType, position: { line: number; column: number }) => Promise<CodeSuggestion[]>;
  updateProjectSettings: (settings: Partial<ProjectSettings>) => void;
  
  // UI Actions
  toggleContextPanel: () => void;
  setActiveTab: (tab: ContextPanelState['activeTab']) => void;
  setSearchQuery: (query: string) => void;
  clearSearchResults: () => void;
}

// Error Types
export interface ContextEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  indexingTime: number;
  searchLatency: number;
  embeddingGenerationTime: number;
  vectorStoreLatency: number;
  memoryUsage: number;
  cacheHitRate: number;
}
