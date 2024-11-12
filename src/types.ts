export interface FileType {
  id: string;
  name: string;
  content: string;
  path?: string;
}

export interface FolderType {
  id: string;
  name: string;
  items: (FileType | FolderType)[];
  isOpen?: boolean;
}