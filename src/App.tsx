import { useState } from 'react';
import { Code2, Terminal as TerminalIcon, Download, X, Plus, FileSearch } from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import Terminal from './components/Terminal';
import ProjectModal from './components/ProjectModal';
import CodeContextModal from './components/CodeContextModal';
import { exportProjectAsZip } from './utils/fileUtils';
import { openFile, openDirectory, saveFile } from './utils/fileSystem';
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
    <div className="h-screen flex flex-col bg-editor-bg">
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 hover:text-red-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <nav className="bg-editor-sidebar border-b border-editor-border">
        <div className="px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <Code2 className="w-6 h-6 text-editor-icon" />
              <span className="ml-2 text-lg font-bold text-editor-text">Morpheus IDE</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="New Project"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="Export Project"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsCodeContextModalOpen(true)}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="Code Analysis"
              >
                <FileSearch className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsTerminalVisible(!isTerminalVisible)}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title={isTerminalVisible ? 'Hide Terminal' : 'Show Terminal'}
              >
                <TerminalIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          files={files}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
          onOpenFile={handleOpenFile}
          onOpenDirectory={handleOpenDirectory}
          onSaveFile={handleSaveFile}
        />
        <div className="flex-1 flex flex-col">
          <Tabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            onTabSelect={setActiveFileId}
            onTabClose={handleTabClose}
          />
          <div className="flex-1 overflow-hidden">
            <Editor
              file={activeFile}
              onContentChange={handleContentChange}
            />
          </div>
          {isTerminalVisible && (
            <Terminal
              isVisible={isTerminalVisible}
              onClose={() => setIsTerminalVisible(false)}
            />
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
    </div>
  );
}

export default App;