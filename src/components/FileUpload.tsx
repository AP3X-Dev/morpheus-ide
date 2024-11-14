// File: components/FileUpload.tsx

import React, { ReactNode } from 'react';
import { FileType, FolderType } from '../types';
import { readDirectoryRecursively } from '../utils/fileUtils';

interface FileUploadProps {
  onFileUpload: (files: (FileType | FolderType)[]) => void;
  children: ReactNode;
}

export default function FileUpload({ onFileUpload, children }: FileUploadProps) {
  const handleOpenFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker({
          writable: true,
        });
        const files = await readDirectoryRecursively(directoryHandle);
        onFileUpload(files);
      } catch (error) {
        console.error('Error accessing directory:', error);
        alert('Error accessing directory. Please try again.');
      }
    } else {
      alert('Your browser does not support the File System Access API.');
    }
  };

  return <div onClick={handleOpenFolder}>{children}</div>;
}
