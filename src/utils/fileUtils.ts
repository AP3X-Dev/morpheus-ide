// File: src/utils/fileUtils.ts

import { FileType, FolderType, Framework, TreeNode } from '../types';
import JSZip from 'jszip';

/**
 * Mapping of supported frameworks to their boilerplate files.
 */
const boilerplateTemplates: Record<Framework, (FileType | FolderType)[]> = {
  React: [
    {
      id: 'package.json',
      name: 'package.json',
      content: `{
  "name": "react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "serve": "vite preview"
  }
}`,
      language: 'json',
    },
    {
      id: 'vite.config.ts',
      name: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
      language: 'typescript',
    },
    {
      id: 'public/index.html',
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" href="/favicon.ico" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
      language: 'html',
    },
    {
      id: 'src/main.tsx',
      name: 'main.tsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
      language: 'typescript',
    },
    {
      id: 'src/App.tsx',
      name: 'App.tsx',
      content: `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to React!</h1>
    </div>
  );
}

export default App;
`,
      language: 'typescript',
    },
    {
      id: 'src/index.css',
      name: 'index.css',
      content: `/* Add your CSS styles here */
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}
`,
      language: 'css',
    },
  ],
  Flask: [
    {
      id: 'app.py',
      name: 'app.py',
      content: `from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
`,
      language: 'python',
    },
    {
      id: 'requirements.txt',
      name: 'requirements.txt',
      content: `Flask==2.2.5
`,
      language: 'plaintext',
    },
    {
      id: 'templates/index.html',
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Flask App</title>
</head>
<body>
    <h1>Welcome to Flask!</h1>
</body>
</html>
`,
      language: 'html',
    },
    {
      id: 'static/style.css',
      name: 'style.css',
      content: `/* Add your CSS styles here */
body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
}
`,
      language: 'css',
    },
  ],
  // Add more frameworks and their boilerplates here
};

/**
 * Initializes boilerplate files based on the selected framework.
 * @param framework The framework selected by the user.
 * @returns An array of FileType and FolderType representing the boilerplate files.
 */
export function initializeBoilerplate(framework: Framework): (FileType | FolderType)[] {
  const boilerplate = boilerplateTemplates[framework];
  if (!boilerplate) {
    alert(`Boilerplate for ${framework} is not available.`);
    return [];
  }

  // Deep copy to prevent mutation of the original templates
  return JSON.parse(JSON.stringify(boilerplate));
}

/**
 * Reads a directory recursively and returns its contents as FileType and FolderType.
 * @param directoryHandle The directory handle to read.
 * @param currentPath The current path within the directory.
 * @returns A promise that resolves to an array of FileType and FolderType.
 */
export async function readDirectoryRecursively(
  directoryHandle: FileSystemDirectoryHandle,
  currentPath: string = ''
): Promise<(FileType | FolderType)[]> {
  const items: (FileType | FolderType)[] = [];

  for await (const [name, handle] of directoryHandle.entries()) {
    const path = currentPath ? `${currentPath}/${name}` : name;
    if (handle.kind === 'file') {
      const file = await handle.getFile();
      const content = await file.text();
      const language = getFileLanguage(name);
      items.push({
        id: path, // Using path as id
        name,
        content,
        language,
        path,
        handle,
      });
    } else if (handle.kind === 'directory') {
      const children = await readDirectoryRecursively(handle, path);
      items.push({
        id: path, // Using path as id
        name,
        items: children,
        isOpen: false,
        path,
        handle,
      });
    }
  }

  return items;
}

/**
 * Determines the programming language based on the file extension.
 * @param filename The name of the file.
 * @returns The language as a string.
 */
export function getFileLanguage(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    html: 'html',
    css: 'css',
    json: 'json',
    txt: 'plaintext',
    // Add more mappings as needed
  };

  return languageMap[extension || 'plaintext'] || 'plaintext';
}

/**
 * Generates a hierarchical file tree excluding specified patterns.
 * @param files The array of FileType and FolderType.
 * @param excludePatterns Patterns to exclude.
 * @returns A promise that resolves to an array of TreeNode.
 */
export async function generateFileTree(
  files: (FileType | FolderType)[],
  excludePatterns: string[]
): Promise<TreeNode[]> {
  function buildTree(
    items: (FileType | FolderType)[],
    currentPath: string = ''
  ): TreeNode[] {
    return items
      .filter((item) => !shouldExclude(item.name, excludePatterns))
      .map((item) => {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;

        if ('items' in item) {
          return {
            name: item.name,
            type: 'folder',
            path: itemPath,
            children: buildTree(item.items, itemPath),
          };
        }
        return {
          name: item.name,
          type: 'file',
          path: itemPath,
        };
      });
  }

  return buildTree(files);
}

/**
 * Exports the tree to the specified format.
 * @param tree The file tree.
 * @param format The format to export ('json', 'markdown', 'text').
 * @returns The exported tree as a string.
 */
export function exportTreeToFormat(
  tree: TreeNode[],
  format: 'json' | 'markdown' | 'text'
): string {
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
  return tree
    .map((node) => {
      const indent = '  '.repeat(level);
      const prefix = node.type === 'folder' ? '- ' : '- ';
      const line = `${indent}${prefix}${node.name}`;

      if (node.children) {
        return `${line}\n${generateMarkdownTree(node.children, level + 1)}`;
      }
      return line;
    })
    .join('\n');
}

function generateTextTree(tree: TreeNode[], prefix: string = ''): string {
  return tree
    .map((node, index, array) => {
      const isLast = index === array.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      const line = `${prefix}${marker}${node.name}`;

      if (node.children) {
        return `${line}\n${generateTextTree(node.children, childPrefix)}`;
      }
      return line;
    })
    .join('\n');
}

/**
 * Downloads the tree content as a file.
 * @param content The content to download.
 * @param format The file format (e.g., 'json', 'markdown', 'txt').
 */
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

/**
 * Aggregates code from files excluding specified patterns and extensions.
 * @param files The array of FileType and FolderType.
 * @param excludePatterns Patterns to exclude.
 * @param codeExtensions File extensions to include.
 * @returns Aggregated code as a string.
 */
export async function aggregateCode(
  files: (FileType | FolderType)[],
  excludePatterns: string[],
  codeExtensions: string[]
): Promise<string> {
  let aggregatedCode = '';

  function processItems(items: (FileType | FolderType)[], path: string = '') {
    items.forEach((item) => {
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

/**
 * Analyzes dependencies of a specific file.
 * @param file The file to analyze.
 * @param files The array of all FileType and FolderType.
 * @returns An object containing dependencies and dependents.
 */
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
  function findDependents(
    items: (FileType | FolderType)[],
    currentPath: string = ''
  ) {
    items.forEach((item) => {
      if ('items' in item) {
        findDependents(item.items, `${currentPath}/${item.name}`);
      } else {
        const importRegex = new RegExp(
          `import\\s+(?:.*?from\\s+)?['"]${file.name}['"]`,
          'g'
        );
        if (importRegex.test(item.content)) {
          dependents.push(`${currentPath}/${item.name}`);
        }
      }
    });
  }

  findDependents(files);

  return { dependencies, dependents };
}

/**
 * Aggregates code with dependencies for a specific file.
 */
export async function aggregateFileWithDependencies(
  file: FileType,
  files: (FileType | FolderType)[],
  analysis: { dependencies: string[]; dependents: string[] }
): Promise<string> {
  let aggregatedCode = '';
  const processedFiles = new Set<string>();

  function findFileByPath(
    items: (FileType | FolderType)[],
    targetPath: string
  ): FileType | null {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, targetPath);
        if (found) return found;
      } else if (item.id === targetPath || item.name === targetPath) {
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
    aggregatedCode += `${indentation}${currentFile.content
      .split('\n')
      .join(`\n${indentation}`)}\n`;
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

/**
 * Extracts files from pasted text.
 */
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
    /(?:^|\s)(?:\.\/|\/)?([a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+)(?:\s|$|:|\(|,)/gm, // Basic file paths
    /(?:from\s+['"])([^'"]+)(['"])/g, // Import statements
    /(?:require\(['"])([^'"]+)(['"])/g, // Require statements
    /(?:at\s+)(?:\w+\s+)?\(?([^:)]+?):?\d*\)?/gm, // Stack trace paths
    /(?:Error:|Warning:)\s+([^:]+):/gm, // Error messages
  ];

  // Extract file paths from text
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const path = match[1].trim();
      if (path) fileMatches.add(path);
    }
  });

  // Find matching files in the project
  function findMatchingFiles(
    items: (FileType | FolderType)[],
    currentPath: string = ''
  ) {
    items.forEach((item) => {
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
    dependencies.forEach((dep) => allDependencies.add(dep));
  }

  return { files: extractedFiles, dependencies: allDependencies };
}

/**
 * Aggregates extracted files and their dependencies.
 */
export async function aggregateExtractedFiles(
  extractedFiles: FileType[],
  files: (FileType | FolderType)[]
): Promise<string> {
  let aggregatedCode = '';
  const processedFiles = new Set<string>();

  function findFileByPath(
    items: (FileType | FolderType)[],
    targetPath: string
  ): FileType | null {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, targetPath);
        if (found) return found;
      } else if (item.id === targetPath || item.name === targetPath) {
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
    aggregatedCode += `${indentation}${file.content
      .split('\n')
      .join(`\n${indentation}`)}\n`;
    aggregatedCode += `${indentation}// End of file\n`;
  }

  // Add extracted files
  aggregatedCode += '\n// Extracted Files:\n';
  for (const file of extractedFiles) {
    addFileContent(file);
  }

  return aggregatedCode;
}

/**
 * Determines if a filename should be excluded based on patterns.
 */
function shouldExclude(name: string, excludePatterns: string[]): boolean {
  return excludePatterns.some((pattern) => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(name);
    }
    return name === pattern;
  });
}

/**
 * Checks if a filename has one of the specified code extensions.
 */
function hasCodeExtension(filename: string, codeExtensions: string[]): boolean {
  return codeExtensions.some((ext) =>
    filename.toLowerCase().endsWith(ext.toLowerCase())
  );
}

/**
 * Exports the current project as a ZIP file.
 */
export async function exportProjectAsZip(files: (FileType | FolderType)[]): Promise<void> {
  const zip = new JSZip();

  function addToZip(items: (FileType | FolderType)[], parentPath: string = '') {
    items.forEach((item) => {
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
