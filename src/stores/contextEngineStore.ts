import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { 
  ContextEngineStore, 
  ContextEngineConfig, 
  ProjectContext, 
  ContextPanelState,
  ChatSession,
  ChatMessage,
  ContextSearchResult,
  CodeSuggestion,
  ProjectSettings
} from '../types/contextEngine';
import { FileType, FolderType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const initialContextPanelState: ContextPanelState = {
  isOpen: false,
  activeTab: 'search',
  searchQuery: '',
  searchResults: [],
  isLoading: false,
};

export const useContextEngineStore = create<ContextEngineStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial State
      isInitialized: false,
      currentProject: null,
      contextPanel: initialContextPanelState,
      activeChatSession: null,
      recentSearches: [],
      suggestions: [],

      // Core Actions
      initializeEngine: async (config: ContextEngineConfig) => {
        try {
          set({ isInitialized: false });
          
          // Initialize vector store connection
          // Initialize AI provider
          // Initialize file watcher
          // This will be implemented in the service layer
          
          set({ isInitialized: true });
        } catch (error) {
          console.error('Failed to initialize context engine:', error);
          throw error;
        }
      },

      indexProject: async (files: (FileType | FolderType)[]) => {
        const state = get();
        if (!state.isInitialized) {
          throw new Error('Context engine not initialized');
        }

        try {
          set(state => ({
            contextPanel: {
              ...state.contextPanel,
              isLoading: true,
              error: undefined
            }
          }));

          // This will be implemented in the indexing service
          // 1. Parse files into chunks
          // 2. Generate embeddings
          // 3. Store in vector database
          // 4. Update project context

          const projectContext: ProjectContext = {
            id: uuidv4(),
            name: 'Current Project',
            rootPath: '/',
            language: ['typescript', 'javascript'],
            lastIndexed: Date.now(),
            totalFiles: countFiles(files),
            totalChunks: 0, // Will be calculated during indexing
            settings: {
              excludePatterns: ['node_modules/**', '.git/**', 'dist/**'],
              includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
              maxFileSize: 1024 * 1024, // 1MB
              chunkSize: 1000,
              chunkOverlap: 200,
              embeddingModel: 'text-embedding-ada-002',
              llmProvider: 'openai',
              llmModel: 'gpt-4',
              enableRealTimeIndexing: true,
              enableAICompletion: true,
              enableContextualChat: true,
            }
          };

          set(state => ({
            currentProject: projectContext,
            contextPanel: {
              ...state.contextPanel,
              isLoading: false
            }
          }));

        } catch (error) {
          set(state => ({
            contextPanel: {
              ...state.contextPanel,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }));
          throw error;
        }
      },

      searchContext: async (query: string, filters?: Record<string, any>) => {
        const state = get();
        if (!state.currentProject) {
          throw new Error('No project loaded');
        }

        try {
          set(state => ({
            contextPanel: {
              ...state.contextPanel,
              isLoading: true,
              searchQuery: query
            }
          }));

          // This will be implemented in the search service
          // 1. Generate query embedding
          // 2. Search vector database
          // 3. Rank and filter results
          // 4. Return formatted results

          const mockResults: ContextSearchResult[] = []; // Placeholder

          // Add to recent searches
          const recentSearches = [query, ...state.recentSearches.filter(s => s !== query)].slice(0, 10);

          set(state => ({
            contextPanel: {
              ...state.contextPanel,
              isLoading: false,
              searchResults: mockResults
            },
            recentSearches
          }));

          return mockResults;

        } catch (error) {
          set(state => ({
            contextPanel: {
              ...state.contextPanel,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Search failed'
            }
          }));
          throw error;
        }
      },

      startChatSession: (projectId: string) => {
        const session: ChatSession = {
          id: uuidv4(),
          projectId,
          title: 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        set({ activeChatSession: session });
        return session;
      },

      sendMessage: async (sessionId: string, content: string) => {
        const state = get();
        const session = state.activeChatSession;
        
        if (!session || session.id !== sessionId) {
          throw new Error('Chat session not found');
        }

        const userMessage: ChatMessage = {
          id: uuidv4(),
          role: 'user',
          content,
          timestamp: Date.now()
        };

        // Add user message immediately
        set(state => ({
          activeChatSession: state.activeChatSession ? {
            ...state.activeChatSession,
            messages: [...state.activeChatSession.messages, userMessage],
            updatedAt: Date.now()
          } : null
        }));

        try {
          // This will be implemented in the AI service
          // 1. Search for relevant context
          // 2. Construct prompt with context
          // 3. Call LLM API
          // 4. Stream response

          const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: 'This is a placeholder response. AI integration coming soon!',
            timestamp: Date.now(),
            context: [] // Will include relevant context
          };

          set(state => ({
            activeChatSession: state.activeChatSession ? {
              ...state.activeChatSession,
              messages: [...state.activeChatSession.messages, assistantMessage],
              updatedAt: Date.now()
            } : null
          }));

          return assistantMessage;

        } catch (error) {
          // Add error message
          const errorMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: Date.now()
          };

          set(state => ({
            activeChatSession: state.activeChatSession ? {
              ...state.activeChatSession,
              messages: [...state.activeChatSession.messages, errorMessage],
              updatedAt: Date.now()
            } : null
          }));

          throw error;
        }
      },

      generateSuggestions: async (file: FileType, position: { line: number; column: number }) => {
        const state = get();
        if (!state.currentProject) {
          return [];
        }

        try {
          // This will be implemented in the suggestion service
          // 1. Analyze current context
          // 2. Search for relevant patterns
          // 3. Generate AI-powered suggestions
          // 4. Rank by relevance

          const suggestions: CodeSuggestion[] = []; // Placeholder

          set({ suggestions });
          return suggestions;

        } catch (error) {
          console.error('Failed to generate suggestions:', error);
          return [];
        }
      },

      updateProjectSettings: (settings: Partial<ProjectSettings>) => {
        set(state => ({
          currentProject: state.currentProject ? {
            ...state.currentProject,
            settings: {
              ...state.currentProject.settings,
              ...settings
            }
          } : null
        }));
      },

      // UI Actions
      toggleContextPanel: () => {
        set(state => ({
          contextPanel: {
            ...state.contextPanel,
            isOpen: !state.contextPanel.isOpen
          }
        }));
      },

      setActiveTab: (tab: ContextPanelState['activeTab']) => {
        set(state => ({
          contextPanel: {
            ...state.contextPanel,
            activeTab: tab
          }
        }));
      },

      setSearchQuery: (query: string) => {
        set(state => ({
          contextPanel: {
            ...state.contextPanel,
            searchQuery: query
          }
        }));
      },

      clearSearchResults: () => {
        set(state => ({
          contextPanel: {
            ...state.contextPanel,
            searchResults: [],
            searchQuery: ''
          }
        }));
      },
    })),
    {
      name: 'context-engine-store',
    }
  )
);

// Helper function to count files recursively
function countFiles(items: (FileType | FolderType)[]): number {
  let count = 0;
  for (const item of items) {
    if ('content' in item) {
      count++;
    } else {
      count += countFiles(item.items);
    }
  }
  return count;
}

// Selectors for common state access
export const useContextPanel = () => useContextEngineStore(state => state.contextPanel);
export const useCurrentProject = () => useContextEngineStore(state => state.currentProject);
export const useActiveChatSession = () => useContextEngineStore(state => state.activeChatSession);
export const useIsInitialized = () => useContextEngineStore(state => state.isInitialized);
