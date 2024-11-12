import React, { useRef, ReactNode } from 'react';
import { FileType, FolderType } from '../types';
import { handleZipUpload } from '../utils/fileUtils';

interface FileUploadProps {
  onFileUpload: (files: (FileType | FolderType)[]) => void;
  children: ReactNode;
}

export default function FileUpload({ onFileUpload, children }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      try {
        const files = await handleZipUpload(file);
        onFileUpload(files);
      } catch (error) {
        console.error('Error processing ZIP file:', error);
        alert('Error processing ZIP file. Please try again.');
      }
    } else {
      alert('Please select a ZIP file.');
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".zip"
        className="hidden"
      />
      <div onClick={handleUploadClick}>
        {children}
      </div>
    </div>
  );
}