import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Clock,
  Trash2,
  ArrowRight,
  FileCode,
  Hash,
  Zap
} from 'lucide-react';
import { useContextEngineStore } from '../../stores/contextEngineStore';
import { ResultItem } from './ContextPanel';

export default function SearchTab() {
  const {
    contextPanel,
    recentSearches,
    searchContext,
    setSearchQuery,
    clearSearchResults
  } = useContextEngineStore();

  const [localQuery, setLocalQuery] = useState(contextPanel.searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    type: '',
    filePath: ''
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input when tab becomes active
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = async (query: string = localQuery) => {
    if (!query.trim()) return;

    setSearchQuery(query);
    
    try {
      const searchFilters: Record<string, any> = {};
      if (filters.language) searchFilters.language = filters.language;
      if (filters.type) searchFilters.type = filters.type;
      if (filters.filePath) searchFilters.filePath = filters.filePath;

      await searchContext(query, Object.keys(searchFilters).length > 0 ? searchFilters : undefined);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRecentSearchClick = (query: string) => {
    setLocalQuery(query);
    handleSearch(query);
  };

  const clearFilters = () => {
    setFilters({
      language: '',
      type: '',
      filePath: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-4 border-b border-editor-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-editor-icon" />
          <input
            ref={searchInputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search codebase with AI..."
            className="w-full pl-10 pr-10 py-2 bg-editor-background border border-editor-border rounded-lg text-editor-text placeholder-editor-icon focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              showFilters || hasActiveFilters
                ? 'text-blue-400 bg-blue-400 bg-opacity-20'
                : 'text-editor-icon hover:text-editor-text'
            }`}
            title="Search filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search Button */}
        <button
          onClick={() => handleSearch()}
          disabled={!localQuery.trim() || contextPanel.isLoading}
          className="w-full mt-3 flex items-center justify-center space-x-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>{contextPanel.isLoading ? 'Searching...' : 'AI Search'}</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-editor-border bg-editor-background">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-editor-text">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-editor-icon hover:text-editor-text flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-editor-icon mb-1">Language</label>
              <select
                value={filters.language}
                onChange={(e) => setFilters(prev => ({ ...prev, language: e.target.value }))}
                className="w-full py-1 px-2 bg-editor-sidebar border border-editor-border rounded text-sm text-editor-text focus:outline-none focus:border-blue-400"
              >
                <option value="">All languages</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-editor-icon mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full py-1 px-2 bg-editor-sidebar border border-editor-border rounded text-sm text-editor-text focus:outline-none focus:border-blue-400"
              >
                <option value="">All types</option>
                <option value="function">Functions</option>
                <option value="class">Classes</option>
                <option value="interface">Interfaces</option>
                <option value="variable">Variables</option>
                <option value="import">Imports</option>
                <option value="comment">Comments</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-editor-icon mb-1">File Path</label>
              <input
                type="text"
                value={filters.filePath}
                onChange={(e) => setFilters(prev => ({ ...prev, filePath: e.target.value }))}
                placeholder="e.g., src/components"
                className="w-full py-1 px-2 bg-editor-sidebar border border-editor-border rounded text-sm text-editor-text placeholder-editor-icon focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Searches */}
        {!contextPanel.searchQuery && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-editor-icon" />
              <h3 className="text-sm font-medium text-editor-text">Recent Searches</h3>
            </div>
            <div className="space-y-2">
              {recentSearches.slice(0, 5).map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(query)}
                  className="w-full text-left p-2 text-sm text-editor-text hover:bg-editor-hover rounded-lg transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{query}</span>
                  <ArrowRight className="w-3 h-3 text-editor-icon opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {contextPanel.searchResults.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-editor-text">
                Results ({contextPanel.searchResults.length})
              </h3>
              <button
                onClick={clearSearchResults}
                className="text-xs text-editor-icon hover:text-editor-text flex items-center space-x-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            <div className="space-y-3">
              {contextPanel.searchResults.map((result, index) => (
                <ResultItem key={index} result={result} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!contextPanel.isLoading && !contextPanel.searchQuery && recentSearches.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Search className="w-12 h-12 text-editor-icon mx-auto mb-4" />
              <h3 className="text-lg font-medium text-editor-text mb-2">AI-Powered Search</h3>
              <p className="text-sm text-editor-icon max-w-xs">
                Search your codebase using natural language. Ask questions about functions, 
                classes, patterns, or any code concept.
              </p>
              <div className="mt-4 space-y-2 text-xs text-editor-icon">
                <div>Try: "authentication functions"</div>
                <div>Try: "error handling patterns"</div>
                <div>Try: "React components with hooks"</div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!contextPanel.isLoading && contextPanel.searchQuery && contextPanel.searchResults.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Hash className="w-12 h-12 text-editor-icon mx-auto mb-4" />
              <h3 className="text-lg font-medium text-editor-text mb-2">No Results Found</h3>
              <p className="text-sm text-editor-icon max-w-xs">
                No matching code found for "{contextPanel.searchQuery}". 
                Try different keywords or check your filters.
              </p>
              <button
                onClick={() => {
                  setLocalQuery('');
                  clearSearchResults();
                }}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300"
              >
                Clear search
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
