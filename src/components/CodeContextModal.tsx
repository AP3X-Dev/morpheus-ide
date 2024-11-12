import React, { useState } from 'react';
import {
  X,
  FolderTree,
  FileCode,
  GitFork,
  Settings,
  ArrowRight,
  ArrowLeft,
  Download,
  Clipboard,
} from 'lucide-react';
import { FileType, FolderType } from '../types';
import {
  generateFileTree,
  exportTreeToFormat,
  downloadTree,
  aggregateCode,
  analyzeFileDependencies,
  aggregateFileWithDependencies,
  extractFilesFromText,
  aggregateExtractedFiles,
  TreeNode,
} from '../utils/codeContextUtils';

interface CodeContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: (FileType | FolderType)[];
}

type ContextView = 'tree' | 'aggregate' | 'dependencies' | 'settings' | 'paste';
type ExportFormat = 'json' | 'markdown' | 'text';

interface DependencyAnalysis {
  dependencies: string[];
  dependents: string[];
}

export default function CodeContextModal({
  isOpen,
  onClose,
  files,
}: CodeContextModalProps) {
  const [view, setView] = useState<ContextView>('tree');
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [aggregatedCode, setAggregatedCode] = useState<string>('');
  const [dependencyAnalysis, setDependencyAnalysis] =
    useState<DependencyAnalysis | null>(null);
  const [dependencyCode, setDependencyCode] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [extractedFilesCode, setExtractedFilesCode] = useState<string>('');
  const [config, setConfig] = useState({
    excludePatterns: ['node_modules', '.git', '*.log'],
    codeExtensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.py',
      '.java',
      '.cpp',
      '.c',
    ],
  });

  if (!isOpen) return null;

  const handleGenerateTree = async () => {
    const tree = await generateFileTree(files, config.excludePatterns);
    setTreeData(tree);
  };

  const handleExportTree = (format: ExportFormat) => {
    if (treeData.length === 0) return;
    const content = exportTreeToFormat(treeData, format);
    downloadTree(content, `project-tree.${format}`);
  };

  const handleAggregateCode = async () => {
    const code = await aggregateCode(
      files,
      config.excludePatterns,
      config.codeExtensions
    );
    setAggregatedCode(code);
  };

  const handleExportAggregatedCode = (code: string, filename: string) => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
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
    const code = await aggregateFileWithDependencies(
      selectedFile,
      files,
      analysis
    );
    setDependencyCode(code);
  };

  const handleAnalyzePastedText = async () => {
    if (!pastedText.trim()) return;
    const extractedFiles = await extractFilesFromText(
      pastedText,
      files,
      config.excludePatterns
    );
    const code = await aggregateExtractedFiles(extractedFiles, files);
    setExtractedFilesCode(code);
  };

  const handleFileSelect = (file: FileType) => {
    setSelectedFile(file);
    setDependencyAnalysis(null);
    setDependencyCode('');
  };

  const renderTreeNode = (
    node: TreeNode,
    level: number = 0,
    forFileSelect: boolean = false
  ) => {
    const indent = level * 20;
    return (
      <div key={node.path}>
        <div
          className={`flex items-center py-1 hover:bg-editor-active rounded px-2 ${
            forFileSelect && !('children' in node) ? 'cursor-pointer' : ''
          }`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => {
            if (forFileSelect && !('children' in node) && node.path) {
              const file = findFileByPath(files, node.path);
              if (file) handleFileSelect(file);
            }
          }}
        >
          {node.type === 'folder' ? (
            <FolderTree className="w-4 h-4 mr-2 text-editor-icon" />
          ) : (
            <FileCode className="w-4 h-4 mr-2 text-editor-icon" />
          )}
          <span className="text-editor-text text-sm">{node.name}</span>
        </div>
        {node.children?.map((child) =>
          renderTreeNode(child, level + 1, forFileSelect)
        )}
      </div>
    );
  };

  const findFileByPath = (
    items: (FileType | FolderType)[],
    path: string
  ): FileType | null => {
    for (const item of items) {
      if ('items' in item) {
        const found = findFileByPath(item.items, path);
        if (found) return found;
      } else if (path.endsWith(item.name)) {
        return item;
      }
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-editor-bg border border-editor-border rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <h2 className="text-lg font-semibold text-editor-text">
            Code Context Manager
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-16 border-r border-editor-border bg-editor-sidebar">
            <button
              onClick={() => setView('tree')}
              className={`w-full p-4 flex flex-col items-center gap-1 ${
                view === 'tree'
                  ? 'text-editor-text bg-editor-active'
                  : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
              }`}
            >
              <FolderTree className="w-5 h-5" />
              <span className="text-xs">Tree</span>
            </button>
            <button
              onClick={() => setView('aggregate')}
              className={`w-full p-4 flex flex-col items-center gap-1 ${
                view === 'aggregate'
                  ? 'text-editor-text bg-editor-active'
                  : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
              }`}
            >
              <FileCode className="w-5 h-5" />
              <span className="text-xs">Code</span>
            </button>
            <button
              onClick={() => setView('dependencies')}
              className={`w-full p-4 flex flex-col items-center gap-1 ${
                view === 'dependencies'
                  ? 'text-editor-text bg-editor-active'
                  : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
              }`}
            >
              <GitFork className="w-5 h-5" />
              <span className="text-xs">Deps</span>
            </button>
            <button
              onClick={() => setView('paste')}
              className={`w-full p-4 flex flex-col items-center gap-1 ${
                view === 'paste'
                  ? 'text-editor-text bg-editor-active'
                  : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
              }`}
            >
              <Clipboard className="w-5 h-5" />
              <span className="text-xs">Paste</span>
            </button>
            <button
              onClick={() => setView('settings')}
              className={`w-full p-4 flex flex-col items-center gap-1 ${
                view === 'settings'
                  ? 'text-editor-text bg-editor-active'
                  : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Config</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto">
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
                        <Download className="w-4 h-4" />
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
                          <FileCode className="w-4 h-4 mr-2" />
                          {selectedFile.name}
                        </div>
                      </div>

                      {dependencyAnalysis && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-editor-text mb-2">
                              Dependencies{' '}
                              <ArrowRight className="w-4 h-4 inline" />
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
                              <ArrowLeft className="w-4 h-4 inline" />{' '}
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
                        <Download className="w-4 h-4" />
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
          </div>
        </div>
      </div>
    </div>
  );
}
