import React, { useRef, ReactNode } from 'react';
import { FileType, FolderType } from '../types';
import { handleZipUpload } from '../utils/fileUtils';

interface FileUploadProps {
  onFileUpload: (files: (FileType | FolderType)[]) => void;
  onError?: (message: string) => void;
  children: ReactNode;
}

export default function FileUpload({ onFileUpload, onError, children }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      onError?.('Please select a ZIP file.');
      return;
    }

    try {
      const files = await handleZipUpload(file);
      onFileUpload(files);
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      onError?.('Error processing ZIP file. Please try again.');
    } finally {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div onClick={handleUploadClick}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip"
        className="hidden"
        aria-label="Upload ZIP file"
      />
      {children}
    </div>
  );
}