import { FileType, FolderType } from '../../types';
import { DependencyAnalysis } from './types';
import { findFileByPath } from './utils';

export async function analyzeFileDependencies(
  file: FileType,
  files: (FileType | FolderType)[]
): Promise<DependencyAnalysis> {
  const dependencies: string[] = [];
  const dependents: string[] = [];

  // Extract imports from the file content
  const importPatterns = [
    /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"](\.\/[^'"]+)['"]/g,
    /require\(['"]([^'"]+)['"]\)/g,
    /from\s+['"]([^'"]+)['"]/g,
    /@import\s+['"]([^'"]+)['"]/g,
    /include\s+['"]([^'"]+)['"]/g,
    /require_relative\s+['"]([^'"]+)['"]/g
  ];

  importPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(file.content)) !== null) {
      const importPath = match[1];
      if (!dependencies.includes(importPath)) {
        dependencies.push(importPath);
      }
    }
  });

  // Find files that import or reference the current file
  function findDependents(items: (FileType | FolderType)[], currentPath: string = '') {
    items.forEach(item => {
      if ('items' in item) {
        findDependents(item.items, `${currentPath}/${item.name}`);
      } else {
        // Check for various import/require patterns
        const patterns = [
          new RegExp(`import\\s+(?:(?:[\\w*\\s{},]*)\\s+from\\s+)?['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]`, 'g'),
          new RegExp(`require\\(['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]\\)`, 'g'),
          new RegExp(`from\\s+['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]`, 'g'),
          new RegExp(`@import\\s+['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]`, 'g'),
          new RegExp(`include\\s+['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]`, 'g'),
          new RegExp(`require_relative\\s+['"].*${file.name.replace(/\.[^/.]+$/, '')}['"]`, 'g')
        ];

        const hasReference = patterns.some(pattern => pattern.test(item.content));
        if (hasReference) {
          const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
          if (!dependents.includes(itemPath)) {
            dependents.push(itemPath);
          }
        }
      }
    });
  }

  findDependents(files);

  return { dependencies, dependents };
}