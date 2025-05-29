import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  FileCode,
  Sparkles
} from 'lucide-react';
import { useContextEngineStore } from '../../stores/contextEngineStore';
import { ChatMessage } from '../../types/contextEngine';

export default function ChatTab() {
  const {
    activeChatSession,
    currentProject,
    startChatSession,
    sendMessage
  } = useContextEngineStore();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatSession?.messages]);

  useEffect(() => {
    // Start a chat session if none exists and we have a project
    if (!activeChatSession && currentProject) {
      startChatSession(currentProject.id);
    }
  }, [activeChatSession, currentProject, startChatSession]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChatSession || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    try {
      await sendMessage(activeChatSession.id, message);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatMessage = (content: string) => {
    // Simple markdown-like formatting
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        return null; // Handle in a more sophisticated way
      }
      
      // Inline code
      const codeRegex = /`([^`]+)`/g;
      const parts = line.split(codeRegex);
      
      return (
        <div key={index} className="mb-1">
          {parts.map((part, partIndex) => {
            if (partIndex % 2 === 1) {
              // This is code
              return (
                <code key={partIndex} className="bg-editor-background px-1 py-0.5 rounded text-sm font-mono">
                  {part}
                </code>
              );
            }
            return part;
          })}
        </div>
      );
    });
  };

  const suggestedQuestions = [
    "How does authentication work in this project?",
    "Show me error handling patterns",
    "What are the main components?",
    "Explain the data flow",
    "Find security vulnerabilities",
    "Suggest performance improvements"
  ];

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-editor-icon mx-auto mb-4" />
          <h3 className="text-lg font-medium text-editor-text mb-2">No Project Loaded</h3>
          <p className="text-sm text-editor-icon">
            Load a project to start chatting with AI about your code.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-editor-border">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-editor-text">AI Assistant</h3>
            <p className="text-xs text-editor-icon">Ask questions about your code</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeChatSession?.messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h4 className="text-sm font-medium text-editor-text mb-2">Start a conversation</h4>
            <p className="text-xs text-editor-icon mb-4">
              Ask me anything about your codebase. I can help with:
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
              {suggestedQuestions.slice(0, 3).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs text-left p-2 bg-editor-background hover:bg-editor-hover rounded border border-editor-border transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeChatSession?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onCopy={copyToClipboard}
          />
        ))}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-editor-background rounded-lg p-3 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-editor-icon rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-editor-icon rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-editor-icon rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-editor-border">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your code..."
              rows={1}
              className="w-full p-3 pr-12 bg-editor-background border border-editor-border rounded-lg text-editor-text placeholder-editor-icon resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggested Questions */}
        {activeChatSession?.messages.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedQuestions.slice(3).map((question, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(question)}
                className="text-xs px-2 py-1 bg-editor-background hover:bg-editor-hover border border-editor-border rounded text-editor-text transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  onCopy 
}: { 
  message: ChatMessage; 
  onCopy: (text: string) => void;
}) {
  const isUser = message.role === 'user';
  const [showActions, setShowActions] = useState(false);

  return (
    <div 
      className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-green-600' : 'bg-blue-600'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-xs lg:max-w-sm ${isUser ? 'text-right' : ''}`}>
        <div className={`rounded-lg p-3 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-editor-background text-editor-text border border-editor-border'
        }`}>
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Context References */}
          {message.context && message.context.length > 0 && (
            <div className="mt-2 pt-2 border-t border-editor-border">
              <div className="text-xs text-editor-icon mb-1">Referenced code:</div>
              {message.context.slice(0, 2).map((ctx, index) => (
                <div key={index} className="text-xs bg-editor-sidebar rounded p-1 mb-1">
                  <FileCode className="w-3 h-3 inline mr-1" />
                  {ctx.chunk.filePath}:{ctx.chunk.startLine}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-editor-icon mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>

        {/* Actions */}
        {showActions && !isUser && (
          <div className="flex items-center space-x-2 mt-2">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
              title="Good response"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
              title="Poor response"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
            <button
              className="p-1 text-editor-icon hover:text-editor-text rounded transition-colors"
              title="Regenerate"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
