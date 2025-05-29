import { useState, useEffect } from 'react';
import { Code2, Terminal as TerminalIcon, Download, X, Plus, FileSearch, Zap } from 'lucide-react';
import Editor from './components/Editor';
import EnhancedEditor from './components/ContextEngine/EnhancedEditor';
import ContextPanel from './components/ContextEngine/ContextPanel';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import Terminal from './components/Terminal';
import ProjectModal from './components/ProjectModal';
import CodeContextModal from './components/CodeContextModal';
import { exportProjectAsZip } from './utils/fileUtils';
import { openFile, openDirectory, saveFile } from './utils/fileSystem';
import { useContextEngineStore } from './stores/contextEngineStore';
import { contextEngineService } from './services/contextEngine';
import { embeddingService } from './services/embeddingService';
import { vectorStoreService } from './services/vectorStore';
import { aiService } from './services/aiService';
import { ContextEngineConfig } from './types/contextEngine';
import {
  createNextJsProject,
  createFlaskProject,
  createLangChainProject,
  createReactProject,
  createExpressProject,
  createDjangoProject,
  createReactNativeProject,
  createEthereumProject,
  createSolanaProject
} from './utils/projectTemplates';
import { FileType, FolderType } from './types';

const initialFiles: (FileType | FolderType)[] = [];

function App() {
  const [files, setFiles] = useState<(FileType | FolderType)[]>(initialFiles);
  const [openFiles, setOpenFiles] = useState<FileType[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCodeContextModalOpen, setIsCodeContextModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useEnhancedEditor, setUseEnhancedEditor] = useState(true);

  // Context Engine Store
  const {
    isInitialized,
    contextPanel,
    toggleContextPanel,
    initializeEngine,
    indexProject
  } = useContextEngineStore();

  // Initialize Context Engine on component mount
  useEffect(() => {
    const initializeContextEngine = async () => {
      try {
        const config: ContextEngineConfig = {
          vectorStore: {
            url: 'http://localhost:6333', // Default Qdrant URL
            collectionName: 'morpheus-code',
            vectorSize: 1536,
            distance: 'cosine'
          },
          aiProvider: {
            name: 'OpenAI',
            type: 'openai',
            apiKey: process.env.REACT_APP_OPENAI_API_KEY || 'demo-key',
            models: ['gpt-4', 'gpt-3.5-turbo'],
            maxTokens: 4000,
            supportsStreaming: true
          },
          fileWatcher: {
            ignored: ['**/node_modules/**', '**/.git/**'],
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
            excludePatterns: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
            includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java'],
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

        await initializeEngine(config);
      } catch (error) {
        console.error('Failed to initialize context engine:', error);
        setError('Failed to initialize AI features. Some functionality may be limited.');
      }
    };

    initializeContextEngine();
  }, [initializeEngine]);

  // Index project when files change
  useEffect(() => {
    if (isInitialized && files.length > 0) {
      indexProject(files).catch(error => {
        console.error('Failed to index project:', error);
        setError('Failed to index project for AI features.');
      });
    }
  }, [isInitialized, files, indexProject]);

  const handleFileSelect = (file: FileType) => {
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);
  };

  const handleTabClose = (fileId: string) => {
    setOpenFiles(openFiles.filter(f => f.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(openFiles[openFiles.length - 2]?.id || null);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    const toggleFolder = (items: (FileType | FolderType)[]): (FileType | FolderType)[] => {
      return items.map(item => {
        if ('items' in item && item.id === folderId) {
          return { ...item, isOpen: !item.isOpen };
        }
        if ('items' in item) {
          return { ...item, items: toggleFolder(item.items) };
        }
        return item;
      });
    };

    setFiles(toggleFolder(files));
  };

  const handleContentChange = (fileId: string, content: string) => {
    const updateFileContent = (items: (FileType | FolderType)[]): (FileType | FolderType)[] => {
      return items.map(item => {
        if ('items' in item) {
          return { ...item, items: updateFileContent(item.items) };
        }
        if (item.id === fileId) {
          return { ...item, content };
        }
        return item;
      });
    };

    setFiles(updateFileContent(files));
    setOpenFiles(openFiles.map(file =>
      file.id === fileId ? { ...file, content } : file
    ));
  };

  const handleFileUpload = (newFiles: (FileType | FolderType)[]) => {
    setFiles(newFiles);
    setOpenFiles([]);
    setActiveFileId(null);
  };

  const handleExport = async () => {
    try {
      await exportProjectAsZip(files);
    } catch (error) {
      setError('Failed to export project. Please try again.');
      console.error('Export error:', error);
    }
  };

  const handleCreateProject = async (frameworkId: string) => {
    try {
      let newFiles: (FileType | FolderType)[] = [];

      switch (frameworkId) {
        case 'next':
          newFiles = await createNextJsProject();
          break;
        case 'flask':
          newFiles = await createFlaskProject();
          break;
        case 'langchain':
          newFiles = await createLangChainProject();
          break;
        case 'react':
          newFiles = await createReactProject();
          break;
        case 'express':
          newFiles = await createExpressProject();
          break;
        case 'django':
          newFiles = await createDjangoProject();
          break;
        case 'react-native':
          newFiles = await createReactNativeProject();
          break;
        case 'ethereum':
          newFiles = await createEthereumProject();
          break;
        case 'solana':
          newFiles = await createSolanaProject();
          break;
        default:
          throw new Error(`Unknown framework: ${frameworkId}`);
      }

      setFiles(newFiles);
      setOpenFiles([]);
      setActiveFileId(null);
      setIsProjectModalOpen(false);
    } catch (error) {
      setError(`Failed to create ${frameworkId} project. Please try again.`);
      console.error('Project creation error:', error);
    }
  };

  const handleOpenFile = async () => {
    try {
      const file = await openFile();
      setFiles([...files, file]);
      handleFileSelect(file);
    } catch (error) {
      setError('Failed to open file. Please try again.');
      console.error('File open error:', error);
    }
  };

  const handleOpenDirectory = async () => {
    try {
      const newFiles = await openDirectory();
      setFiles(newFiles);
      setOpenFiles([]);
      setActiveFileId(null);
    } catch (error) {
      setError('Failed to open directory. Please try uploading a ZIP file instead.');
      console.error('Directory open error:', error);
    }
  };

  const handleSaveFile = async () => {
    const activeFile = openFiles.find(f => f.id === activeFileId);
    if (activeFile) {
      try {
        await saveFile(activeFile);
      } catch (error) {
        setError('Failed to save file. Please try again.');
        console.error('File save error:', error);
      }
    }
  };

  const handleFileSourceSelect = (source: 'zip' | 'local') => {
    if (source === 'local') {
      handleOpenDirectory();
    }
  };

  const handleError = (message: string) => {
    setError(message);
  };

  const activeFile = openFiles.find(f => f.id === activeFileId) || null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {error && (
        <div className="fixed top-4 right-4 glass border border-red-500/30 bg-red-500/20 text-red-300 px-4 py-3 rounded-xl shadow-xl z-50 flex items-center animate-fadeIn">
          <span className="text-sm font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Header with Glass Effect */}
      <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6 relative z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                <Code2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Morpheus IDE</h1>
              <p className="text-xs text-gray-400">AI-Powered Development Environment</p>
            </div>
          </div>

          {/* AI Status Indicator */}
          {isInitialized && (
            <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-300 font-medium">AI Ready</span>
            </div>
          )}
        </div>
        {/* Enhanced Action Buttons */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="group relative p-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-105"
              title="New Project"
            >
              <Plus className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                New Project
              </div>
            </button>

            <button
              onClick={handleExport}
              className="group relative p-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-105"
              title="Export Project"
            >
              <Download className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Export
              </div>
            </button>

            <button
              onClick={() => setIsCodeContextModalOpen(true)}
              className="group relative p-3 rounded-lg transition-all duration-200 hover:bg-white/10 hover:scale-105"
              title="Code Analysis"
            >
              <FileSearch className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Analysis
              </div>
            </button>
          </div>

          <div className="w-px h-8 bg-white/20 mx-2"></div>

          <div className="flex items-center space-x-1 bg-white/5 rounded-xl p-1">
            <button
              onClick={toggleContextPanel}
              className={`group relative p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                contextPanel.isOpen
                  ? 'bg-blue-500/30 text-blue-300 glow'
                  : 'hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
              title="AI Context Panel"
            >
              <Zap className="w-5 h-5 transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                AI Context
              </div>
            </button>

            <button
              onClick={() => setUseEnhancedEditor(!useEnhancedEditor)}
              className={`group relative p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                useEnhancedEditor
                  ? 'bg-green-500/30 text-green-300 glow'
                  : 'hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
              title={`${useEnhancedEditor ? 'Disable' : 'Enable'} AI Editor`}
            >
              <Code2 className="w-5 h-5 transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                AI Editor
              </div>
            </button>

            <button
              onClick={() => setIsTerminalVisible(!isTerminalVisible)}
              className={`group relative p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                isTerminalVisible
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
              title={isTerminalVisible ? 'Hide Terminal' : 'Show Terminal'}
            >
              <TerminalIcon className="w-5 h-5 transition-colors" />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Terminal
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area with Modern Layout */}
      <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-slate-900/50 to-slate-800/30">
        <Sidebar
          files={files}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          onOpenFile={handleOpenFile}
          onOpenDirectory={handleOpenDirectory}
          onSaveFile={handleSaveFile}
        />

        <div className="flex-1 flex flex-col relative">
          {/* Enhanced Tabs */}
          <Tabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            onTabSelect={setActiveFileId}
            onTabClose={handleTabClose}
          />

          {/* Editor Area with Glass Effect */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-slate-800/40 backdrop-blur-sm"></div>
            <div className="relative h-full">
              {useEnhancedEditor ? (
                <EnhancedEditor
                  file={activeFile}
                  onContentChange={handleContentChange}
                />
              ) : (
                <Editor
                  file={activeFile}
                  onContentChange={handleContentChange}
                />
              )}
            </div>
          </div>

          {/* Enhanced Terminal */}
          {isTerminalVisible && (
            <div className="border-t border-white/10 bg-gradient-to-r from-slate-900/80 to-slate-800/60 backdrop-blur-sm">
              <Terminal
                isVisible={isTerminalVisible}
                onClose={() => setIsTerminalVisible(false)}
              />
            </div>
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        onFileUpload={handleFileUpload}
        onSelectSource={handleFileSourceSelect}
        onError={handleError}
      />

      <CodeContextModal
        isOpen={isCodeContextModalOpen}
        onClose={() => setIsCodeContextModalOpen(false)}
        files={files}
      />

      <ContextPanel
        isOpen={contextPanel.isOpen}
        onClose={() => toggleContextPanel()}
      />
    </div>
  );
}

export default App;