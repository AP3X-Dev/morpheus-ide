# Morpheus IDE

A modern, feature-rich code editor built with React and TypeScript, designed to provide a seamless development experience with advanced code analysis capabilities.

![Morpheus IDE](https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1920)

## Features

### 🚀 Core Features

- **Modern Editor Interface**
  - Syntax highlighting for multiple languages
  - Dark theme optimized for long coding sessions
  - Customizable editor settings

### 📊 Code Analysis Tools

- **File Tree Generation & Export**
  - Visual representation of project structure
  - Export in JSON, Markdown, or Text format
  - Customizable file exclusion patterns

- **Code Aggregation**
  - Combine multiple source files
  - Filter by file types
  - Export aggregated code

- **Dependency Analysis**
  - Track file dependencies and dependents
  - Visualize import relationships
  - Export dependency reports

- **Error Analysis**
  - Paste error logs or stack traces
  - Automatically extract relevant files
  - Analyze related dependencies

### 🛠️ Project Management

- **Project Import/Export**
  - Upload projects via ZIP
  - Export entire projects
  - Maintain project structure

- **Terminal Integration**
  - Built-in terminal window
  - Execute commands directly
  - View command output

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AP3X-DEV/morpheus-ide.git
```

2. Navigate to the project directory:
```bash
cd morpheus-ide
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Usage

### Basic Navigation

1. **File Explorer**
   - Located on the left side
   - Browse project files and folders
   - Click files to open in editor

2. **Editor**
   - Central workspace area
   - Multi-file editing
   - Syntax highlighting

3. **Terminal**
   - Toggle with terminal icon
   - Resizable interface
   - Execute commands

### Code Analysis

1. **Generate File Tree**
   - Click Code Context icon
   - Select "Tree" view
   - Click "Generate Tree"
   - Export in preferred format

2. **Analyze Dependencies**
   - Open Code Context
   - Select "Deps" view
   - Choose a file
   - View dependencies and dependents

3. **Aggregate Code**
   - Access Code Context
   - Choose "Code" view
   - Click "Aggregate Files"
   - Export combined code

4. **Error Analysis**
   - Open Code Context
   - Select "Paste" view
   - Paste error logs
   - Analyze affected files

## Configuration

### Exclusion Patterns

Customize which files to exclude from analysis:

1. Open Code Context
2. Go to "Config" view
3. Modify exclusion patterns
4. Common patterns:
   - `node_modules`
   - `.git`
   - `*.log`

### File Extensions

Define which file types to include:

1. Access settings
2. Add/remove extensions
3. Default extensions:
   - `.js`, `.jsx`
   - `.ts`, `.tsx`
   - `.py`
   - `.java`
   - `.cpp`, `.c`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with React and TypeScript
- Monaco Editor for code editing
- Lucide React for icons
- Tailwind CSS for styling