{
  "id": string;
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