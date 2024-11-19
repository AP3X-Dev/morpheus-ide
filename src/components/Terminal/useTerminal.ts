import { useEffect, useRef, MutableRefObject } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { WebglAddon } from 'xterm-addon-webgl';

interface UseTerminalProps {
  isVisible: boolean;
  terminalRef: MutableRefObject<HTMLDivElement | null>;
  onResize?: () => void;
}

export function useTerminal({ isVisible, terminalRef, onResize }: UseTerminalProps) {
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

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
        convertEol: true,
        disableStdin: false,
        rows: 24,
        cols: 80
      });

      if (!isMounted) {
        term.dispose();
        return;
      }

      xtermRef.current = term;

      // Create and attach addons before opening terminal
      const fitAddon = new FitAddon();
      fitAddonRef.current = fitAddon;
      term.loadAddon(fitAddon);

      const webLinksAddon = new WebLinksAddon();
      term.loadAddon(webLinksAddon);

      // Open terminal in the container
      if (terminalRef.current) {
        term.open(terminalRef.current);

        // Set up ResizeObserver after terminal is opened
        const resizeObserver = new ResizeObserver(() => {
          if (fitAddonRef.current && xtermRef.current) {
            requestAnimationFrame(() => {
              if (fitAddonRef.current) {
                try {
                  fitAddonRef.current.fit();
                  onResize?.();
                } catch (e) {
                  console.warn('Error fitting terminal:', e);
                }
              }
            });
          }
        });

        resizeObserver.observe(terminalRef.current);
        resizeObserverRef.current = resizeObserver;
      }

      // Initialize WebGL after terminal is opened
      try {
        const webglAddon = new WebglAddon();
        webglAddonRef.current = webglAddon;
        term.loadAddon(webglAddon);

        webglAddon.onContextLoss(() => {
          if (webglAddonRef.current === webglAddon) {
            webglAddon.dispose();
            webglAddonRef.current = null;
          }
        });
      } catch (e) {
        console.warn('WebGL addon could not be loaded:', e);
      }

      // Ensure terminal is properly sized
      await new Promise(resolve => setTimeout(resolve, 50));
      if (isMounted && fitAddon) {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Error during initial fit:', e);
        }
      }

      // Write welcome message
      term.writeln('\x1b[1;32mWelcome to Morpheus IDE Terminal\x1b[0m');
      term.writeln('Type "help" for available commands');
      term.write('\r\n$ ');

      return term;
    };

    initializeTerminal();

    return () => {
      isMounted = false;
      
      // Clean up ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      // Cleanup in reverse order of initialization
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
  }, [isVisible, terminalRef, onResize]);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        requestAnimationFrame(() => {
          if (fitAddonRef.current) {
            try {
              fitAddonRef.current.fit();
              onResize?.();
            } catch (e) {
              console.warn('Error during window resize:', e);
            }
          }
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [onResize]);

  return {
    terminal: xtermRef.current,
    fitAddon: fitAddonRef.current
  };
}