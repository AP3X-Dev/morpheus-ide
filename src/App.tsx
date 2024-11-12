import { useState } from 'react';
import { Code2, Terminal as TerminalIcon, Upload, Download, FileCode } from 'lucide-react';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import Tabs from './components/Tabs';
import FileUpload from './components/FileUpload';
import Terminal from './components/Terminal';
import { exportProjectAsZip } from './utils/fileUtils';
import CodeContextModal from './components/CodeContextModal';
import { FileType, FolderType } from './types';

const initialFiles: (FileType | FolderType)[] = [
  {
    id: 'src',
    name: 'src',
    isOpen: true,
    items: [
      {
        id: 'app',
        name: 'App.tsx',
        language: 'typescript',
        content: 'function App() {\n  return <div>Hello World</div>;\n}\n\nexport default App;'
      },
      {
        id: 'index',
        name: 'index.tsx',
        language: 'typescript',
        content: 'import React from "react";\nimport ReactDOM from "react-dom";\nimport App from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));'
      }
    ]
  }
];

function App() {
  const [files, setFiles] = useState<(FileType | FolderType)[]>(initialFiles);
  const [openFiles, setOpenFiles] = useState<FileType[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);

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
    await exportProjectAsZip(files);
  };

  const activeFile = openFiles.find(f => f.id === activeFileId) || null;

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
                  title="Upload Project"
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

      <CodeContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        files={files}
      />
    </div>
  );
}

export default App;