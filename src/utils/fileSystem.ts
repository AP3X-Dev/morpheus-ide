import { FileType, FolderType } from '../types';

export async function saveFile(file: FileType): Promise<void> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: file.name,
      types: [{
        description: 'Text Files',
        accept: {
          'text/plain': ['.txt', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html']
        }
      }]
    });
    
    const writable = await handle.createWritable();
    await writable.write(file.content);
    await writable.close();
  } catch (err) {
    console.error('Error saving file:', err);
    throw err;
  }
}

export async function openFile(): Promise<FileType> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'Text Files',
        accept: {
          'text/plain': ['.txt', '.js', '.jsx', '.ts', '.tsx', '.css', '.json', '.html']
        }
      }]
    });
    
    const file = await handle.getFile();
    const content = await file.text();
    
    return {
      id: handle.name,
      name: handle.name,
      content,
      language: getFileLanguage(handle.name)
    };
  } catch (err) {
    console.error('Error opening file:', err);
    throw err;
  }
}

export async function openDirectory(): Promise<(FileType | FolderType)[]> {
  try {
    const handle = await window.showDirectoryPicker();
    return await processDirectoryHandle(handle);
  } catch (err) {
    console.error('Error opening directory:', err);
    throw err;
  }
}

async function processDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  path: string = ''
): Promise<(FileType | FolderType)[]> {
  const entries: (FileType | FolderType)[] = [];
  
  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;
    
    if (entry.kind === 'directory') {
      const subDirHandle = await dirHandle.getDirectoryHandle(entry.name);
      const children = await processDirectoryHandle(subDirHandle, entryPath);
      entries.push({
        id: entryPath,
        name: entry.name,
        items: children,
        isOpen: true
      });
    } else {
      const fileHandle = await dirHandle.getFileHandle(entry.name);
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      entries.push({
        id: entryPath,
        name: entry.name,
        content,
        language: getFileLanguage(entry.name)
      });
    }
  }
  
  return entries;
}

function getFileLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'xml': 'xml',
    'sh': 'shell',
    'bash': 'shell',
    'txt': 'plaintext'
  };
  
  return languageMap[ext] || 'plaintext';
}