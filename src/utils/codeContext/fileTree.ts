import { FileType, FolderType } from '../../types';
import { TreeNode } from './types';
import { shouldExclude } from './utils';

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