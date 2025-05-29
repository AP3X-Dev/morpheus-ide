import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Network,
  Lightbulb,
  X,
  Loader2,
  ChevronRight,
  FileCode,
  Hash,
  Clock,
  Zap
} from 'lucide-react';
import { useContextEngineStore } from '../../stores/contextEngineStore';
import { ContextSearchResult } from '../../types/contextEngine';
import SearchTab from './SearchTab';
import ChatTab from './ChatTab';
import RelationshipsTab from './RelationshipsTab';
import InsightsTab from './InsightsTab';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContextPanel({ isOpen, onClose }: ContextPanelProps) {
  const {
    contextPanel,
    currentProject,
    setActiveTab,
    clearSearchResults
  } = useContextEngineStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Clear search results when panel closes
    if (!isOpen) {
      clearSearchResults();
    }
  }, [isOpen, clearSearchResults]);

  if (!isOpen) return null;

  const tabs = [
    {
      id: 'search' as const,
      label: 'Search',
      icon: Search,
      description: 'Search codebase with AI'
    },
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
      description: 'AI-powered code assistance'
    },
    {
      id: 'relationships' as const,
      label: 'Relations',
      icon: Network,
      description: 'Code dependencies & relationships'
    },
    {
      id: 'insights' as const,
      label: 'Insights',
      icon: Lightbulb,
      description: 'AI-generated code insights'
    }
  ];

  const renderTabContent = () => {
    switch (contextPanel.activeTab) {
      case 'search':
        return <SearchTab />;
      case 'chat':
        return <ChatTab />;
      case 'relationships':
        return <RelationshipsTab />;
      case 'insights':
        return <InsightsTab />;
      default:
        return <SearchTab />;
    }
  };

  return (
    <div className={`fixed right-0 top-0 h-full glass border-l border-white/20 shadow-2xl z-50 transition-all duration-500 ease-out ${
      isCollapsed ? 'w-16' : 'w-[420px]'
    } animate-slideIn`}>
      {/* Modern Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
        {!isCollapsed && (
          <>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold gradient-text">AI Context</h2>
                <p className="text-xs text-gray-400">Intelligent Code Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
                title="Collapse panel"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-3 text-blue-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105 glow"
            title="Expand panel"
          >
            <Zap className="w-6 h-6" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Enhanced Project Status */}
          {currentProject && (
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-lg font-semibold text-white">{currentProject.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Files</div>
                  <div className="text-white font-bold text-lg">{currentProject.totalFiles}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Chunks</div>
                  <div className="text-white font-bold text-lg">{currentProject.totalChunks}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>Last indexed:</span>
                <span>{new Date(currentProject.lastIndexed).toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* Modern Tab Navigation */}
          <div className="flex border-b border-white/10 bg-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = contextPanel.activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center p-4 text-xs transition-all duration-200 relative group ${
                    isActive
                      ? 'text-white bg-gradient-to-b from-blue-500/20 to-purple-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={tab.description}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400"></div>
                  )}
                  <Icon className={`w-5 h-5 mb-2 transition-all duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  <span className="font-medium">{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>

          {/* Modern Loading Overlay */}
          {contextPanel.isLoading && (
            <div className="absolute inset-0 glass bg-black/40 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-4 text-white">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-500/30 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">Processing...</div>
                  <div className="text-sm text-gray-400">AI is analyzing your code</div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Error Display */}
          {contextPanel.error && (
            <div className="absolute bottom-4 left-4 right-4 glass bg-red-500/20 border border-red-500/30 rounded-xl p-4 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-red-300 mb-1">Error</div>
                  <div className="text-sm text-red-200">{contextPanel.error}</div>
                </div>
                <button
                  onClick={() => {/* Clear error */}}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-6 space-y-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = contextPanel.activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsCollapsed(false);
                }}
                className={`relative p-3 rounded-xl transition-all duration-200 hover:scale-110 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white glow'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title={tab.description}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
                <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Result Item Component
export function ResultItem({ result }: { result: ContextSearchResult }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'function':
        return '𝑓';
      case 'class':
        return 'C';
      case 'interface':
        return 'I';
      case 'variable':
        return 'V';
      case 'import':
        return '→';
      case 'comment':
        return '#';
      default:
        return '{}';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'function':
        return 'text-yellow-400';
      case 'class':
        return 'text-blue-400';
      case 'interface':
        return 'text-purple-400';
      case 'variable':
        return 'text-green-400';
      case 'import':
        return 'text-orange-400';
      case 'comment':
        return 'text-gray-400';
      default:
        return 'text-editor-text';
    }
  };

  return (
    <div className="glass border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-200 hover:scale-[1.02] group animate-fadeIn">
      {/* Modern Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getTypeColor(result.chunk.type)} bg-white/10`}>
            {getTypeIcon(result.chunk.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {result.chunk.metadata.name || `${result.chunk.type} block`}
            </div>
            <div className="text-xs text-gray-400">
              {result.chunk.type} • {Math.round(result.similarity * 100)}% match
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
              {Math.round(result.similarity * 100)}%
            </div>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 group-hover:text-white transition-all duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </div>

      {/* Enhanced File Path */}
      <div className="flex items-center space-x-2 mt-3 text-xs">
        <div className="flex items-center space-x-1 text-gray-400">
          <FileCode className="w-3 h-3" />
          <span className="truncate">{result.chunk.filePath}</span>
        </div>
        <div className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
          {result.chunk.startLine}-{result.chunk.endLine}
        </div>
      </div>

      {/* Enhanced Explanation */}
      {result.explanation && (
        <div className="mt-3 text-xs text-blue-200 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <span>{result.explanation}</span>
          </div>
        </div>
      )}

      {/* Enhanced Expanded Content */}
      {isExpanded && (
        <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
          <div className="bg-black/20 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-300">Code Preview</span>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Copy
              </button>
            </div>
            <pre className="text-xs text-gray-200 overflow-x-auto">
              <code>{result.chunk.content}</code>
            </pre>
          </div>

          {/* Enhanced Metadata */}
          <div className="grid grid-cols-1 gap-3">
            {result.chunk.metadata.signature && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Signature</div>
                <code className="text-xs text-green-300 bg-black/20 px-2 py-1 rounded">
                  {result.chunk.metadata.signature}
                </code>
              </div>
            )}

            {result.chunk.metadata.complexity && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-300 mb-1">Complexity</div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-400 to-red-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(result.chunk.metadata.complexity / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-white font-medium">
                    {result.chunk.metadata.complexity}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
