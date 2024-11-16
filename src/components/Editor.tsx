import { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { FileType } from '../types';
import { loader } from '@monaco-editor/react';
import { getFileLanguage } from '../utils/fileUtils';

// Configure Monaco Editor loader
loader.config({ monaco: undefined });

interface EditorProps {
  file: FileType | null;
  onContentChange: (fileId: string, content: string) => void;
}

export default function Editor({ file, onContentChange }: EditorProps) {
  const monacoRef = useRef(null);
  const [editorKey, setEditorKey] = useState(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        setEditorKey(prev => prev + 1);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;

    // Define custom theme
    monaco.editor.defineTheme('morpheusTheme', {
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
        { token: 'constant', foreground: '4FC1FF' }
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
        'editor.background.0': '#1E1E1E',
        'editor.background.1': '#1E1E1E',
        'editor.background.2': '#1E1E1E',
        'editorWidget.background': '#1E1E1E',
        'editorSuggestWidget.background': '#1E1E1E',
        'editorHoverWidget.background': '#1E1E1E',
        'editorGutter.background': '#1E1E1E',
        'minimap.background': '#1E1E1E'
      }
    });

    // Set editor options
    editor.updateOptions({
      theme: 'morpheusTheme',
      backgroundColor: '#1E1E1E'
    });

    // Configure Python specific settings
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => {
        const suggestions = [
          {
            label: 'def',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'def ${1:name}(${2:params}):\n\t${0:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Function definition'
          },
          {
            label: 'class',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'class ${1:name}:\n\tdef __init__(self):\n\t\t${0:pass}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Class definition'
          }
        ];
        return { suggestions };
      }
    });

    // Disable the default format on paste for better performance
    editor.getModel()?.updateOptions({ formatOnPaste: false });
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1E1E1E] text-gray-400">
        <p>Select a file to start editing</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#1E1E1E]">
      <MonacoEditor
        key={editorKey}
        height="100%"
        width="100%"
        language={getFileLanguage(file.name)}
        value={file.content}
        theme="morpheusTheme"
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
          bracketPairColorization: {
            enabled: true
          },
          formatOnPaste: false,
          formatOnType: false,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          guides: {
            bracketPairs: true,
            indentation: true
          },
          suggest: {
            snippetsPreventQuickSuggestions: false
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
          }
        }}
        className="bg-[#1E1E1E]"
      />
    </div>
  );
}