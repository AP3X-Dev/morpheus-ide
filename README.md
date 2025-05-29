# Morpheus IDE

A modern, feature-rich code editor built with React and TypeScript, designed to provide a seamless development experience with advanced code analysis capabilities.

![Morpheus IDE](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1920)

## ✨ Key Features

### 🎯 Intelligent Code Editor
- **Powerful Monaco Editor Integration**
  - Advanced syntax highlighting for 20+ languages
  - Smart code completion and IntelliSense
  - Real-time error detection and quick fixes
  - Multi-cursor editing and selection
  - Built-in code formatting

### 🔄 Project Management
- **Smart Project Templates**
  - Quick-start templates for popular frameworks
  - React, Next.js, Flask, Django, Express
  - AI development with LangChain
  - Mobile development with React Native

- **Flexible Project Import/Export**
  - Upload projects via ZIP
  - Import from local filesystem
  - Export entire projects with dependencies
  - Preserve project structure and settings

### 🧠 AI-Powered Context Engine
- **Semantic Code Search**
  - Natural language queries ("authentication functions", "error handling patterns")
  - Vector similarity search with relevance ranking
  - Advanced filtering by language, type, and file path
  - Real-time search with instant results

- **AI-Powered Chat Assistant**
  - Context-aware conversations about your codebase
  - Code explanation and documentation generation
  - Debugging assistance and optimization suggestions
  - Integration with relevant code snippets

- **Intelligent Code Completion**
  - AI-generated code suggestions based on context
  - Multi-language support with language-specific patterns
  - Confidence scoring and ranking
  - Real-time suggestions as you type

- **Code Relationships & Insights**
  - Dependency analysis and visualization
  - AI-powered code quality analysis
  - Security vulnerability detection
  - Performance optimization suggestions

- **Advanced Code Context**
  - Generate visual file trees
  - Track file dependencies
  - Analyze code relationships
  - Export documentation

### 💻 Development Environment
- **Integrated Terminal**
  - Full-featured command line interface
  - Multi-terminal support
  - Command history
  - Customizable shell

- **Git Integration**
  - Visual diff viewer
  - Commit history
  - Branch management
  - Pull request integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- **For AI Features (Optional)**:
  - OpenAI API key for AI completions and chat
  - Qdrant vector database for semantic search
  - 8GB+ RAM recommended for optimal AI performance

### Quick Start
1. Clone the repository:
   ```bash
   git clone https://github.com/AP3X-DEV/morpheus-ide.git
   ```

2. Install dependencies:
   ```bash
   cd morpheus-ide
   npm install
   ```

3. Set up environment variables (optional, for AI features):
   ```bash
   # Create .env file
   REACT_APP_OPENAI_API_KEY=your_openai_api_key
   REACT_APP_QDRANT_URL=http://localhost:6333
   ```

4. Start Qdrant vector database (optional, for AI features):
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The IDE will be available at `http://localhost:5173`

### AI Features Setup

#### Full AI Setup (Recommended)
For the complete AI experience with semantic search and intelligent completions:

1. **Get OpenAI API Key**: Sign up at [OpenAI](https://platform.openai.com/) and create an API key
2. **Start Qdrant**: Run the vector database using Docker (see step 4 above)
3. **Configure Environment**: Set your API keys in the `.env` file
4. **Load Project**: Import or create a project to enable AI indexing

#### Demo Mode
The IDE works without API keys using mock AI services. You can explore the interface and basic functionality, though AI features will be simulated.

## 💡 Usage Tips

### Project Management
1. Create new projects using templates:
   - Click the "+" icon
   - Select your framework
   - Configure project settings
   - Start coding immediately

2. Import existing projects:
   - Click the "Upload" icon
   - Choose ZIP file or local folder
   - Project structure is preserved
   - Files are automatically indexed

### Code Analysis
1. Generate file trees:
   - Open Code Context panel
   - Click "Generate Tree"
   - Export in JSON/Markdown/Text

2. Analyze dependencies:
   - Select a file
   - View dependencies and dependents
   - Export relationship diagrams

### Terminal Usage
1. Toggle terminal:
   - Click terminal icon
   - Use Cmd/Ctrl + ` shortcut
   - Resize as needed

2. Multiple terminals:
   - Click "+" for new terminal
   - Switch between sessions
   - Different shells per terminal

### AI Features Usage

1. **Enable AI Context Panel**:
   - Click the ⚡ button in the toolbar
   - Wait for project indexing to complete
   - Explore the four main tabs: Search, Chat, Relationships, Insights

2. **Semantic Code Search**:
   - Type natural language queries like "authentication functions"
   - Use filters to narrow results by language or file type
   - Click results to view code with context

3. **AI Chat Assistant**:
   - Ask questions about your codebase
   - Get explanations of complex code patterns
   - Request optimization suggestions and best practices

4. **Enhanced Code Editor**:
   - Toggle AI editor with the 🔧 button
   - Get real-time AI suggestions as you type
   - Use Ctrl+K (Cmd+K) for manual AI completions
   - Hover over code for contextual information

5. **Code Insights**:
   - View AI-generated code quality analysis
   - Get security vulnerability warnings
   - See performance optimization suggestions
   - Explore code relationship visualizations

## 🛠️ Configuration

### Editor Settings
- Theme customization
- Font preferences
- Tab size and indentation
- Auto-save options
- Key bindings

### Project Config
- Framework-specific settings
- Build configurations
- Environment variables
- Debug settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Monaco Editor for code editing
- Lucide React for icons
- Tailwind CSS for styling


Built with ❤️ by AP3X