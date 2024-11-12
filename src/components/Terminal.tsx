import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function Terminal({ isVisible, onClose }: TerminalProps) {
  const [terminalHeight, setTerminalHeight] = useState(200); // Changed from 300 to 200
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'Welcome to Morpheus IDE Terminal',
    'Type "help" for a list of available commands'
  ]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 150), window.innerHeight - 200);
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startHeight]);

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(terminalHeight);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      setCommandHistory([...commandHistory, `$ ${currentCommand}`, 'Command executed']);
      setCurrentCommand('');
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="bg-editor-bg border-t border-editor-border select-none"
      style={{ height: terminalHeight }}
    >
      <div 
        className="h-1 cursor-row-resize bg-editor-border hover:bg-editor-active transition-colors"
        onMouseDown={handleResizeStart}
      />
      <div className="flex items-center justify-between px-4 py-2 bg-editor-sidebar border-b border-editor-border">
        <div className="flex items-center">
          <TerminalIcon className="w-4 h-4 mr-2 text-editor-icon" />
          <span className="text-sm text-editor-text">Terminal</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-editor-icon hover:text-editor-text hover:bg-editor-active rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={terminalRef}
        className="h-[calc(100%-41px)] overflow-y-auto p-4 font-mono text-sm text-editor-text bg-black terminal-content"
      >
        <div className="space-y-1">
          {commandHistory.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
          <div className="flex items-center">
            <span className="text-green-400 mr-2">$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent outline-none text-editor-text"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </div>
  );
}