// File: src/components/CodeContextModal.tsx

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  Folder as FolderIcon,
  File as FileIcon,
} from 'lucide-react';
import { FileType, FolderType, TreeNode } from '../types';
import {
  generateFileTree,
  exportTreeToFormat,
  downloadTree,
  aggregateCode,
  analyzeFileDependencies,
  aggregateFileWithDependencies,
  extractFilesFromText,
  aggregateExtractedFiles,
} from '../utils/codeContextUtils';

interface CodeContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: (FileType | FolderType)[];
}

export default function CodeContextModal({
  isOpen,
  onClose,
  files,
}: CodeContextModalProps) {
  const [view, setView] = useState<
    'tree' | 'aggregate' | 'dependencies' | 'paste' | 'settings'
  >('tree');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [aggregatedCode, setAggregatedCode] = useState<string>('');
  const [dependencyCode, setDependencyCode] = useState<string>('');
  const [dependencyAnalysis, setDependencyAnalysis] = useState<{
    dependencies: string[];
    dependents: string[];
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [extractedFilesCode, setExtractedFilesCode] = useState<string>('');
  const [config, setConfig] = useState({
    excludePatterns: ['node_modules', '.git'],
    codeExtensions: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java'],
  });

  useEffect(() => {
    if (isOpen && view === 'tree') {
      handleGenerateTree();
    }
  }, [isOpen, view]);

  const handleGenerateTree = async () => {
    const tree = await generateFileTree(files, config.excludePatterns);
    setTreeData(tree);
  };

  const handleExportTree = (format: 'json' | 'markdown' | 'text') => {
    const content = exportTreeToFormat(treeData, format);
    downloadTree(content, format);
  };

  const handleAggregateCode = async () => {
    const code = await aggregateCode(
      files,
      config.excludePatterns,
      config.codeExtensions
    );
    setAggregatedCode(code);
  };

  const handleExportAggregatedCode = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAnalyzeDependencies = async () => {
    if (!selectedFile) return;
    const analysis = await analyzeFileDependencies(selectedFile, files);
    setDependencyAnalysis(analysis);
    const aggregated = await aggregateFileWithDependencies(
      selectedFile,
      files,
      analysis
    );
    setDependencyCode(aggregated);
  };

  const handleAnalyzePastedText = async () => {
    const { files: extractedFiles } = await extractFilesFromText(
      pastedText,
      files,
      config.excludePatterns
    );
    const aggregated = await aggregateExtractedFiles(extractedFiles, files);
    setExtractedFilesCode(aggregated);
  };

  const renderTreeNode = (
    node: TreeNode,
    depth: number = 0,
    selectable: boolean = false
  ) => {
    const isFolder = node.type === 'folder';
    return (
      <div key={node.path} style={{ paddingLeft: `${depth * 1.25}rem` }}>
        <div className="flex items-center">
          {isFolder ? (
            <FolderIcon className="w-4 h-4 mr-2 text-editor-icon" />
          ) : (
            <FileIcon className="w-4 h-4 mr-2 text-editor-icon" />
          )}
          {selectable ? (
            <button
              onClick={() => {
                const file = findFileByPath(files, node.path || '');
                if (file && !('items' in file)) {
                  setSelectedFile(file);
                }
              }}
              className={`text-left flex-1 ${
                selectedFile?.id === node.path
                  ? 'text-editor-text font-semibold'
                  : 'text-editor-icon'
              }`}
            >
              {node.name}
            </button>
          ) : (
            <span className="flex-1 text-editor-text">{node.name}</span>
          )}
        </div>
        {node.children &&
          node.children.map((child) =>
            renderTreeNode(child, depth + 1, selectable)
          )}
      </div>
    );
  };

  const findFileByPath = (
    items: (FileType | FolderType)[],
    targetPath: string
  ): FileType | null => {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, targetPath);
        if (found) return found;
      } else if (item.id === targetPath) {
        return item;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-editor-bg w-3/4 h-3/4 rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-editor-border">
          <h2 className="text-lg font-semibold text-editor-text">
            Code Context Manager
          </h2>
          <button
            onClick={onClose}
            className="text-editor-icon hover:text-editor-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1">
          <div className="w-1/4 bg-editor-sidebar p-4">
            <div className="space-y-2">
              <button
                onClick={() => setView('tree')}
                className={`w-full text-left px-2 py-1 rounded ${
                  view === 'tree'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:bg-editor-active'
                }`}
              >
                File Tree
              </button>
              <button
                onClick={() => setView('aggregate')}
                className={`w-full text-left px-2 py-1 rounded ${
                  view === 'aggregate'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:bg-editor-active'
                }`}
              >
                Aggregate Code
              </button>
              <button
                onClick={() => setView('dependencies')}
                className={`w-full text-left px-2 py-1 rounded ${
                  view === 'dependencies'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:bg-editor-active'
                }`}
              >
                Dependencies Analysis
              </button>
              <button
                onClick={() => setView('paste')}
                className={`w-full text-left px-2 py-1 rounded ${
                  view === 'paste'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:bg-editor-active'
                }`}
              >
                Paste Analysis
              </button>
              <button
                onClick={() => setView('settings')}
                className={`w-full text-left px-2 py-1 rounded ${
                  view === 'settings'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:bg-editor-active'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {/* Render views based on the selected tab */}
            {view === 'tree' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-editor-text font-medium">File Tree</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleGenerateTree}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                    >
                      Generate Tree
                    </button>
                    <div className="relative group">
                      <button className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80">
                        Export Tree
                      </button>
                      <div className="absolute right-0 mt-1 w-32 py-2 bg-editor-bg border border-editor-border rounded shadow-lg hidden group-hover:block">
                        <button
                          onClick={() => handleExportTree('json')}
                          className="w-full px-4 py-1 text-sm text-editor-text hover:bg-editor-active text-left"
                        >
                          JSON
                        </button>
                        <button
                          onClick={() => handleExportTree('markdown')}
                          className="w-full px-4 py-1 text-sm text-editor-text hover:bg-editor-active text-left"
                        >
                          Markdown
                        </button>
                        <button
                          onClick={() => handleExportTree('text')}
                          className="w-full px-4 py-1 text-sm text-editor-text hover:bg-editor-active text-left"
                        >
                          Text
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  {treeData.length > 0 ? (
                    treeData.map((node) => renderTreeNode(node))
                  ) : (
                    <div className="text-editor-icon text-sm">
                      Click "Generate Tree" to view the project structure
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'aggregate' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-editor-text font-medium">
                    Aggregate Code
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAggregateCode}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                    >
                      Aggregate Files
                    </button>
                    <button
                      onClick={() =>
                        handleExportAggregatedCode(
                          aggregatedCode,
                          'aggregated-code.txt'
                        )
                      }
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                      disabled={!aggregatedCode}
                    >
                      <Download className="w-4 h-4 mr-1 inline" />
                      Export
                    </button>
                  </div>
                </div>
                {aggregatedCode && (
                  <div className="mt-4">
                    <pre className="bg-editor-bg border border-editor-border rounded p-4 text-editor-text text-sm overflow-auto max-h-[500px] font-mono">
                      {aggregatedCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {view === 'dependencies' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-editor-text font-medium">
                    Dependencies Analysis
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnalyzeDependencies}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                      disabled={!selectedFile}
                    >
                      Analyze Dependencies
                    </button>
                    {dependencyCode && (
                      <button
                        onClick={() =>
                          handleExportAggregatedCode(
                            dependencyCode,
                            'dependency-analysis.txt'
                          )
                        }
                        className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                        title="Export Dependencies"
                      >
                        <Download className="w-4 h-4 mr-1 inline" />
                        Export
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-editor-text">
                      Select File
                    </h4>
                    <div className="border border-editor-border rounded overflow-auto max-h-[300px]">
                      {treeData.length > 0 ? (
                        treeData.map((node) =>
                          renderTreeNode(node, 0, true)
                        )
                      ) : (
                        <div className="p-4 text-editor-icon text-sm">
                          Generate tree first to select a file
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-editor-text mb-2">
                          Selected File
                        </h4>
                        <div className="flex items-center text-editor-text bg-editor-active rounded p-2">
                          <FileText className="w-4 h-4 mr-2" />
                          {selectedFile.name}
                        </div>
                      </div>

                      {dependencyAnalysis && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-editor-text mb-2">
                              Dependencies
                            </h4>
                            <div className="space-y-1">
                              {dependencyAnalysis.dependencies.length > 0 ? (
                                dependencyAnalysis.dependencies.map(
                                  (dep, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center text-editor-text bg-editor-sidebar rounded p-2"
                                    >
                                      <FileCode className="w-4 h-4 mr-2 text-editor-icon" />
                                      {dep}
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="text-editor-icon text-sm">
                                  No dependencies found
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-editor-text mb-2">
                              Dependents
                            </h4>
                            <div className="space-y-1">
                              {dependencyAnalysis.dependents.length > 0 ? (
                                dependencyAnalysis.dependents.map(
                                  (dep, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center text-editor-text bg-editor-sidebar rounded p-2"
                                    >
                                      <FileCode className="w-4 h-4 mr-2 text-editor-icon" />
                                      {dep}
                                    </div>
                                  )
                                )
                              ) : (
                                <div className="text-editor-icon text-sm">
                                  No dependents found
                                </div>
                              )}
                            </div>
                          </div>

                          {dependencyCode && (
                            <div>
                              <h4 className="text-sm font-medium text-editor-text mb-2">
                                Aggregated Code
                              </h4>
                              <pre className="bg-editor-bg border border-editor-border rounded p-4 text-editor-text text-sm overflow-auto max-h-[300px] font-mono">
                                {dependencyCode}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'paste' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-editor-text font-medium">
                    Paste Analysis
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAnalyzePastedText}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                      disabled={!pastedText.trim()}
                    >
                      Analyze Text
                    </button>
                    {extractedFilesCode && (
                      <button
                        onClick={() =>
                          handleExportAggregatedCode(
                            extractedFilesCode,
                            'extracted-files.txt'
                          )
                        }
                        className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                        title="Export Extracted Files"
                      >
                        <Download className="w-4 h-4 mr-1 inline" />
                        Export
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-editor-text mb-2">
                      Paste Text
                    </h4>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full h-32 bg-editor-bg border border-editor-border rounded p-3 text-editor-text text-sm font-mono resize-none focus:outline-none focus:border-editor-active"
                      placeholder="Paste error messages, stack traces, or any text containing file references..."
                    />
                  </div>

                  {extractedFilesCode && (
                    <div>
                      <h4 className="text-sm font-medium text-editor-text mb-2">
                        Extracted Files and Dependencies
                      </h4>
                      <pre className="bg-editor-bg border border-editor-border rounded p-4 text-editor-text text-sm overflow-auto max-h-[400px] font-mono">
                        {extractedFilesCode}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-editor-text font-medium mb-3">
                    Exclusion Patterns
                  </h3>
                  <div className="space-y-2">
                    {config.excludePatterns.map((pattern, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-editor-text">{pattern}</span>
                        <button
                          onClick={() => {
                            setConfig({
                              ...config,
                              excludePatterns: config.excludePatterns.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-editor-icon hover:text-editor-text"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const pattern = prompt('Enter exclusion pattern:');
                        if (pattern) {
                          setConfig({
                            ...config,
                            excludePatterns: [
                              ...config.excludePatterns,
                              pattern,
                            ],
                          });
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                    >
                      Add Pattern
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-editor-text font-medium mb-3">
                    Code File Extensions
                  </h3>
                  <div className="space-y-2">
                    {config.codeExtensions.map((ext, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-editor-text">{ext}</span>
                        <button
                          onClick={() => {
                            setConfig({
                              ...config,
                              codeExtensions: config.codeExtensions.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-editor-icon hover:text-editor-text"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const ext = prompt('Enter file extension (e.g., .js):');
                        if (ext) {
                          setConfig({
                            ...config,
                            codeExtensions: [...config.codeExtensions, ext],
                          });
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-editor-active text-editor-text rounded hover:bg-opacity-80"
                    >
                      Add Extension
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* End of views */}
          </div>
        </div>
      </div>
    </div>
  );
}
