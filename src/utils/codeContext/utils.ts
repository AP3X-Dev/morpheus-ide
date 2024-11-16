import { FileType, FolderType } from '../../types';

export function shouldExclude(name: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

export function hasCodeExtension(filename: string, codeExtensions: string[]): boolean {
  return codeExtensions.some(ext => filename.endsWith(ext));
}

export function findFileByPath(
  items: (FileType | FolderType)[],
  path: string
): FileType | null {
  for (const item of items) {
    if ('items' in item) {
      const found = findFileByPath(item.items, path);
      if (found) return found;
    } else if (path.endsWith(item.name)) {
      return item;
    }
  }
  return null;
}