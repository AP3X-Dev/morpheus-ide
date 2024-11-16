import React, { useState } from 'react';
import { X, FileCode, Binary, Globe, Server, Database, Smartphone, Brain } from 'lucide-react';
import { Framework } from '../types';
import { createLangChainProject } from '../utils/templates/langchain';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (frameworkId: string) => void;
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
  }
];

export default function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'frontend', name: 'Frontend' },
    { id: 'backend', name: 'Backend' },
    { id: 'fullstack', name: 'Full Stack' },
    { id: 'mobile', name: 'Mobile' },
    { id: 'ai', name: 'AI' }
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
      onCreateProject(frameworkId);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-editor-bg border border-editor-border rounded-lg w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-editor-border shrink-0">
          <h2 className="text-lg font-semibold text-editor-text">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded"
            disabled={isCreating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-editor-border shrink-0">
          <input
            type="text"
            placeholder="Search frameworks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-editor-active text-editor-text rounded border border-editor-border focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-editor-border shrink-0">
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

        {/* Framework Grid - Now with fixed height and scrolling */}
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
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
                  <h3 className="text-editor-text font-medium truncate">{framework.name}</h3>
                  <p className="text-editor-icon text-sm mt-1 line-clamp-2">{framework.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}