import React, { useState } from 'react';
import {
  Network,
  FileCode,
  ArrowRight,
  GitFork,
  Eye,
  Filter,
  Layers
} from 'lucide-react';
import { useContextEngineStore } from '../../stores/contextEngineStore';

export default function RelationshipsTab() {
  const { currentProject } = useContextEngineStore();
  const [viewMode, setViewMode] = useState<'dependencies' | 'dependents' | 'graph'>('dependencies');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Mock data for demonstration
  const mockRelationships = [
    {
      source: 'src/components/Editor.tsx',
      target: 'src/utils/fileUtils.ts',
      type: 'imports',
      strength: 0.9
    },
    {
      source: 'src/App.tsx',
      target: 'src/components/Editor.tsx',
      type: 'imports',
      strength: 0.8
    },
    {
      source: 'src/components/Sidebar.tsx',
      target: 'src/types/index.ts',
      type: 'imports',
      strength: 0.7
    }
  ];

  const mockFiles = [
    'src/App.tsx',
    'src/components/Editor.tsx',
    'src/components/Sidebar.tsx',
    'src/utils/fileUtils.ts',
    'src/types/index.ts'
  ];

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Network className="w-12 h-12 text-editor-icon mx-auto mb-4" />
          <h3 className="text-lg font-medium text-editor-text mb-2">No Project Loaded</h3>
          <p className="text-sm text-editor-icon">
            Load a project to explore code relationships and dependencies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-editor-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-editor-text">Code Relationships</h3>
          <button className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Selector */}
        <div className="flex space-x-1 bg-editor-background rounded-lg p-1">
          {[
            { id: 'dependencies', label: 'Dependencies', icon: ArrowRight },
            { id: 'dependents', label: 'Dependents', icon: GitFork },
            { id: 'graph', label: 'Graph', icon: Network }
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`flex-1 flex items-center justify-center space-x-1 py-2 px-3 rounded text-xs transition-colors ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'text-editor-icon hover:text-editor-text'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'dependencies' && (
          <DependenciesView 
            files={mockFiles}
            relationships={mockRelationships}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        )}

        {viewMode === 'dependents' && (
          <DependentsView 
            files={mockFiles}
            relationships={mockRelationships}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
          />
        )}

        {viewMode === 'graph' && (
          <GraphView relationships={mockRelationships} />
        )}
      </div>
    </div>
  );
}

// Dependencies View Component
function DependenciesView({ 
  files, 
  relationships, 
  selectedFile, 
  onFileSelect 
}: {
  files: string[];
  relationships: any[];
  selectedFile: string | null;
  onFileSelect: (file: string | null) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-editor-text mb-2">Select a file to view its dependencies:</h4>
        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file}
              onClick={() => onFileSelect(file === selectedFile ? null : file)}
              className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                selectedFile === file
                  ? 'bg-blue-600 bg-opacity-20 text-blue-400'
                  : 'text-editor-text hover:bg-editor-hover'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span className="text-sm truncate">{file}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div>
          <h4 className="text-sm font-medium text-editor-text mb-3">
            Dependencies of {selectedFile}:
          </h4>
          <div className="space-y-2">
            {relationships
              .filter(rel => rel.source === selectedFile)
              .map((rel, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-editor-background rounded-lg border border-editor-border">
                  <div className="flex items-center space-x-2 flex-1">
                    <FileCode className="w-4 h-4 text-editor-icon" />
                    <span className="text-sm text-editor-text">{rel.target}</span>
                  </div>
                  <div className="text-xs text-editor-icon">
                    {rel.type}
                  </div>
                  <div className="w-16 bg-editor-border rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${rel.strength * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Dependents View Component
function DependentsView({ 
  files, 
  relationships, 
  selectedFile, 
  onFileSelect 
}: {
  files: string[];
  relationships: any[];
  selectedFile: string | null;
  onFileSelect: (file: string | null) => void;
}) {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-editor-text mb-2">Select a file to view what depends on it:</h4>
        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file}
              onClick={() => onFileSelect(file === selectedFile ? null : file)}
              className={`w-full text-left p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                selectedFile === file
                  ? 'bg-green-600 bg-opacity-20 text-green-400'
                  : 'text-editor-text hover:bg-editor-hover'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span className="text-sm truncate">{file}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div>
          <h4 className="text-sm font-medium text-editor-text mb-3">
            Files that depend on {selectedFile}:
          </h4>
          <div className="space-y-2">
            {relationships
              .filter(rel => rel.target === selectedFile)
              .map((rel, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-editor-background rounded-lg border border-editor-border">
                  <div className="flex items-center space-x-2 flex-1">
                    <FileCode className="w-4 h-4 text-editor-icon" />
                    <span className="text-sm text-editor-text">{rel.source}</span>
                  </div>
                  <div className="text-xs text-editor-icon">
                    {rel.type}
                  </div>
                  <div className="w-16 bg-editor-border rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full"
                      style={{ width: `${rel.strength * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Graph View Component
function GraphView({ relationships }: { relationships: any[] }) {
  return (
    <div className="p-4">
      <div className="text-center py-12">
        <Network className="w-16 h-16 text-editor-icon mx-auto mb-4" />
        <h4 className="text-lg font-medium text-editor-text mb-2">Interactive Dependency Graph</h4>
        <p className="text-sm text-editor-icon mb-4">
          Visual representation of code relationships coming soon.
        </p>
        <div className="bg-editor-background border border-editor-border rounded-lg p-4 max-w-sm mx-auto">
          <h5 className="text-sm font-medium text-editor-text mb-2">Current Relationships:</h5>
          <div className="space-y-2 text-xs">
            {relationships.map((rel, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-editor-text truncate">{rel.source.split('/').pop()}</span>
                <ArrowRight className="w-3 h-3 text-editor-icon mx-2" />
                <span className="text-editor-text truncate">{rel.target.split('/').pop()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
