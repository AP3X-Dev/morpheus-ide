import React, { useState } from 'react';
import { X, FileCode, Binary, Globe, Server, Database, Smartphone, Brain, Blocks, Coins, Upload, Folder } from 'lucide-react';
import { Framework, FileType, FolderType } from '../types';
import FileUpload from './FileUpload';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (frameworkId: string) => void;
  onFileUpload: (files: (FileType | FolderType)[]) => void;
  onSelectSource: (source: 'zip' | 'local') => void;
  onError: (message: string) => void;
}

const frameworks: Framework[] = [
  {
    id: 'next',
    name: 'Next.js',
    description: 'Full-stack React framework with server-side rendering',
    icon: <Globe className="w-8 h-8 text-black" />,
    category: 'fullstack'
  },
  {
    id: 'react',
    name: 'React',
    description: 'Modern web development with React 18 and TypeScript',
    icon: <FileCode className="w-8 h-8 text-blue-400" />,
    category: 'frontend'
  },
  {
    id: 'flask',
    name: 'Flask',
    description: 'Modern Python web framework with SQLAlchemy',
    icon: <Binary className="w-8 h-8 text-green-400" />,
    category: 'backend'
  },
  {
    id: 'express',
    name: 'Express.js',
    description: 'Fast, unopinionated web framework for Node.js',
    icon: <Server className="w-8 h-8 text-yellow-400" />,
    category: 'backend'
  },
  {
    id: 'django',
    name: 'Django',
    description: 'High-level Python web framework',
    icon: <Database className="w-8 h-8 text-emerald-400" />,
    category: 'backend'
  },
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Build native mobile apps using React',
    icon: <Smartphone className="w-8 h-8 text-purple-400" />,
    category: 'mobile'
  },
  {
    id: 'langchain',
    name: 'LangChain',
    description: 'Build AI applications with LangChain and FastAPI',
    icon: <Brain className="w-8 h-8 text-pink-400" />,
    category: 'ai'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    description: 'Smart contracts with Solidity and Hardhat',
    icon: <Blocks className="w-8 h-8 text-blue-500" />,
    category: 'blockchain'
  },
  {
    id: 'solana',
    name: 'Solana',
    description: 'High-performance smart contracts with Rust',
    icon: <Coins className="w-8 h-8 text-purple-500" />,
    category: 'blockchain'
  }
];

type Category = 'all' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ai' | 'blockchain';

export default function ProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  onFileUpload,
  onSelectSource,
  onError
}: ProjectModalProps) {
  const [view, setView] = useState<'templates' | 'open'>('templates');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const categories: { id: Category; name: string }[] = [
    { id: 'all', name: 'All' },
    { id: 'frontend', name: 'Frontend' },
    { id: 'backend', name: 'Backend' },
    { id: 'fullstack', name: 'Full Stack' },
    { id: 'mobile', name: 'Mobile' },
    { id: 'ai', name: 'AI' },
    { id: 'blockchain', name: 'Blockchain' }
  ];

  const filteredFrameworks = frameworks.filter(framework => {
    const matchesCategory = selectedCategory === 'all' || framework.category === selectedCategory;
    const matchesSearch = framework.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         framework.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateProject = async (frameworkId: string) => {
    setIsCreating(true);
    try {
      await onCreateProject(frameworkId);
      onClose();
    } catch (error) {
      onError(`Failed to create ${frameworkId} project. Please try again.`);
      console.error('Project creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSourceSelect = async (source: 'zip' | 'local') => {
    try {
      await onSelectSource(source);
      if (source === 'local') {
        onClose();
      }
    } catch (error) {
      onError('Unable to access file system. Please try uploading a ZIP file instead.');
      console.error('File system access error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-editor-bg border border-editor-border rounded-lg w-[800px] max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-editor-border">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-editor-text">Project Manager</h2>
            <div className="flex rounded-lg overflow-hidden border border-editor-border">
              <button
                onClick={() => setView('templates')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === 'templates'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setView('open')}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === 'open'
                    ? 'bg-editor-active text-editor-text'
                    : 'text-editor-icon hover:text-editor-text hover:bg-editor-active'
                }`}
              >
                Open Project
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded"
            disabled={isCreating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {view === 'templates' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-editor-border">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-editor-active text-editor-text rounded border border-editor-border focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 p-4 border-b border-editor-border">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-editor-active text-editor-text hover:bg-opacity-80'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 auto-rows-max">
                {filteredFrameworks.map(framework => (
                  <button
                    key={framework.id}
                    onClick={() => handleCreateProject(framework.id)}
                    className="flex items-start gap-4 p-4 bg-editor-active rounded-lg hover:bg-opacity-80 transition-colors text-left h-[100px]"
                    disabled={isCreating}
                  >
                    <div className="p-2 bg-editor-bg rounded-lg shrink-0">
                      {framework.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-editor-text font-medium truncate">
                        {framework.name}
                      </h3>
                      <p className="text-editor-icon text-sm mt-1 line-clamp-2">
                        {framework.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 space-y-4">
            <FileUpload
              onFileUpload={(files) => {
                onFileUpload(files);
                onClose();
              }}
              onError={onError}
            >
              <button className="w-full flex items-center gap-4 p-4 bg-editor-active rounded-lg hover:bg-opacity-80 transition-colors text-left group">
                <div className="p-2 bg-editor-bg rounded-lg group-hover:bg-opacity-80">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-editor-text font-medium">Upload ZIP</h3>
                  <p className="text-editor-icon text-sm mt-1">
                    Import a project from a ZIP file
                  </p>
                </div>
              </button>
            </FileUpload>

            <button
              onClick={() => handleSourceSelect('local')}
              className="w-full flex items-center gap-4 p-4 bg-editor-active rounded-lg hover:bg-opacity-80 transition-colors text-left group"
            >
              <div className="p-2 bg-editor-bg rounded-lg group-hover:bg-opacity-80">
                <Folder className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-editor-text font-medium">Open Local Folder</h3>
                <p className="text-editor-icon text-sm mt-1">
                  Select a folder from your computer
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}