import Parser from 'web-tree-sitter';
import { CodeChunk } from '../types/contextEngine';
import { FileType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class CodeParserService {
  private parser: Parser | null = null;
  private languages: Map<string, Parser.Language> = new Map();
  private isInitialized = false;

  /**
   * Initialize the parser with Tree-sitter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Parser.init();
      this.parser = new Parser();

      // Load language grammars
      await this.loadLanguages();
      
      this.isInitialized = true;
      console.log('Code parser initialized successfully');
    } catch (error) {
      console.error('Failed to initialize code parser:', error);
      throw error;
    }
  }

  /**
   * Load Tree-sitter language grammars
   */
  private async loadLanguages(): Promise<void> {
    try {
      // Note: In a real implementation, you would load the actual WASM files
      // For now, we'll simulate the language loading
      const languageConfigs = [
        { name: 'javascript', file: 'tree-sitter-javascript.wasm' },
        { name: 'typescript', file: 'tree-sitter-typescript.wasm' },
        { name: 'python', file: 'tree-sitter-python.wasm' },
        { name: 'java', file: 'tree-sitter-java.wasm' },
        { name: 'cpp', file: 'tree-sitter-cpp.wasm' },
        { name: 'rust', file: 'tree-sitter-rust.wasm' },
        { name: 'go', file: 'tree-sitter-go.wasm' }
      ];

      // In a real implementation, you would load these from CDN or local files
      // For now, we'll just mark them as available
      console.log('Language grammars would be loaded here:', languageConfigs);
      
    } catch (error) {
      console.error('Failed to load language grammars:', error);
    }
  }

  /**
   * Parse a file into semantic chunks
   */
  async parseFile(file: FileType): Promise<CodeChunk[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const chunks: CodeChunk[] = [];
      const language = this.normalizeLanguage(file.language);
      
      // For now, implement a simple line-based chunking strategy
      // In a real implementation, this would use Tree-sitter's AST
      const lines = file.content.split('\n');
      let currentChunk = '';
      let startLine = 1;
      let chunkType: CodeChunk['type'] = 'block';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Detect chunk boundaries based on language patterns
        const isChunkBoundary = this.isChunkBoundary(line, language);
        const detectedType = this.detectChunkType(line, language);

        if (isChunkBoundary && currentChunk.trim()) {
          // Create chunk from accumulated content
          chunks.push(this.createChunk(
            file.name,
            currentChunk.trim(),
            startLine,
            lineNumber - 1,
            language,
            chunkType
          ));

          // Start new chunk
          currentChunk = line;
          startLine = lineNumber;
          chunkType = detectedType;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + line;
          
          // Update chunk type if we detect a more specific type
          if (detectedType !== 'block') {
            chunkType = detectedType;
          }
        }
      }

      // Add final chunk
      if (currentChunk.trim()) {
        chunks.push(this.createChunk(
          file.name,
          currentChunk.trim(),
          startLine,
          lines.length,
          language,
          chunkType
        ));
      }

      return chunks;

    } catch (error) {
      console.error('Failed to parse file:', file.name, error);
      return [];
    }
  }

  /**
   * Create a code chunk with metadata
   */
  private createChunk(
    filePath: string,
    content: string,
    startLine: number,
    endLine: number,
    language: string,
    type: CodeChunk['type']
  ): CodeChunk {
    const metadata = this.extractMetadata(content, language, type);

    return {
      id: uuidv4(),
      content,
      filePath,
      startLine,
      endLine,
      language,
      type,
      metadata
    };
  }

  /**
   * Extract metadata from code content
   */
  private extractMetadata(
    content: string, 
    language: string, 
    type: CodeChunk['type']
  ): CodeChunk['metadata'] {
    const metadata: CodeChunk['metadata'] = {};

    try {
      switch (type) {
        case 'function':
          metadata.name = this.extractFunctionName(content, language);
          metadata.signature = this.extractFunctionSignature(content, language);
          metadata.docstring = this.extractDocstring(content, language);
          break;
          
        case 'class':
          metadata.name = this.extractClassName(content, language);
          metadata.docstring = this.extractDocstring(content, language);
          break;
          
        case 'interface':
          metadata.name = this.extractInterfaceName(content, language);
          break;
          
        case 'variable':
          metadata.name = this.extractVariableName(content, language);
          break;
          
        case 'import':
          metadata.dependencies = this.extractImports(content, language);
          break;
      }

      // Calculate complexity score
      metadata.complexity = this.calculateComplexity(content, language);

    } catch (error) {
      console.error('Failed to extract metadata:', error);
    }

    return metadata;
  }

  /**
   * Detect if a line represents a chunk boundary
   */
  private isChunkBoundary(line: string, language: string): boolean {
    const trimmed = line.trim();
    
    // Common patterns that indicate new chunks
    const patterns = {
      javascript: [
        /^(function|const|let|var|class|interface|export|import)/,
        /^\/\*\*/, // JSDoc comments
        /^\/\/ ===/ // Section comments
      ],
      typescript: [
        /^(function|const|let|var|class|interface|type|export|import)/,
        /^\/\*\*/, // TSDoc comments
        /^\/\/ ===/ // Section comments
      ],
      python: [
        /^(def|class|import|from|@)/,
        /^"""/, // Docstrings
        /^# ===/ // Section comments
      ]
    };

    const langPatterns = patterns[language as keyof typeof patterns] || patterns.javascript;
    return langPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Detect the type of code chunk
   */
  private detectChunkType(line: string, language: string): CodeChunk['type'] {
    const trimmed = line.trim();

    // Function patterns
    if (/^(function|def|fn)\s+/.test(trimmed)) return 'function';
    if (/^(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/.test(trimmed)) return 'function';

    // Class patterns
    if (/^class\s+/.test(trimmed)) return 'class';

    // Interface patterns
    if (/^interface\s+/.test(trimmed)) return 'interface';
    if (/^type\s+/.test(trimmed)) return 'interface';

    // Import patterns
    if (/^(import|from|require)/.test(trimmed)) return 'import';

    // Variable patterns
    if (/^(const|let|var|val)\s+/.test(trimmed)) return 'variable';

    // Comment patterns
    if (/^(\/\/|\/\*|\*|#|"""|''')/.test(trimmed)) return 'comment';

    return 'block';
  }

  /**
   * Extract function name from code
   */
  private extractFunctionName(content: string, language: string): string | undefined {
    const patterns = {
      javascript: [
        /function\s+(\w+)/,
        /(?:const|let|var)\s+(\w+)\s*=/,
        /(\w+)\s*[:=]\s*(?:async\s+)?(?:function|\()/
      ],
      python: [
        /def\s+(\w+)/
      ]
    };

    const langPatterns = patterns[language as keyof typeof patterns] || patterns.javascript;
    
    for (const pattern of langPatterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Extract function signature
   */
  private extractFunctionSignature(content: string, language: string): string | undefined {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (firstLine && (firstLine.includes('function') || firstLine.includes('def'))) {
      return firstLine;
    }

    return undefined;
  }

  /**
   * Extract class name from code
   */
  private extractClassName(content: string, language: string): string | undefined {
    const match = content.match(/class\s+(\w+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract interface name from code
   */
  private extractInterfaceName(content: string, language: string): string | undefined {
    const match = content.match(/(?:interface|type)\s+(\w+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract variable name from code
   */
  private extractVariableName(content: string, language: string): string | undefined {
    const match = content.match(/(?:const|let|var|val)\s+(\w+)/);
    return match ? match[1] : undefined;
  }

  /**
   * Extract docstring/comments
   */
  private extractDocstring(content: string, language: string): string | undefined {
    const lines = content.split('\n');
    const docLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('/**') || trimmed.startsWith('"""') || trimmed.startsWith('///')) {
        docLines.push(trimmed);
      } else if (trimmed.startsWith('*') || trimmed.startsWith('#')) {
        docLines.push(trimmed);
      } else if (docLines.length > 0) {
        break; // End of docstring
      }
    }

    return docLines.length > 0 ? docLines.join('\n') : undefined;
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import') || trimmed.startsWith('from') || trimmed.startsWith('require')) {
        imports.push(trimmed);
      }
    }

    return imports;
  }

  /**
   * Calculate code complexity score
   */
  private calculateComplexity(content: string, language: string): number {
    let complexity = 1; // Base complexity

    // Count control flow statements
    const controlFlowPatterns = [
      /\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g,
      /\bswitch\b/g, /\bcase\b/g, /\btry\b/g, /\bcatch\b/g,
      /\b&&\b/g, /\b\|\|\b/g, /\?\s*:/g
    ];

    for (const pattern of controlFlowPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Normalize language name
   */
  private normalizeLanguage(language: string): string {
    const mapping: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'python': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'cpp',
      'rust': 'rust',
      'go': 'go'
    };

    return mapping[language.toLowerCase()] || 'javascript';
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return Array.from(this.languages.keys());
  }

  /**
   * Check if parser is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const codeParserService = new CodeParserService();
