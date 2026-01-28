"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Copy, Check, Trash2, User, Bot, Sparkles, Lightbulb, ListOrdered, BookOpen, Zap, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MathRenderer } from "@/components/math/MathRenderer";
import { AIThinkingLoader } from "@/components/ui/loading-message";
import { EmptyState } from "@/components/ui/empty-state";
import { useAITutorStore } from "@/stores/useAITutorStore";
import type { ChatMessage, Citation, TutoringMode } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentSession, isLoading, sendMessage, endSession, mode, setMode } = useAITutorStore();

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
      toast.success("Message sent!", {
        duration: 1500,
        icon: "✓",
      });
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

  const handleQuickAction = async (prompt: string) => {
    if (!currentSession) {
      toast.error("Please start a session first");
      return;
    }

    try {
      await sendMessage(prompt);
    } catch (error) {
      toast.error("Failed to send quick action");
    }
  };

  const handleModeChange = (newMode: TutoringMode) => {
    setMode(newMode);
    toast.success(`Switched to ${newMode === "socratic" ? "Socratic" : "Explanation"} mode`, {
      duration: 2000,
    });
  };

  // Quick action definitions based on mode
  const socraticActions = [
    {
      icon: Lightbulb,
      label: "Give me a hint",
      prompt: "Can you give me a hint to help me get started?",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10 hover:bg-yellow-500/20",
      borderColor: "border-yellow-500/20",
    },
    {
      icon: ListOrdered,
      label: "What's the first step?",
      prompt: "What should be the first step to solve this problem?",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
      borderColor: "border-blue-500/20",
    },
    {
      icon: BookOpen,
      label: "Explain this term",
      prompt: "Can you explain any mathematical terms or concepts I need to understand?",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 hover:bg-purple-500/20",
      borderColor: "border-purple-500/20",
    },
    {
      icon: Zap,
      label: "Common mistakes",
      prompt: "What are common mistakes students make with this type of problem?",
      color: "text-red-500",
      bgColor: "bg-red-500/10 hover:bg-red-500/20",
      borderColor: "border-red-500/20",
    },
  ];

  const explanationActions = [
    {
      icon: ListOrdered,
      label: "Show steps",
      prompt: "Please show me the complete step-by-step solution.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
      borderColor: "border-blue-500/20",
    },
    {
      icon: Eye,
      label: "Show step 1",
      prompt: "Show me just the first step of the solution.",
      color: "text-green-500",
      bgColor: "bg-green-500/10 hover:bg-green-500/20",
      borderColor: "border-green-500/20",
    },
    {
      icon: BookOpen,
      label: "Explain concept",
      prompt: "Explain the key mathematical concepts needed for this problem.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 hover:bg-purple-500/20",
      borderColor: "border-purple-500/20",
    },
    {
      icon: Zap,
      label: "Similar example",
      prompt: "Can you show me a similar example problem?",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10 hover:bg-orange-500/20",
      borderColor: "border-orange-500/20",
    },
  ];

  const quickActions = mode === "socratic" ? socraticActions : explanationActions;

  const renderCitation = (citation: Citation, index: number) => {
    const typeColors = {
      notation: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      "golden-word": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      "common-mistake": "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      reference: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    };

    return (
      <div
        key={index}
        className={cn(
          "p-4 rounded-xl border animate-in slide-in-from-bottom-4 duration-300 hover-lift",
          typeColors[citation.type] || "bg-muted border-border"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="font-semibold mb-2 text-sm">{citation.title}</div>
        <div className="text-sm opacity-90">{citation.content}</div>
        {citation.link && (
          <a
            href={citation.link}
            className="text-sm font-medium hover:underline mt-2 inline-block"
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
        className={cn(
          "flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300",
          isUser ? "justify-end" : "justify-start"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {!isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-in zoom-in-95 duration-300" role="img" aria-label="AI Tutor">
            <Bot className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
        )}

        <div className={cn("flex-1 max-w-[85%] space-y-3", isUser ? "items-end" : "items-start")}>
          {/* Message Content */}
          <div
            className={cn(
              "rounded-2xl px-5 py-4 hover-lift",
              isUser
                ? "bg-primary text-primary-foreground ml-auto shadow-md"
                : "bg-card border-2 border-border shadow-sm"
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {(message.content || "").split("\n").map((line, i) => {
                // Check if line contains math delimiters
                const mathMatch = line.match(/\$(.*?)\$/g);
                if (mathMatch) {
                  return (
                    <div key={i} className="my-2 whitespace-pre-wrap">
                      {line.split(/(\$.*?\$)/g).map((part, j) => {
                        if (part.startsWith("$") && part.endsWith("$")) {
                          const latex = part.slice(1, -1);
                          return <MathRenderer key={j} latex={latex} />;
                        }
                        return <span key={j} className="whitespace-pre-wrap">{part}</span>;
                      })}
                    </div>
                  );
                }
                return line ? <p key={i} className="leading-relaxed whitespace-pre-wrap">{line}</p> : <br key={i} />;
              })}
            </div>

            {/* LaTeX expressions */}
            {message.latex && Array.isArray(message.latex) && message.latex.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.latex.map((latex, i) => (
                  <div key={i} className="p-4 rounded-xl bg-background/50 border border-border/50 animate-in zoom-in-95 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
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
            <div className="flex items-center gap-3 px-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(message.content, messageId)}
                className="h-9 text-xs hover:bg-primary/10 min-h-[36px] btn-press"
                aria-label={copiedMessageId === messageId ? "Message copied to clipboard" : "Copy message to clipboard"}
              >
                {copiedMessageId === messageId ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5 animate-pop-in" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                    Copy
                  </>
                )}
              </Button>
              <time className="text-xs text-muted-foreground" dateTime={message.timestamp}>
                {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-in zoom-in-95 duration-300" role="img" aria-label="You">
            <User className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>
        )}
      </div>
    );
  };

  if (!currentSession) {
    return (
      <Card className={cn(className, "flex items-center justify-center min-h-[500px] border-2")}>
        <EmptyState
          icon={Bot}
          title="No Active Session"
          description="Upload a problem or ask a question to start your AI tutoring session"
          tip="You can upload images of problems or type them out directly!"
        />
      </Card>
    );
  }

  return (
    <Card className={cn(className, "flex flex-col border-2 shadow-lg animate-in fade-in duration-500")}>
      {/* Header with Mode Toggle */}
      <div className="flex flex-col gap-3 p-5 border-b-2 border-border flex-shrink-0 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" aria-hidden="true" />
              <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <h2 className="font-semibold text-base">AI Tutor Chat</h2>
              <span className="text-xs text-muted-foreground">
                {messages.length > 0 && `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearConversation}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] btn-press"
            aria-label="Clear conversation"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        </div>

        {/* Inline Mode Toggle */}
        <div className="flex items-center justify-between gap-3 p-1 bg-background/60 rounded-lg border border-border/50">
          <span className="text-xs font-medium text-muted-foreground pl-2 hidden sm:inline">Mode:</span>
          <div className="flex gap-1 flex-1">
            <button
              type="button"
              onClick={() => handleModeChange("socratic")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[40px]",
                mode === "socratic"
                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-2 border-blue-500/30 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 border-2 border-transparent"
              )}
              aria-label="Socratic mode"
              aria-pressed={mode === "socratic"}
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Socratic</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("explanation")}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[40px]",
                mode === "explanation"
                  ? "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-2 border-purple-500/30 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 border-2 border-transparent"
              )}
              aria-label="Explanation mode"
              aria-pressed={mode === "explanation"}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Explanation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-6 min-h-[500px] max-h-[650px] bg-muted/10"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-5 max-w-lg animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto animate-bounce-scale">
                <Bot className="w-10 h-10 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Ready to help you learn!</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  {mode === "socratic"
                    ? "I'll guide you through questions to help you discover the solution."
                    : "I'll provide clear explanations and step-by-step solutions."
                  }
                </p>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 pt-4 border-t p-4 bg-muted/50 rounded-lg">
                <p className="font-medium">Or use a quick action below to get started!</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300" role="status" aria-live="polite">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="rounded-2xl px-5 py-4 bg-card border-2 border-border">
                <AIThinkingLoader />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input with Quick Actions */}
      <div className="p-5 border-t-2 border-border flex-shrink-0 bg-background">
        {/* Quick Actions - Above Input */}
        <div className="mb-3 overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-2 min-w-min">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 border min-h-[36px]",
                    action.bgColor,
                    action.borderColor,
                    "disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                  )}
                  aria-label={action.label}
                >
                  <Icon className={cn("w-3.5 h-3.5", action.color)} aria-hidden="true" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="space-y-3"
        >
          <div className="flex gap-3">
            <label htmlFor="chat-input" className="sr-only">
              Type your question here
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1 min-h-[52px] max-h-[104px] px-4 py-3.5 rounded-xl bg-muted/50 border-2 border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent overflow-y-auto text-base transition-all duration-200"
              disabled={isLoading}
              aria-label="Type your question here"
              aria-describedby="chat-hint"
              rows={1}
              autoComplete="off"
              autoCapitalize="sentences"
            />
            <Button
              type="submit"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[52px] w-[52px] flex-shrink-0 rounded-xl btn-press hover:scale-105 transition-transform"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="w-5 h-5" aria-hidden="true" />
              )}
            </Button>
          </div>
          <div id="chat-hint" className="text-xs text-muted-foreground">
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </form>
      </div>
    </Card>
  );
}
