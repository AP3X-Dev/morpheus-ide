import { FileType, FolderType } from '../../types';
import { shouldExclude, hasCodeExtension, findFileByPath } from './utils';

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

export async function aggregateExtractedFiles(
  extractedFiles: { files: FileType[]; dependencies: Set<string> },
  files: (FileType | FolderType)[]
): Promise<string> {
  let aggregatedCode = '';
  const processedFiles = new Set<string>();

  function addFileContent(file: FileType, indent: number = 0) {
    if (processedFiles.has(file.name)) return;
    processedFiles.add(file.name);

    const indentation = ' '.repeat(indent);
    aggregatedCode += `\n${indentation}// File: ${file.name}\n`;
    aggregatedCode += `${indentation}${file.content.split('\n').join(`\n${indentation}`)}\n`;
    aggregatedCode += `${indentation}// End of file\n`;
  }

  if (extractedFiles.dependencies.size > 0) {
    aggregatedCode += '\n// Dependencies:\n';
    for (const dep of extractedFiles.dependencies) {
      const depFile = findFileByPath(files, dep);
      if (depFile) {
        addFileContent(depFile, 2);
      }
    }
  }

  aggregatedCode += '\n// Extracted Files:\n';
  for (const file of extractedFiles.files) {
    addFileContent(file);
  }

  return aggregatedCode;
}