import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { FileType } from '../../types';
import { CodeSuggestion, ContextSearchResult } from '../../types/contextEngine';
import { useContextEngineStore } from '../../stores/contextEngineStore';
import { getFileLanguage } from '../../utils/fileUtils';
import { 
  Lightbulb, 
  Zap, 
  MessageSquare, 
  X, 
  Check,
  ArrowRight,
  FileCode,
  Clock
} from 'lucide-react';

interface EnhancedEditorProps {
  file: FileType | null;
  onContentChange: (fileId: string, content: string) => void;
}

export default function EnhancedEditor({ file, onContentChange }: EnhancedEditorProps) {
  const { 
    suggestions, 
    generateSuggestions,
    searchContext,
    isInitialized 
  } = useContextEngineStore();

  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showContextTooltip, setShowContextTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipContent, setTooltipContent] = useState<ContextSearchResult[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{ line: number; column: number } | null>(null);

  const editorRef = useRef<any>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editor && monaco && file && isInitialized) {
      setupAIFeatures();
    }
  }, [editor, monaco, file, isInitialized]);

  const setupAIFeatures = () => {
    if (!editor || !monaco || !file) return;

    // Setup hover provider for context tooltips
    const hoverProvider = monaco.languages.registerHoverProvider(file.language, {
      provideHover: async (model: any, position: any) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        try {
          const results = await searchContext(word.word);
          if (results.length > 0) {
            const content = results.slice(0, 3).map(result => ({
              value: `**${result.chunk.type}**: ${result.chunk.metadata.name || 'Unknown'}\n\n` +
                     `*File*: ${result.chunk.filePath}:${result.chunk.startLine}\n\n` +
                     `*Similarity*: ${Math.round(result.similarity * 100)}%\n\n` +
                     `\`\`\`${result.chunk.language}\n${result.chunk.content.slice(0, 200)}...\n\`\`\``
            }));

            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: content
            };
          }
        } catch (error) {
          console.error('Failed to get hover context:', error);
        }

        return null;
      }
    });

    // Setup completion provider for AI suggestions
    const completionProvider = monaco.languages.registerCompletionItemProvider(file.language, {
      provideCompletionItems: async (model: any, position: any) => {
        if (!file) return { suggestions: [] };

        try {
          const aiSuggestions = await generateSuggestions(file, {
            line: position.lineNumber,
            column: position.columnNumber
          });

          const monacoSuggestions = aiSuggestions.map((suggestion, index) => ({
            label: `AI: ${suggestion.content.split('\n')[0].slice(0, 50)}...`,
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: suggestion.content,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: `AI-generated suggestion (confidence: ${Math.round(suggestion.confidence * 100)}%)`,
            sortText: `0${index}`, // Prioritize AI suggestions
            detail: 'AI Assistant'
          }));

          return { suggestions: monacoSuggestions };
        } catch (error) {
          console.error('Failed to get AI completions:', error);
          return { suggestions: [] };
        }
      }
    });

    // Setup cursor position change handler
    const disposable = editor.onDidChangeCursorPosition((e: any) => {
      setCurrentPosition({
        line: e.position.lineNumber,
        column: e.position.columnNumber
      });

      // Debounce suggestion generation
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }

      suggestionTimeoutRef.current = setTimeout(() => {
        if (file) {
          generateSuggestions(file, {
            line: e.position.lineNumber,
            column: e.position.columnNumber
          });
        }
      }, 1000);
    });

    // Cleanup function
    return () => {
      hoverProvider.dispose();
      completionProvider.dispose();
      disposable.dispose();
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  };

  const handleEditorDidMount = (editorInstance: any, monacoInstance: any) => {
    setEditor(editorInstance);
    setMonaco(monacoInstance);
    editorRef.current = editorInstance;

    // Define custom theme with AI indicators
    monacoInstance.editor.defineTheme('morpheusAITheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'ai-suggestion', foreground: '00D4FF', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#2F2F2F',
        'editor.selectionBackground': '#264F78',
        'editor.inactiveSelectionBackground': '#3A3D41',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#C6C6C6',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editor.selectionHighlightBackground': '#ADD6FF26',
        'editorWidget.background': '#1E1E1E',
        'editorSuggestWidget.background': '#1E1E1E',
        'editorHoverWidget.background': '#1E1E1E',
        'editorGutter.background': '#1E1E1E',
        'minimap.background': '#1E1E1E',
        // AI-specific colors
        'editorSuggestWidget.selectedBackground': '#0066CC',
        'editorHoverWidget.border': '#00D4FF'
      }
    });

    // Set editor options
    editorInstance.updateOptions({
      theme: 'morpheusAITheme',
      backgroundColor: '#1E1E1E'
    });

    // Add AI-specific keybindings
    editorInstance.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyK,
      () => {
        // Trigger AI suggestions
        if (file && currentPosition) {
          generateSuggestions(file, currentPosition);
          setShowSuggestions(true);
        }
      }
    );

    editorInstance.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyMod.Shift | monacoInstance.KeyCode.KeyK,
      () => {
        // Show context tooltip
        if (currentPosition) {
          const position = editorInstance.getPosition();
          const coords = editorInstance.getScrolledVisiblePosition(position);
          if (coords) {
            setTooltipPosition({ x: coords.left, y: coords.top });
            setShowContextTooltip(true);
          }
        }
      }
    );
  };

  const applySuggestion = (suggestion: CodeSuggestion) => {
    if (!editor || !file) return;

    const position = editor.getPosition();
    const range = new monaco.Range(
      suggestion.position.line,
      suggestion.position.column,
      position.lineNumber,
      position.column
    );

    editor.executeEdits('ai-suggestion', [{
      range,
      text: suggestion.content
    }]);

    setShowSuggestions(false);
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1E1E1E] text-gray-400">
        <div className="text-center">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a file to start editing</p>
          {isInitialized && (
            <p className="text-sm mt-2 text-blue-400">
              <Zap className="w-4 h-4 inline mr-1" />
              AI features enabled
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1E1E1E] relative">
      <MonacoEditor
        height="100%"
        width="100%"
        language={getFileLanguage(file.name)}
        value={file.content}
        theme="morpheusAITheme"
        onChange={(value) => onContentChange(file.id, value || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'on',
          roundedSelection: false,
          padding: { top: 16 },
          cursorStyle: 'line',
          wordWrap: 'on',
          tabSize: getFileLanguage(file.name) === 'python' ? 4 : 2,
          renderWhitespace: 'selection',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          formatOnPaste: false,
          formatOnType: false,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          guides: {
            bracketPairs: true,
            indentation: true
          },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showIcons: true,
            showStatusBar: true
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 12,
            horizontalScrollbarSize: 12
          },
          // AI-specific options
          lightbulb: { enabled: true },
          codeActionsOnSave: { 'source.fixAll': true }
        }}
        className="bg-[#1E1E1E]"
      />

      {/* AI Suggestions Panel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-4 right-4 w-80 bg-editor-sidebar border border-editor-border rounded-lg shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-editor-border">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-editor-text">AI Suggestions</span>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={suggestion.id} className="p-3 border-b border-editor-border last:border-b-0">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-editor-icon capitalize">{suggestion.type}</span>
                  <span className="text-xs text-blue-400">
                    {Math.round(suggestion.confidence * 100)}%
                  </span>
                </div>
                
                <pre className="text-xs text-editor-text bg-editor-background rounded p-2 mb-2 overflow-x-auto">
                  <code>{suggestion.content}</code>
                </pre>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                  <button className="text-xs text-editor-icon hover:text-editor-text">
                    Explain
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Tooltip */}
      {showContextTooltip && tooltipContent.length > 0 && (
        <div 
          className="absolute bg-editor-sidebar border border-editor-border rounded-lg shadow-xl z-50 w-72"
          style={{ 
            left: tooltipPosition.x, 
            top: tooltipPosition.y + 20,
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          <div className="flex items-center justify-between p-3 border-b border-editor-border">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-editor-text">Context</span>
            </div>
            <button
              onClick={() => setShowContextTooltip(false)}
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {tooltipContent.slice(0, 2).map((result, index) => (
            <div key={index} className="p-3 border-b border-editor-border last:border-b-0">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xs text-blue-400">{result.chunk.type}</span>
                <span className="text-xs text-editor-text">{result.chunk.metadata.name}</span>
              </div>
              
              <div className="text-xs text-editor-icon mb-2">
                {result.chunk.filePath}:{result.chunk.startLine}
              </div>
              
              <pre className="text-xs text-editor-text bg-editor-background rounded p-2 overflow-x-auto">
                <code>{result.chunk.content.slice(0, 150)}...</code>
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* AI Status Indicator */}
      {isInitialized && (
        <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-editor-sidebar border border-editor-border rounded-lg px-3 py-2">
          <Zap className="w-4 h-4 text-blue-400" />
          <span className="text-xs text-editor-text">AI Ready</span>
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
