// File: src/App.tsx

import { useState } from 'react';
import {
  Code2,
  Terminal as TerminalIcon,
  Upload,
  Download,
  FileCode,
  Save,
  Eye,
  Plus, // Import the Plus icon for New Project
} from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import FileUpload from './components/FileUpload';
import Terminal from './components/Terminal';
import { exportProjectAsZip, initializeBoilerplate } from './utils/fileUtils';
import CodeContextModal from './components/CodeContextModal';
import NewProjectModal from './components/NewProjectModal'; // Import the NewProjectModal
import { FileType, FolderType, Framework } from './types';
import Preview from './components/Preview';

const initialFiles: (FileType | FolderType)[] = [];

function App() {
  const [files, setFiles] = useState<(FileType | FolderType)[]>(initialFiles);
  const [openFiles, setOpenFiles] = useState<FileType[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false); // State for NewProjectModal

  const handleFileSelect = (file: FileType) => {
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles([...openFiles, file]);
    }
    setActiveFileId(file.id);

    // If the selected file is an HTML file, set the preview content
    if (file.name.endsWith('.html')) {
      setHtmlContent(file.content);
    }
  };

  const handleTabClose = (fileId: string) => {
    setOpenFiles(openFiles.filter((f) => f.id !== fileId));
    if (activeFileId === fileId) {
      setActiveFileId(openFiles[openFiles.length - 2]?.id || null);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    const toggleFolder = (items: (FileType | FolderType)[]): (FileType | FolderType)[] => {
      return items.map((item) => {
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

  const handleContentChange = async (fileId: string, content: string) => {
    const updateFileContent = (items: (FileType | FolderType)[]): (FileType | FolderType)[] => {
      return items.map((item) => {
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
    setOpenFiles(
      openFiles.map((file) => (file.id === fileId ? { ...file, content } : file))
    );

    // Update the preview if the active file is an HTML file
    const activeFile = openFiles.find((f) => f.id === fileId);
    if (activeFile && activeFile.name.endsWith('.html')) {
      setHtmlContent(content);
    }

    const fileHandle = findFileHandle(files, fileId);
    if (fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      } catch (error) {
        console.error('Error saving file:', error);
        alert('Error saving file. Please try again.');
      }
    }
  };

  function findFileHandle(items: (FileType | FolderType)[], fileId: string): any | null {
    for (const item of items) {
      if ('items' in item) {
        const handle = findFileHandle(item.items, fileId);
        if (handle) return handle;
      } else if (item.id === fileId) {
        return item.handle;
      }
    }
    return null;
  }

  const handleFileUpload = (newFiles: (FileType | FolderType)[]) => {
    setFiles(newFiles);
    setOpenFiles([]);
    setActiveFileId(null);
    setHtmlContent('');
    setShowPreview(false);
  };

  const handleExport = async () => {
    await exportProjectAsZip(files);
  };

  const handleSaveFile = async () => {
    if (activeFile) {
      const fileHandle = activeFile.handle;
      if (fileHandle) {
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(activeFile.content);
          await writable.close();
          alert('File saved successfully!');
        } catch (error) {
          console.error('Error saving file:', error);
          alert('Error saving file. Please try again.');
        }
      } else {
        alert('No file handle available for this file.');
      }
    }
  };

  const handleCreateNewProject = async (framework: Framework) => {
    const boilerplateFiles = initializeBoilerplate(framework);
    setFiles(boilerplateFiles);
    setOpenFiles([]);
    setActiveFileId(null);
    setHtmlContent('');
    setShowPreview(false);
    setIsNewProjectModalOpen(false);
    alert(`New ${framework} project created successfully!`);
  };

  const activeFile = openFiles.find((f) => f.id === activeFileId) || null;

  return (
    <div className="h-screen flex flex-col bg-editor-bg">
      <nav className="bg-editor-sidebar border-b border-editor-border">
        <div className="px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center">
              <Code2 className="w-6 h-6 text-editor-icon" />
              <span className="ml-2 text-lg font-bold text-editor-text">Morpheus IDE</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileUpload onFileUpload={handleFileUpload}>
                <button
                  className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                  title="Open Folder"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </FileUpload>
              <button
                onClick={handleExport}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="Export Project"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsContextModalOpen(true)}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="Code Context Manager"
              >
                <FileCode className="w-5 h-5" />
              </button>
              <button
                onClick={handleSaveFile}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="Save File"
              >
                <Save className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title={showPreview ? 'Hide Preview' : 'Show Preview'}
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsNewProjectModalOpen(true)} // Open the New Project modal
                className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded-lg transition-colors"
                title="New Project"
              >
                <Plus className="w-5 h-5" /> {/* New Project Icon */}
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

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateNewProject}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          files={files}
          onFileSelect={handleFileSelect}
          onToggleFolder={handleToggleFolder}
        />
        <div className="flex-1 flex flex-col">
          <Tabs
            openFiles={openFiles}
            activeFileId={activeFileId}
            onTabSelect={setActiveFileId}
            onTabClose={handleTabClose}
          />
          <div className="flex-1 flex overflow-hidden">
            <div className={showPreview ? 'w-1/2' : 'w-full'}>
              <Editor file={activeFile} onContentChange={handleContentChange} />
            </div>
            {showPreview && (
              <div className="w-1/2">
                <Preview htmlContent={htmlContent} />
              </div>
            )}
          </div>
          {isTerminalVisible && (
            <Terminal
              isVisible={isTerminalVisible}
              onClose={() => setIsTerminalVisible(false)}
            />
          )}
        </div>
      </div>

      <CodeContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        files={files}
      />
    </div>
  );
}

export default App;
