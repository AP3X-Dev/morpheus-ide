import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Filter,
  MoreHorizontal,
  Upload,
  FolderPlus,
  Save,
  GitBranch,
  Settings,
  Code,
  Database,
  Image,
  FileCode,
  Globe
} from 'lucide-react';
import { FileType, FolderType } from '../types';

interface SidebarProps {
  files: (FileType | FolderType)[];
  onFileSelect: (file: FileType) => void;
  onToggleFolder: (folderId: string) => void;
  onOpenFile: () => void;
  onOpenDirectory: () => void;
  onSaveFile: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClasses = 'w-4 h-4 mr-3 flex-shrink-0';

  switch (ext) {
    case 'js':
    case 'jsx':
      return <Code className={`${iconClasses} text-yellow-400`} />;
    case 'ts':
    case 'tsx':
      return <FileCode className={`${iconClasses} text-blue-400`} />;
    case 'py':
      return <Code className={`${iconClasses} text-green-400`} />;
    case 'html':
      return <Globe className={`${iconClasses} text-orange-400`} />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileText className={`${iconClasses} text-purple-400`} />;
    case 'json':
      return <Database className={`${iconClasses} text-yellow-300`} />;
    case 'md':
      return <FileText className={`${iconClasses} text-blue-300`} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return <Image className={`${iconClasses} text-pink-400`} />;
    case 'sql':
      return <Database className={`${iconClasses} text-blue-500`} />;
    default:
      return <FileText className={`${iconClasses} text-gray-400`} />;
  }
};

const FileTreeItem = ({
  item,
  onFileSelect,
  onToggleFolder,
  depth = 0
}: {
  item: FileType | FolderType;
  onFileSelect: (file: FileType) => void;
  onToggleFolder: (folderId: string) => void;
  depth?: number;
}) => {
  const isFolder = 'items' in item;
  const paddingLeft = `${depth * 1.5 + 0.75}rem`;

  if (isFolder) {
    const folder = item as FolderType;
    return (
      <div className="animate-fadeIn">
        <button
          className="w-full flex items-center px-3 py-2 hover:bg-white/5 text-gray-200 text-sm transition-all duration-200 rounded-lg mx-2 group"
          style={{ paddingLeft }}
          onClick={() => onToggleFolder(folder.id)}
        >
          {folder.isOpen ? (
            <ChevronDown className="w-4 h-4 mr-2 text-gray-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2 text-gray-400 group-hover:text-white transition-colors" />
          )}
          {folder.isOpen ? (
            <FolderOpen className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 mr-3 text-blue-400 flex-shrink-0" />
          )}
          <span className="truncate font-medium">{folder.name}</span>
          <span className="ml-auto text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {folder.items.length}
          </span>
        </button>
        {folder.isOpen && (
          <div className="animate-slideIn">
            {folder.items.map((subItem) => (
              <FileTreeItem
                key={subItem.id}
                item={subItem}
                onFileSelect={onFileSelect}
                onToggleFolder={onToggleFolder}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const file = item as FileType;
  return (
    <button
      className="w-full flex items-center px-3 py-2 hover:bg-white/5 text-gray-200 text-sm transition-all duration-200 rounded-lg mx-2 group hover:scale-[1.02]"
      style={{ paddingLeft }}
      onClick={() => onFileSelect(file)}
    >
      {getFileIcon(file.name)}
      <span className="truncate group-hover:text-white transition-colors">{file.name}</span>
    </button>
  );
};

export default function Sidebar({
  files,
  onFileSelect,
  onToggleFolder,
  onOpenFile,
  onOpenDirectory,
  onSaveFile
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredFiles = files.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-72 glass border-r border-white/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text">Explorer</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={onOpenFile}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              title="Open File"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenDirectory}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              title="Open Directory"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={onSaveFile}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
              title="Save File"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-105' : ''}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        {(searchQuery ? filteredFiles : files).map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
          />
        ))}

        {searchQuery && filteredFiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Search className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No files found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}

        {!searchQuery && files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Folder className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs">Open a file or directory to get started</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{files.length} items</span>
          <div className="flex items-center space-x-2">
            <GitBranch className="w-3 h-3" />
            <span>main</span>
          </div>
        </div>
      </div>
    </div>
  );
}