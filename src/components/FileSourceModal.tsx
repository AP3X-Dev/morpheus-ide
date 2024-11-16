import React from 'react';
import { X, Upload, Folder } from 'lucide-react';
import FileUpload from './FileUpload';
import { FileType, FolderType } from '../types';

interface FileSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSource: (source: 'zip' | 'local') => void;
  onFileUpload: (files: (FileType | FolderType)[]) => void;
  onError: (message: string) => void;
}

export default function FileSourceModal({ 
  isOpen, 
  onClose, 
  onSelectSource, 
  onFileUpload,
  onError 
}: FileSourceModalProps) {
  const handleSourceSelect = async (source: 'zip' | 'local') => {
    try {
      onSelectSource(source);
      if (source === 'local') {
        onClose();
      }
    } catch (error) {
      onError('Unable to access file system. Please try uploading a ZIP file instead.');
      console.error('File system access error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-editor-bg border border-editor-border rounded-lg w-[400px]">
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <h2 className="text-lg font-semibold text-editor-text">Open Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <FileUpload 
            onFileUpload={(files) => {
              onFileUpload(files);
              onClose();
            }}
            onError={onError}
          >
            <button className="w-full flex items-center gap-4 p-4 bg-editor-active rounded-lg hover:bg-opacity-80 transition-colors text-left group">
              <div className="p-2 bg-editor-bg rounded-lg group-hover:bg-opacity-80">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-editor-text font-medium">Upload ZIP</h3>
                <p className="text-editor-icon text-sm mt-1">Import a project from a ZIP file</p>
              </div>
            </button>
          </FileUpload>

          <button
            onClick={() => handleSourceSelect('local')}
            className="w-full flex items-center gap-4 p-4 bg-editor-active rounded-lg hover:bg-opacity-80 transition-colors text-left group"
          >
            <div className="p-2 bg-editor-bg rounded-lg group-hover:bg-opacity-80">
              <Folder className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-editor-text font-medium">Open Local Folder</h3>
              <p className="text-editor-icon text-sm mt-1">Select a folder from your computer</p>
            </div>
          </button>
        </div>

        <div className="px-4 py-3 bg-editor-sidebar border-t border-editor-border text-sm text-editor-icon">
          Note: Local folder access may be restricted in some browsers
        </div>
      </div>
    </div>
  );
}