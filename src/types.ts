export interface FileType {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface FolderType {
  id: string;
  name: string;
  items: (FileType | FolderType)[];
  isOpen?: boolean;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ai' | 'blockchain';
}