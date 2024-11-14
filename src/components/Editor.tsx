// File: components/Editor.tsx

import { useEffect, useRef, useState } from 'react';
import MonacoEditor, { loader } from '@monaco-editor/react';
import { FileType } from '../types';
import { getFileLanguage } from '../utils/fileUtils';

// Configure Monaco Editor loader
loader.config({ monaco: undefined });

interface EditorProps {
  file: FileType | null;
  theme?: string;
  onContentChange: (fileId: string, content: string) => void;
}

export default function Editor({
  file,
  theme = 'vs-dark',
  onContentChange,
}: EditorProps) {
  const monacoRef = useRef(null);
  const [editorKey, setEditorKey] = useState(0);
  const resizeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = window.setTimeout(() => {
        setEditorKey((prev) => prev + 1);
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

    // Disable the default format on paste for better performance
    editor.getModel()?.updateOptions({ formatOnPaste: false });
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 text-gray-400">
        <p>Select a file to start editing</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900">
      <MonacoEditor
        key={editorKey}
        height="100%"
        language={getFileLanguage(file.name)}
        value={file.content}
        theme={theme}
        onChange={(value) => {
          onContentChange(file.id, value || '');
        }}
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
            enabled: true,
          },
          formatOnPaste: false,
          formatOnType: false,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            snippetsPreventQuickSuggestions: false,
          },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true,
          },
        }}
      />
    </div>
  );
}
