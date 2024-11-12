import React from 'react';
import { X } from 'lucide-react';
import { FileType } from '../types';

interface TabsProps {
  openFiles: FileType[];
  activeFileId: string | null;
  onTabSelect: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
}

export default function Tabs({ openFiles, activeFileId, onTabSelect, onTabClose }: TabsProps) {
  return (
    <div className="flex bg-editor-bg border-b border-editor-border overflow-x-auto">
      {openFiles.map((file) => (
        <div
          key={file.id}
          className={`flex items-center px-4 py-2 border-r border-editor-border min-w-[120px] max-w-[200px] ${
            activeFileId === file.id ? 'bg-editor-active text-editor-text' : 'text-editor-icon hover:bg-editor-active/50'
          }`}
        >
          <button
            className="flex-1 flex items-center text-sm truncate"
            onClick={() => onTabSelect(file.id)}
          >
            {file.name}
          </button>
          <button
            className="ml-2 p-1 rounded-sm hover:bg-editor-active"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.id);
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}