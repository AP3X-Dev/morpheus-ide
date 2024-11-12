import { FileType, FolderType } from '../types';

export interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  path?: string;
}

export async function generateFileTree(
  files: (FileType | FolderType)[],
  excludePatterns: string[]
): Promise<TreeNode[]> {
  function buildTree(items: (FileType | FolderType)[], currentPath: string = ''): TreeNode[] {
    return items
      .filter(item => !shouldExclude(item.name, excludePatterns))
      .map(item => {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        if ('items' in item) {
          return {
            name: item.name,
            type: 'folder',
            path: itemPath,
            children: buildTree(item.items, itemPath)
          };
        }
        return {
          name: item.name,
          type: 'file',
          path: itemPath
        };
      });
  }

  return buildTree(files);
}

export function exportTreeToFormat(tree: TreeNode[], format: 'json' | 'markdown' | 'text'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(tree, null, 2);
    case 'markdown':
      return generateMarkdownTree(tree);
    case 'text':
      return generateTextTree(tree);
    default:
      return '';
  }
}

function generateMarkdownTree(tree: TreeNode[], level: number = 0): string {
  return tree.map(node => {
    const indent = '  '.repeat(level);
    const prefix = level === 0 ? '# ' : '- ';
    const line = `${indent}${prefix}${node.name}`;
    
    if (node.children) {
      return `${line}\n${generateMarkdownTree(node.children, level + 1)}`;
    }
    return line;
  }).join('\n');
}

function generateTextTree(tree: TreeNode[], prefix: string = ''): string {
  return tree.map((node, index, array) => {
    const isLast = index === array.length - 1;
    const marker = isLast ? '└── ' : '├── ';
    const childPrefix = isLast ? '    ' : '│   ';
    const line = `${prefix}${marker}${node.name}`;
    
    if (node.children) {
      return `${line}\n${generateTextTree(node.children, prefix + childPrefix)}`;
    }
    return line;
  }).join('\n');
}

export function downloadTree(content: string, format: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `project-tree.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function aggregateCode(
  files: (FileType | FolderType)[],
  excludePatterns: string[],
  codeExtensions: string[]
): Promise<string> {
  let aggregatedCode = '';

  function processItems(items: (FileType | FolderType)[], path: string = '') {
    items.forEach(item => {
      if (shouldExclude(item.name, excludePatterns)) return;

      const itemPath = path ? `${path}/${item.name}` : item.name;

      if ('items' in item) {
        processItems(item.items, itemPath);
      } else if (hasCodeExtension(item.name, codeExtensions)) {
        aggregatedCode += `\n// File: ${itemPath}\n`;
        aggregatedCode += `${item.content}\n`;
        aggregatedCode += '\n// End of file\n';
      }
    });
  }

  processItems(files);
  return aggregatedCode;
}

export async function aggregateFileWithDependencies(
  file: FileType,
  files: (FileType | FolderType)[],
  analysis: { dependencies: string[]; dependents: string[] }
): Promise<string> {
  let aggregatedCode = '';
  const processedFiles = new Set<string>();

  function findFileByPath(items: (FileType | FolderType)[], targetPath: string): FileType | null {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, targetPath);
        if (found) return found;
      } else if (targetPath.endsWith(item.name)) {
        return item;
      }
    }
    return null;
  }

  function addFileContent(currentFile: FileType, indent: number = 0) {
    if (processedFiles.has(currentFile.name)) return;
    processedFiles.add(currentFile.name);

    const indentation = ' '.repeat(indent);
    aggregatedCode += `\n${indentation}// File: ${currentFile.name}\n`;
    aggregatedCode += `${indentation}${currentFile.content.split('\n').join(`\n${indentation}`)}\n`;
    aggregatedCode += `${indentation}// End of file\n`;
  }

  // Add dependencies first
  aggregatedCode += '\n// Dependencies:\n';
  for (const dep of analysis.dependencies) {
    const depFile = findFileByPath(files, dep);
    if (depFile) {
      addFileContent(depFile, 2);
    }
  }

  // Add the main file
  aggregatedCode += '\n// Main File:\n';
  addFileContent(file);

  // Add dependents
  aggregatedCode += '\n// Dependents:\n';
  for (const dep of analysis.dependents) {
    const depFile = findFileByPath(files, dep);
    if (depFile) {
      addFileContent(depFile, 2);
    }
  }

  return aggregatedCode;
}

export async function analyzeFileDependencies(
  file: FileType,
  files: (FileType | FolderType)[]
): Promise<{ dependencies: string[]; dependents: string[] }> {
  const dependencies: string[] = [];
  const dependents: string[] = [];

  // Extract imports from the file content
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"](\.\/[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(file.content)) !== null) {
    dependencies.push(match[1]);
  }

  // Find files that import the current file
  function findDependents(items: (FileType | FolderType)[], currentPath: string = '') {
    items.forEach(item => {
      if ('items' in item) {
        findDependents(item.items, `${currentPath}/${item.name}`);
      } else {
        const importRegex = new RegExp(`import\\s+(?:(?:[\\w*\\s{},]*)\\s+from\\s+)?['"]${file.name}['"]`, 'g');
        if (importRegex.test(item.content)) {
          dependents.push(`${currentPath}/${item.name}`);
        }
      }
    });
  }

  findDependents(files);

  return { dependencies, dependents };
}

export async function extractFilesFromText(
  text: string,
  files: (FileType | FolderType)[],
  excludePatterns: string[]
): Promise<{ files: FileType[]; dependencies: Set<string> }> {
  const fileMatches = new Set<string>();
  const extractedFiles: FileType[] = [];
  const allDependencies = new Set<string>();

  // Common file path patterns
  const patterns = [
    /(?:^|\s)(?:\.\/|\/)?([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+)(?:\s|$|:|\(|,)/gm,  // Basic file paths
    /(?:from\s+['"])([^'"]+)(['"])/g,  // Import statements
    /(?:require\(['"])([^'"]+)(['"])/g,  // Require statements
    /(?:at\s+)(?:\w+\s+)?\(?([^:)]+?):?\d*\)?/gm,  // Stack trace paths
    /(?:Error:|Warning:)\s+([^:]+):/gm  // Error messages
  ];

  // Extract file paths from text
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const path = match[1].trim();
      if (path) fileMatches.add(path);
    }
  });

  // Find matching files in the project
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

  // Analyze dependencies for each extracted file
  for (const file of extractedFiles) {
    const { dependencies } = await analyzeFileDependencies(file, files);
    dependencies.forEach(dep => allDependencies.add(dep));
  }

  return { files: extractedFiles, dependencies: allDependencies };
}

export async function aggregateExtractedFiles(
  extractedFiles: { files: FileType[]; dependencies: Set<string> },
  files: (FileType | FolderType)[]
): Promise<string> {
  let aggregatedCode = '';
  const processedFiles = new Set<string>();

  function findFileByPath(items: (FileType | FolderType)[], targetPath: string): FileType | null {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, targetPath);
        if (found) return found;
      } else if (targetPath.endsWith(item.name)) {
        return item;
      }
    }
    return null;
  }

  function addFileContent(file: FileType, indent: number = 0) {
    if (processedFiles.has(file.name)) return;
    processedFiles.add(file.name);

    const indentation = ' '.repeat(indent);
    aggregatedCode += `\n${indentation}// File: ${file.name}\n`;
    aggregatedCode += `${indentation}${file.content.split('\n').join(`\n${indentation}`)}\n`;
    aggregatedCode += `${indentation}// End of file\n`;
  }

  // Add dependencies first
  if (extractedFiles.dependencies.size > 0) {
    aggregatedCode += '\n// Dependencies:\n';
    for (const dep of extractedFiles.dependencies) {
      const depFile = findFileByPath(files, dep);
      if (depFile) {
        addFileContent(depFile, 2);
      }
    }
  }

  // Add extracted files
  aggregatedCode += '\n// Extracted Files:\n';
  for (const file of extractedFiles.files) {
    addFileContent(file);
  }

  return aggregatedCode;
}

function shouldExclude(name: string, excludePatterns: string[]): boolean {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

function hasCodeExtension(filename: string, codeExtensions: string[]): boolean {
  return codeExtensions.some(ext => filename.endsWith(ext));
}