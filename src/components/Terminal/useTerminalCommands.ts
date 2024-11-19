import { useCallback } from 'react';

interface CommandOutput {
  output: string;
  error?: string;
}

export function useTerminalCommands() {
  const executeCommand = useCallback(async (command: string): Promise<CommandOutput> => {
    try {
      const [cmd, ...args] = command.split(' ');
      const process = await window.webcontainer.spawn(cmd, args);
      
      let output = '';
      let error = '';

      // Handle stdout
      process.output.pipeTo(new WritableStream({
        write(data) {
          output += data;
        }
      }));

      // Handle stderr
      process.stderr.pipeTo(new WritableStream({
        write(data) {
          error += data;
        }
      }));

      const exitCode = await process.exit;
      
      return {
        output: output + (error ? `\r\nError: ${error}` : ''),
        ...(exitCode !== 0 && { error: `Command failed with exit code ${exitCode}` })
      };
    } catch (error) {
      console.error('Command execution error:', error);
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }, []);

  return { executeCommand };
}