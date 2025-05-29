# Morpheus IDE - AI-Powered Context Engine

## Overview

The Morpheus IDE Context Engine is a comprehensive AI-powered system that provides real-time, full-codebase awareness through semantic search, intelligent code completion, and contextual assistance. It combines vector embeddings, semantic parsing, and large language models to deliver an enhanced development experience.

## Architecture

### Core Components

1. **Context Engine Service** (`src/services/contextEngine.ts`)
   - Main orchestrator for all AI features
   - Manages indexing, search, and real-time updates
   - Coordinates between all sub-services

2. **Code Parser Service** (`src/services/codeParser.ts`)
   - Semantic code parsing using Tree-sitter
   - Intelligent code chunking strategies
   - Metadata extraction (functions, classes, dependencies)

3. **Vector Store Service** (`src/services/vectorStore.ts`)
   - Qdrant vector database integration
   - Similarity search and ranking
   - Efficient storage and retrieval of embeddings

4. **Embedding Service** (`src/services/embeddingService.ts`)
   - OpenAI embedding generation
   - Batch processing and rate limiting
   - Fallback to mock embeddings for development

5. **AI Service** (`src/services/aiService.ts`)
   - LLM integration (OpenAI, Anthropic, local models)
   - Code completion and explanation
   - Contextual chat assistance

6. **File Watcher Service** (`src/services/fileWatcher.ts`)
   - Real-time file system monitoring
   - Debounced change detection
   - Incremental index updates

### Frontend Components

1. **Context Panel** (`src/components/ContextEngine/ContextPanel.tsx`)
   - Main UI for AI features
   - Tabbed interface (Search, Chat, Relationships, Insights)
   - Real-time status and progress indicators

2. **Enhanced Editor** (`src/components/ContextEngine/EnhancedEditor.tsx`)
   - Monaco Editor with AI enhancements
   - Hover tooltips with context
   - Inline suggestions and completions
   - AI-powered code actions

3. **Search Tab** (`src/components/ContextEngine/SearchTab.tsx`)
   - Natural language code search
   - Advanced filtering options
   - Recent searches and suggestions

4. **Chat Tab** (`src/components/ContextEngine/ChatTab.tsx`)
   - Conversational AI assistant
   - Context-aware responses
   - Code explanation and assistance

## Features

### 🔍 Semantic Code Search
- Natural language queries ("authentication functions", "error handling patterns")
- Vector similarity search with relevance ranking
- Advanced filtering by language, type, and file path
- Real-time search with instant results

### 💬 AI-Powered Chat
- Context-aware conversations about your codebase
- Code explanation and documentation generation
- Debugging assistance and optimization suggestions
- Integration with relevant code snippets

### ⚡ Intelligent Code Completion
- AI-generated code suggestions
- Context-aware completions based on surrounding code
- Multi-language support with language-specific patterns
- Confidence scoring and ranking

### 🔗 Code Relationships
- Dependency analysis and visualization
- Import/export tracking
- Function and class relationship mapping
- Interactive dependency graphs

### 💡 AI Insights
- Code quality analysis
- Security vulnerability detection
- Performance optimization suggestions
- Pattern recognition and best practices

### 🎯 Real-Time Features
- Live file monitoring and indexing
- Incremental updates on code changes
- Hover tooltips with contextual information
- Inline AI suggestions and quick fixes

## Setup and Configuration

### Prerequisites

1. **Vector Database (Qdrant)**
   ```bash
   # Using Docker
   docker run -p 6333:6333 qdrant/qdrant
   
   # Or install locally
   # See: https://qdrant.tech/documentation/quick-start/
   ```

2. **Environment Variables**
   ```bash
   # .env file
   REACT_APP_OPENAI_API_KEY=your_openai_api_key
   REACT_APP_QDRANT_URL=http://localhost:6333
   REACT_APP_QDRANT_API_KEY=optional_qdrant_api_key
   ```

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Initialize Context Engine**
   - The context engine will automatically initialize when you load a project
   - First-time indexing may take a few minutes depending on project size
   - AI features will be available once indexing is complete

### Configuration

The context engine can be configured through `src/config/contextEngine.ts`:

```typescript
import { getContextEngineConfig } from './src/config/contextEngine';

// Get default configuration
const config = getContextEngineConfig();

// Or create custom configuration
const customConfig = createCustomConfig({
  project: {
    chunkSize: 1500,
    enableRealTimeIndexing: false
  },
  aiProvider: {
    model: 'gpt-3.5-turbo'
  }
});
```

## Usage

### Basic Usage

1. **Load a Project**
   - Use "New Project" to create from templates
   - Upload a ZIP file or open local directory
   - Wait for initial indexing to complete

2. **Enable AI Features**
   - Click the ⚡ button in the toolbar to open the Context Panel
   - Toggle the AI Editor with the 🔧 button
   - Features will be available once the project is indexed

3. **Search Your Code**
   - Open the Context Panel and go to the Search tab
   - Type natural language queries like "user authentication"
   - Use filters to narrow down results by language or file type

4. **Chat with AI**
   - Switch to the Chat tab in the Context Panel
   - Ask questions about your codebase
   - Get explanations, suggestions, and debugging help

### Advanced Features

1. **Custom Filters**
   - Language-specific searches
   - File path filtering
   - Code type filtering (functions, classes, etc.)

2. **AI Completions**
   - Press `Ctrl+K` (or `Cmd+K`) to trigger AI suggestions
   - Use `Ctrl+Shift+K` to show context tooltips
   - AI suggestions appear automatically as you type

3. **Code Relationships**
   - Explore dependencies and dependents
   - Visualize code relationships
   - Track imports and exports

## Performance Optimization

### Indexing Performance
- Large projects are processed in batches
- Incremental updates for file changes
- Configurable chunk sizes and overlap
- Exclude patterns for irrelevant files

### Search Performance
- Vector similarity search with HNSW indexing
- Caching for frequent queries
- Debounced search requests
- Optimized embedding generation

### Memory Management
- Streaming responses for large results
- Lazy loading of code content
- Efficient vector storage
- Garbage collection for unused embeddings

## Troubleshooting

### Common Issues

1. **Context Engine Not Initializing**
   - Check that Qdrant is running on the configured port
   - Verify OpenAI API key is valid
   - Check browser console for error messages

2. **Slow Indexing**
   - Reduce chunk size in configuration
   - Add more exclude patterns for large files
   - Ensure sufficient system resources

3. **Poor Search Results**
   - Wait for complete indexing
   - Try different search terms
   - Check that relevant files are included in patterns

4. **AI Features Not Working**
   - Verify API keys are configured
   - Check network connectivity
   - Ensure project is properly indexed

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('morpheus-debug', 'true');
```

## Development

### Adding New Features

1. **New AI Providers**
   - Implement provider interface in `src/services/aiService.ts`
   - Add configuration options
   - Update UI components

2. **Custom Code Parsers**
   - Extend `src/services/codeParser.ts`
   - Add language-specific parsing rules
   - Update chunk type definitions

3. **Additional UI Components**
   - Follow existing component patterns
   - Use the context engine store for state management
   - Implement proper error handling

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Full documentation](https://your-docs-site.com)
- Community: [Discord/Slack channel](https://your-community-link.com)
