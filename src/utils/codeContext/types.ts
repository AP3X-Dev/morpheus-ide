import { FileType, FolderType } from '../../types';

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  path?: string;
}

export interface DependencyAnalysis {
  dependencies: string[];
  dependents: string[];
}

export interface ExtractedFiles {
  files: FileType[];
  dependencies: Set<string>;
}