import React from 'react';
import { X, FileCode, Code, Globe, Database, Image, FileText } from 'lucide-react';
import { FileType } from '../types';

interface TabsProps {
  openFiles: FileType[];
  activeFileId: string | null;
  onTabSelect: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClasses = 'w-4 h-4 mr-2 flex-shrink-0';

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
    default:
      return <FileText className={`${iconClasses} text-gray-400`} />;
  }
};

export default function Tabs({ openFiles, activeFileId, onTabSelect, onTabClose }: TabsProps) {
  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex bg-gradient-to-r from-slate-900/60 to-slate-800/40 border-b border-white/10 overflow-x-auto backdrop-blur-sm">
      {openFiles.map((file, index) => (
        <div
          key={file.id}
          className={`group relative flex items-center min-w-[140px] max-w-[220px] transition-all duration-200 ${
            activeFileId === file.id
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-b-2 border-blue-400'
              : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          {/* Active tab indicator */}
          {activeFileId === file.id && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
          )}

          <button
            className="flex-1 flex items-center px-4 py-3 text-sm truncate transition-all duration-200"
            onClick={() => onTabSelect(file.id)}
          >
            {getFileIcon(file.name)}
            <span className="truncate font-medium">{file.name}</span>
          </button>

          <button
            className={`mr-2 p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
              activeFileId === file.id ? 'opacity-100' : ''
            } hover:bg-white/10 hover:scale-110`}
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(file.id);
            }}
            title="Close tab"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Tab separator */}
          {index < openFiles.length - 1 && (
            <div className="absolute right-0 top-2 bottom-2 w-px bg-white/10"></div>
          )}
        </div>
      ))}

      {/* Gradient fade for overflow */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/60 to-transparent pointer-events-none"></div>
    </div>
  );
}