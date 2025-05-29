import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useContextEngineStore } from '../../stores/contextEngineStore';

export default function InsightsTab() {
  const { currentProject } = useContextEngineStore();
  const [activeCategory, setActiveCategory] = useState<'quality' | 'security' | 'performance' | 'patterns'>('quality');
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock insights data
  const mockInsights = {
    quality: [
      {
        id: 1,
        type: 'warning',
        title: 'High Complexity Functions',
        description: 'Found 3 functions with complexity score > 8',
        files: ['src/utils/fileUtils.ts', 'src/components/Editor.tsx'],
        severity: 'medium',
        suggestion: 'Consider breaking down complex functions into smaller, more manageable pieces.'
      },
      {
        id: 2,
        type: 'info',
        title: 'Missing Documentation',
        description: '15 functions lack proper documentation',
        files: ['src/services/*.ts'],
        severity: 'low',
        suggestion: 'Add JSDoc comments to improve code maintainability.'
      }
    ],
    security: [
      {
        id: 3,
        type: 'error',
        title: 'Potential XSS Vulnerability',
        description: 'Direct DOM manipulation without sanitization',
        files: ['src/components/Editor.tsx:45'],
        severity: 'high',
        suggestion: 'Use proper sanitization or React\'s built-in XSS protection.'
      },
      {
        id: 4,
        type: 'warning',
        title: 'Hardcoded API Keys',
        description: 'Found potential API keys in source code',
        files: ['src/config/api.ts'],
        severity: 'high',
        suggestion: 'Move sensitive data to environment variables.'
      }
    ],
    performance: [
      {
        id: 5,
        type: 'warning',
        title: 'Large Bundle Size',
        description: 'Bundle size exceeds recommended limits',
        files: ['Multiple files'],
        severity: 'medium',
        suggestion: 'Consider code splitting and lazy loading for better performance.'
      },
      {
        id: 6,
        type: 'info',
        title: 'Unused Dependencies',
        description: '4 dependencies are imported but not used',
        files: ['package.json'],
        severity: 'low',
        suggestion: 'Remove unused dependencies to reduce bundle size.'
      }
    ],
    patterns: [
      {
        id: 7,
        type: 'info',
        title: 'Consistent Error Handling',
        description: 'Good use of try-catch blocks throughout the codebase',
        files: ['src/services/*.ts'],
        severity: 'positive',
        suggestion: 'Continue following this pattern for robust error handling.'
      },
      {
        id: 8,
        type: 'warning',
        title: 'Mixed State Management',
        description: 'Using both useState and Zustand inconsistently',
        files: ['src/components/*.tsx'],
        severity: 'medium',
        suggestion: 'Standardize on one state management approach for consistency.'
      }
    ]
  };

  const categories = [
    { id: 'quality', label: 'Code Quality', icon: BarChart3, color: 'blue' },
    { id: 'security', label: 'Security', icon: Shield, color: 'red' },
    { id: 'performance', label: 'Performance', icon: Zap, color: 'yellow' },
    { id: 'patterns', label: 'Patterns', icon: TrendingUp, color: 'green' }
  ];

  const generateInsights = async () => {
    setIsGenerating(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Lightbulb className="w-12 h-12 text-editor-icon mx-auto mb-4" />
          <h3 className="text-lg font-medium text-editor-text mb-2">No Project Loaded</h3>
          <p className="text-sm text-editor-icon">
            Load a project to get AI-powered insights about your code.
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
          <h3 className="text-sm font-medium text-editor-text">AI Insights</h3>
          <button
            onClick={generateInsights}
            disabled={isGenerating}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Analyzing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Category Selector */}
        <div className="grid grid-cols-2 gap-1 bg-editor-background rounded-lg p-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`flex items-center justify-center space-x-1 py-2 px-2 rounded text-xs transition-colors ${
                  isActive
                    ? `bg-${category.color}-600 text-white`
                    : 'text-editor-icon hover:text-editor-text'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isGenerating ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-400 mx-auto mb-4 animate-spin" />
            <h4 className="text-sm font-medium text-editor-text mb-2">Analyzing Codebase</h4>
            <p className="text-xs text-editor-icon">
              AI is examining your code for insights...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mockInsights[activeCategory].map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 p-4 bg-editor-background rounded-lg border border-editor-border">
          <h4 className="text-sm font-medium text-editor-text mb-3">Analysis Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-editor-icon">Total Issues:</span>
              <span className="text-editor-text font-medium">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-editor-icon">High Priority:</span>
              <span className="text-red-400 font-medium">2</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-editor-icon">Medium Priority:</span>
              <span className="text-yellow-400 font-medium">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-editor-icon">Low Priority:</span>
              <span className="text-green-400 font-medium">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }: { insight: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (insight.type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Lightbulb className="w-4 h-4 text-blue-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'high':
        return 'border-red-500 bg-red-500 bg-opacity-10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500 bg-opacity-10';
      case 'low':
        return 'border-blue-500 bg-blue-500 bg-opacity-10';
      case 'positive':
        return 'border-green-500 bg-green-500 bg-opacity-10';
      default:
        return 'border-editor-border bg-editor-background';
    }
  };

  return (
    <div className={`border rounded-lg p-3 transition-colors ${getSeverityColor()}`}>
      {/* Header */}
      <div 
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start space-x-2 flex-1">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-medium text-editor-text">{insight.title}</h5>
            <p className="text-xs text-editor-icon mt-1">{insight.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${
            insight.severity === 'high' ? 'bg-red-600 text-white' :
            insight.severity === 'medium' ? 'bg-yellow-600 text-white' :
            insight.severity === 'low' ? 'bg-blue-600 text-white' :
            'bg-green-600 text-white'
          }`}>
            {insight.severity}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-editor-border">
          {/* Affected Files */}
          <div className="mb-3">
            <h6 className="text-xs font-medium text-editor-text mb-1">Affected Files:</h6>
            <div className="space-y-1">
              {insight.files.map((file: string, index: number) => (
                <div key={index} className="text-xs text-editor-icon bg-editor-background rounded px-2 py-1">
                  {file}
                </div>
              ))}
            </div>
          </div>

          {/* Suggestion */}
          <div className="bg-editor-sidebar rounded p-2">
            <h6 className="text-xs font-medium text-editor-text mb-1">Suggestion:</h6>
            <p className="text-xs text-editor-text">{insight.suggestion}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 mt-3">
            <button className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              Fix Now
            </button>
            <button className="text-xs px-2 py-1 bg-editor-background hover:bg-editor-hover text-editor-text border border-editor-border rounded transition-colors">
              Learn More
            </button>
            <button className="text-xs px-2 py-1 text-editor-icon hover:text-editor-text transition-colors">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
