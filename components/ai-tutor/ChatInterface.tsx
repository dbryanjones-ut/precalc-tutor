"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Copy, Check, Trash2, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathRenderer } from "@/components/math/MathRenderer";
import { useAITutorStore } from "@/stores/useAITutorStore";
import type { ChatMessage, Citation } from "@/types";
import { toast } from "sonner";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentSession, isLoading, sendMessage, endSession } = useAITutorStore();

  const messages = currentSession?.messages || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentSession) return;

    const message = input.trim();
    setInput("");

    try {
      await sendMessage(message);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const handleClearConversation = () => {
    if (window.confirm("Are you sure you want to clear this conversation?")) {
      endSession();
      toast.success("Conversation cleared");
    }
  };

  const renderCitation = (citation: Citation, index: number) => {
    const typeColors = {
      notation: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      "golden-word": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      "common-mistake": "bg-red-500/10 text-red-500 border-red-500/20",
      reference: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    };

    return (
      <div
        key={index}
        className={`p-3 rounded-lg border text-xs ${typeColors[citation.type] || "bg-muted border-border"}`}
      >
        <div className="font-semibold mb-1">{citation.title}</div>
        <div className="text-muted-foreground">{citation.content}</div>
        {citation.link && (
          <a
            href={citation.link}
            className="text-primary hover:underline mt-1 inline-block"
          >
            Learn more →
          </a>
        )}
      </div>
    );
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === "user";
    const messageId = `${message.timestamp}-${index}`;

    return (
      <div
        key={index}
        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-300`}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
        )}

        <div className={`flex-1 max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
          {/* Message Content */}
          <div
            className={`
              rounded-2xl px-4 py-3
              ${
                isUser
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-card border border-border"
              }
            `}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {(message.content || "").split("\n").map((line, i) => {
                // Check if line contains math delimiters
                const mathMatch = line.match(/\$(.*?)\$/g);
                if (mathMatch) {
                  return (
                    <div key={i} className="my-2">
                      {line.split(/(\$.*?\$)/g).map((part, j) => {
                        if (part.startsWith("$") && part.endsWith("$")) {
                          const latex = part.slice(1, -1);
                          return <MathRenderer key={j} latex={latex} />;
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </div>
                  );
                }
                return line ? <p key={i}>{line}</p> : <br key={i} />;
              })}
            </div>

            {/* LaTeX expressions */}
            {message.latex && Array.isArray(message.latex) && message.latex.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.latex.map((latex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/50">
                    <MathRenderer latex={latex} displayMode={true} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="space-y-2 px-1">
              {message.citations.map((citation, i) => renderCitation(citation, i))}
            </div>
          )}

          {/* Message Actions */}
          {!isUser && (
            <div className="flex items-center gap-2 px-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(message.content, messageId)}
                className="h-7 text-xs"
              >
                {copiedMessageId === messageId ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-5 h-5 text-secondary-foreground" />
          </div>
        )}
      </div>
    );
  };

  if (!currentSession) {
    return (
      <Card className={`${className} flex items-center justify-center min-h-[400px]`}>
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Active Session</p>
          <p className="text-sm">Upload a problem to start tutoring</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">AI Tutor Chat</h3>
          <span className="text-xs text-muted-foreground">
            ({currentSession.mode === "socratic" ? "Socratic" : "Explanation"} mode)
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearConversation}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-3 max-w-md">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Ready to help you learn!</h4>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about the problem you've uploaded. I'll guide you through the
                  solution step by step.
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Try asking:</p>
                <ul className="space-y-1">
                  <li>"Where should I start?"</li>
                  <li>"What formula applies here?"</li>
                  <li>"Can you give me a hint?"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 max-w-[80%]">
              <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border flex-shrink-0 bg-background">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 min-h-[44px] max-h-[88px] px-4 py-3 rounded-lg bg-background border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring overflow-y-auto"
            disabled={isLoading}
            aria-label="Chat message input"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[44px] w-[44px] flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{messages.length} messages</span>
        </div>
      </div>
    </Card>
  );
}
