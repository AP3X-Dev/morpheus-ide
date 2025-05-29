import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function Terminal({ isVisible, onClose }: TerminalProps) {
  const [terminalHeight, setTerminalHeight] = React.useState(300);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [startHeight, setStartHeight] = React.useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);

  useEffect(() => {
    if (!isVisible || !terminalRef.current) return;

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
      tabStopWidth: 4
    });

    // Store reference
    xtermRef.current = term;

    // Create and attach addons
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(webLinksAddon);

    // Open terminal in the container
    term.open(terminalRef.current);

    // Initialize WebGL after terminal is opened
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
      });
      term.loadAddon(webglAddon);
      webglAddonRef.current = webglAddon;
    } catch (e) {
      console.warn('WebGL addon could not be loaded', e);
    }

    // Initial fit
    fitAddon.fit();

    // Write welcome message
    term.writeln('\x1b[1;32mWelcome to Morpheus IDE Terminal\x1b[0m');
    term.writeln('Type "help" for available commands');
    term.write('\r\n$ ');

    // Handle input
    const keyHandler = ({ key, domEvent }: { key: string, domEvent: KeyboardEvent }) => {
      const ev = domEvent;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

      if (ev.keyCode === 13) { // Enter
        const currentLine = term.buffer.active.getLine(term.buffer.active.cursorY)?.translateToString();
        const command = currentLine?.substring(2).trim();

        if (command) {
          handleCommand(command, term);
        }

        term.write('\r\n$ ');
      } else if (ev.keyCode === 8) { // Backspace
        const currentLine = term.buffer.active.getLine(term.buffer.active.cursorY)?.translateToString();
        if (currentLine && currentLine.length > 2) {
          term.write('\b \b');
        }
      } else if (printable) {
        term.write(key);
      }
    };

    term.onKey(keyHandler);

    // Cleanup
    return () => {
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

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCommand = (command: string, term: XTerm) => {
    const commands: { [key: string]: () => void } = {
      help: () => {
        term.writeln('\r\nAvailable commands:');
        term.writeln('  help     - Show this help message');
        term.writeln('  clear    - Clear the terminal');
        term.writeln('  version  - Show terminal version');
        term.writeln('  echo     - Echo a message');
      },
      clear: () => {
        term.clear();
      },
      version: () => {
        term.writeln('\r\nMorpheus IDE Terminal v1.0.0');
      },
      echo: () => {
        const message = command.substring(5);
        if (message) {
          term.writeln(`\r\n${message}`);
        }
      }
    };

    const cmd = command.split(' ')[0];
    if (commands[cmd]) {
      commands[cmd]();
    } else {
      term.writeln(`\r\nCommand not found: ${cmd}`);
      term.writeln('Type "help" for available commands');
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

      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
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
      className="glass border-t border-white/20 select-none backdrop-blur-sm"
      style={{ height: terminalHeight }}
    >
      {/* Modern Resize Handle */}
      <div
        className="h-1 cursor-row-resize bg-gradient-to-r from-blue-500/50 to-purple-500/50 hover:from-blue-500 hover:to-purple-500 transition-all duration-200"
        onMouseDown={handleResizeStart}
      />

      {/* Enhanced Terminal Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-900/80 to-slate-800/60 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <TerminalIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">Terminal</span>
            <div className="text-xs text-gray-400">Interactive Shell</div>
          </div>
        </div>

        {/* Terminal Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="w-px h-4 bg-white/20 mx-2"></div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105"
            title="Close Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content with Enhanced Styling */}
      <div className="relative h-[calc(100%-57px)] bg-gradient-to-br from-black/90 to-slate-900/80">
        <div
          ref={terminalRef}
          className="absolute inset-0 p-2"
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Terminal Overlay Effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    </div>
  );
}