import JSZip from 'jszip';
import { FileType, FolderType } from '../types';

export const LANGUAGE_MAP: Record<string, string> = {
  // Web Development
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'less': 'less',
  'json': 'json',
  'md': 'markdown',
  
  // Backend
  'py': 'python',
  'java': 'java',
  'cpp': 'cpp',
  'c': 'c',
  'cs': 'csharp',
  'go': 'go',
  'rs': 'rust',
  'php': 'php',
  'rb': 'ruby',
  
  // Data & Config
  'sql': 'sql',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'toml': 'toml',
  'ini': 'ini',
  
  // Shell & Scripts
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'ps1': 'powershell',
  
  // Others
  'txt': 'plaintext',
  'env': 'plaintext',
  'gitignore': 'plaintext',
  'dockerignore': 'plaintext',
  'conf': 'plaintext'
};

export function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export async function handleZipUpload(file: File): Promise<(FileType | FolderType)[]> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  return processZipContents(contents);
}

async function processZipContents(zip: JSZip): Promise<(FileType | FolderType)[]> {
  const result: (FileType | FolderType)[] = [];
  const folderMap = new Map<string, FolderType>();

  // Create folder structure
  for (const path in zip.files) {
    if (zip.files[path].dir) {
      const parts = path.split('/').filter(Boolean);
      let currentPath = '';
      
      parts.forEach((part) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderMap.has(currentPath)) {
          const folder: FolderType = {
            id: currentPath,
            name: part,
            items: [],
            isOpen: true
          };
          
          folderMap.set(currentPath, folder);
          
          if (parentPath) {
            const parentFolder = folderMap.get(parentPath);
            if (parentFolder) {
              parentFolder.items.push(folder);
            }
          } else {
            result.push(folder);
          }
        }
      });
    }
  }

  // Add files
  for (const path in zip.files) {
    const file = zip.files[path];
    if (!file.dir) {
      const content = await file.async('string');
      const parts = path.split('/');
      const fileName = parts.pop() || '';
      const parentPath = parts.join('/');
      
      const fileObj: FileType = {
        id: path,
        name: fileName,
        content,
        language: getFileLanguage(fileName)
      };
      
      if (parentPath) {
        const parentFolder = folderMap.get(parentPath);
        if (parentFolder) {
          parentFolder.items.push(fileObj);
        }
      } else {
        result.push(fileObj);
      }
    }
  }

  return result;
}

export async function exportProjectAsZip(files: (FileType | FolderType)[]): Promise<void> {
  const zip = new JSZip();

  function addToZip(items: (FileType | FolderType)[], parentPath: string = '') {
    items.forEach(item => {
      const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      
      if ('items' in item) {
        // It's a folder
        addToZip(item.items, itemPath);
      } else {
        // It's a file
        zip.file(itemPath, item.content);
      }
    });
  }

  addToZip(files);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'project.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}