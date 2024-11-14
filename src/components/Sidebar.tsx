// File: morpheus-ide-main/src/components/Sidebar.tsx

import React from 'react';
import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
import { FileType, FolderType } from '../types';

interface SidebarProps {
  files: (FileType | FolderType)[];
  onFileSelect: (file: FileType) => void;
  onToggleFolder: (folderId: string) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClasses = 'w-4 h-4 mr-2';

  switch (ext) {
    case 'js':
    case 'jsx':
      return (
        <span className={`${iconClasses} text-yellow-400`}>
          <FileText />
        </span>
      );
    case 'ts':
    case 'tsx':
      return (
        <span className={`${iconClasses} text-blue-400`}>
          <FileText />
        </span>
      );
    case 'py':
      return (
        <span className={`${iconClasses} text-green-400`}>
          <FileText />
        </span>
      );
    case 'html':
      return (
        <span className={`${iconClasses} text-orange-400`}>
          <FileText />
        </span>
      );
    case 'css':
    case 'scss':
    case 'less':
      return (
        <span className={`${iconClasses} text-purple-400`}>
          <FileText />
        </span>
      );
    default:
      return <FileText className={`${iconClasses} text-editor-icon`} />;
  }
};

const FileTreeItem = ({
  item,
  onFileSelect,
  onToggleFolder,
  depth = 0,
}: {
  item: FileType | FolderType;
  onFileSelect: (file: FileType) => void;
  onToggleFolder: (folderId: string) => void;
  depth?: number;
}) => {
  const isFolder = 'items' in item;
  const paddingLeft = `${depth * 1.25}rem`;

  if (isFolder) {
    const folder = item as FolderType;
    return (
      <div>
        <button
          className="w-full flex items-center px-2 py-1 hover:bg-editor-active text-editor-text text-sm"
          style={{ paddingLeft }}
          onClick={() => onToggleFolder(folder.id)}
        >
          {folder.isOpen ? (
            <ChevronDown className="w-4 h-4 mr-1 text-editor-icon" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-1 text-editor-icon" />
          )}
          <Folder className="w-4 h-4 mr-2 text-editor-icon" />
          {folder.name}
        </button>
        {folder.isOpen && (
          <div>
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
      className="w-full flex items-center px-2 py-1 hover:bg-editor-active text-editor-text text-sm"
      style={{ paddingLeft }}
      onClick={() => onFileSelect(file)}
    >
      {getFileIcon(file.name)}
      {file.name}
    </button>
  );
};

export default function Sidebar({ files, onFileSelect, onToggleFolder }: SidebarProps) {
  return (
    <div className="w-64 bg-editor-sidebar border-r border-editor-border overflow-y-auto">
      <div className="p-4 border-b border-editor-border">
        <h2 className="text-sm font-semibold text-editor-icon uppercase">Explorer</h2>
      </div>
      <div className="py-2">
        {files.map((item) => (
          <FileTreeItem
            key={item.id}
            item={item}
            onFileSelect={onFileSelect}
            onToggleFolder={onToggleFolder}
          />
        ))}
      </div>
    </div>
  );
}
