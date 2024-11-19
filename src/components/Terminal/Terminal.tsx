import React, { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { WebglAddon } from 'xterm-addon-webgl';
import { useTerminalCommands } from './useTerminalCommands';
import 'xterm/css/xterm.css';

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function Terminal({ isVisible, onClose }: TerminalProps) {
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const { executeCommand } = useTerminalCommands();

  useEffect(() => {
    if (!isVisible || !terminalRef.current) return;

    let isMounted = true;

    const initializeTerminal = async () => {
      // Initialize XTerm
      const term = new XTerm({
        theme: {
          background: '#000000',
          foreground: '#ffffff',
          cursor: '#ffffff',
          cursorAccent: '#000000',
          selection: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#d19a66',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#abb2bf',
          brightBlack: '#5c6370',
          brightRed: '#e06c75',
          brightGreen: '#98c379',
          brightYellow: '#d19a66',
          brightBlue: '#61afef',
          brightMagenta: '#c678dd',
          brightCyan: '#56b6c2',
          brightWhite: '#ffffff'
        },
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        allowTransparency: true,
        scrollback: 10000,
        tabStopWidth: 4,
        rows: 24,
        cols: 80,
        windowOptions: {
          setWinSizeChars: true
        }
      });

      // Store reference
      xtermRef.current = term;

      // Create and attach addons
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);

      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(webLinksAddon);

      // Open terminal in the container
      term.open(terminalRef.current);

      // Initialize WebGL after terminal is opened
      try {
        const webglAddon = new WebglAddon();
        webglAddonRef.current = webglAddon;
        term.loadAddon(webglAddon);

        webglAddon.onContextLoss(() => {
          webglAddon.dispose();
        });
      } catch (e) {
        console.warn('WebGL addon could not be loaded:', e);
      }

      // Set up ResizeObserver
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddonRef.current && isMounted) {
          requestAnimationFrame(() => {
            try {
              fitAddonRef.current?.fit();
            } catch (e) {
              console.warn('Error fitting terminal:', e);
            }
          });
        }
      });

      resizeObserverRef.current = resizeObserver;
      resizeObserver.observe(terminalRef.current);

      // Initial fit after a short delay
      setTimeout(() => {
        if (isMounted && fitAddonRef.current) {
          try {
            fitAddonRef.current.fit();
          } catch (e) {
            console.warn('Error during initial fit:', e);
          }
        }
      }, 100);

      // Write welcome message
      term.writeln('\x1b[1;32mWelcome to Morpheus IDE Terminal\x1b[0m');
      term.writeln('Type "help" for available commands');
      term.write('\r\n$ ');

      let currentLine = '';
      let currentPosition = 0;

      // Handle input
      term.onKey(({ key, domEvent }) => {
        const ev = domEvent;
        const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

        if (ev.keyCode === 13) { // Enter
          term.write('\r\n');
          if (currentLine.trim()) {
            handleCommand(currentLine.trim(), term);
          }
          currentLine = '';
          currentPosition = 0;
          term.write('$ ');
        } else if (ev.keyCode === 8) { // Backspace
          if (currentPosition > 0) {
            currentLine = currentLine.slice(0, -1);
            currentPosition--;
            term.write('\b \b');
          }
        } else if (printable) {
          currentLine += key;
          currentPosition++;
          term.write(key);
        }
      });
    };

    initializeTerminal();

    return () => {
      isMounted = false;

      // Clean up in reverse order
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (webglAddonRef.current) {
        webglAddonRef.current.dispose();
        webglAddonRef.current = null;
      }

      if (fitAddonRef.current) {
        fitAddonRef.current.dispose();
        fitAddonRef.current = null;
      }

      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, [isVisible]);

  const handleCommand = async (command: string, term: XTerm) => {
    const builtInCommands: { [key: string]: () => void } = {
      help: () => {
        term.writeln('\r\nAvailable commands:');
        term.writeln('  help     - Show this help message');
        term.writeln('  clear    - Clear the terminal');
        term.writeln('  version  - Show terminal version');
        term.writeln('  pwd      - Show current working directory');
        term.writeln('  ls       - List directory contents');
        term.writeln('  cd       - Change directory');
        term.writeln('  npm      - Run npm commands');
        term.writeln('  node     - Run Node.js commands');
      },
      clear: () => {
        term.clear();
      },
      version: () => {
        term.writeln('\r\nMorpheus IDE Terminal v1.0.0');
      }
    };

    const cmd = command.split(' ')[0];
    if (builtInCommands[cmd]) {
      builtInCommands[cmd]();
    } else {
      try {
        const { output, error } = await executeCommand(command);
        if (output) {
          term.writeln(output);
        }
        if (error) {
          term.writeln(`\r\n\x1b[31m${error}\x1b[0m`);
        }
      } catch (error) {
        term.writeln(`\r\n\x1b[31mError: ${error instanceof Error ? error.message : String(error)}\x1b[0m`);
      }
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(terminalHeight);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaY = startY - e.clientY;
      const newHeight = Math.min(Math.max(startHeight + deltaY, 150), window.innerHeight - 200);
      setTerminalHeight(newHeight);
      
      if (fitAddonRef.current) {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current?.fit();
          } catch (e) {
            console.warn('Error during resize:', e);
          }
        });
      }
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
        className="h-[calc(100%-41px)] w-full"
        style={{ backgroundColor: '#000000' }}
      />
    </div>
  );
}