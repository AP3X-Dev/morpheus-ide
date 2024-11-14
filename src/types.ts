// File: src/types.ts

export interface FileType {
  id: string;
  name: string;
  content: string;
  language: string;
  path?: string;
  handle?: FileSystemFileHandle; // Updated to proper type
}

export interface FolderType {
  id: string;
  name: string;
  items: (FileType | FolderType)[];
  isOpen?: boolean;
  handle?: FileSystemDirectoryHandle; // Updated to proper type
}

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  path?: string;
  children?: TreeNode[];
}

export type Framework = 'React' | 'Flask'; // Add more frameworks as needed
