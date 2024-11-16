import { FileType, FolderType } from '../../types';
import { ExtractedFiles } from './types';
import { shouldExclude } from './utils';
import { analyzeFileDependencies } from './dependencies';

export async function extractFilesFromText(
  text: string,
  files: (FileType | FolderType)[],
  excludePatterns: string[]
): Promise<ExtractedFiles> {
  const fileMatches = new Set<string>();
  const extractedFiles: FileType[] = [];
  const allDependencies = new Set<string>();

  // Common file path patterns
  const patterns = [
    /(?:^|\s)(?:\.\/|\/)?([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+)(?:\s|$|:|\(|,)/gm,
    /(?:from\s+['"])([^'"]+)(['"])/g,
    /(?:require\(['"])([^'"]+)(['"])/g,
    /(?:at\s+)(?:\w+\s+)?\(?([^:)]+?):?\d*\)?/gm,
    /(?:Error:|Warning:)\s+([^:]+):/gm,
    /(?:import\s+['"])([^'"]+)(['"])/g,
    /(?:@import\s+['"])([^'"]+)(['"])/g,
    /(?:include\s+['"])([^'"]+)(['"])/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const path = match[1].trim();
      if (path) fileMatches.add(path);
    }
  });

  function findMatchingFiles(items: (FileType | FolderType)[], currentPath: string = '') {
    items.forEach(item => {
      if (shouldExclude(item.name, excludePatterns)) return;

      const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

      if ('items' in item) {
        findMatchingFiles(item.items, itemPath);
      } else {
        for (const match of fileMatches) {
          if (itemPath.endsWith(match) || match.endsWith(item.name)) {
            extractedFiles.push(item);
            break;
          }
        }
      }
    });
  }

  findMatchingFiles(files);

  for (const file of extractedFiles) {
    const { dependencies } = await analyzeFileDependencies(file, files);
    dependencies.forEach(dep => allDependencies.add(dep));
  }

  return { files: extractedFiles, dependencies: allDependencies };
}