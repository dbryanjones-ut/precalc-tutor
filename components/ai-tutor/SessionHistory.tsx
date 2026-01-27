"use client";

import { useState, useEffect } from "react";
import { History, Search, Download, Trash2, Calendar, Clock, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MathRenderer } from "@/components/math/MathRenderer";
import type { AITutoringSession } from "@/types";
import { toast } from "sonner";

interface SessionHistoryProps {
  onResumeSession?: (session: AITutoringSession) => void;
  className?: string;
}

export function SessionHistory({ onResumeSession, className = "" }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<AITutoringSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">("all");
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions from IndexedDB or localStorage
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      // For now, using localStorage. In production, use IndexedDB
      const stored = localStorage.getItem("ai-tutor-sessions");
      if (stored) {
        const parsedSessions = JSON.parse(stored);
        setSessions(parsedSessions);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load session history");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSessions = (updatedSessions: AITutoringSession[]) => {
    try {
      localStorage.setItem("ai-tutor-sessions", JSON.stringify(updatedSessions));
      setSessions(updatedSessions);
    } catch (error) {
      console.error("Failed to save sessions:", error);
      toast.error("Failed to save sessions");
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    saveSessions(updatedSessions);
    toast.success("Session deleted");
  };

  const handleExportSession = (session: AITutoringSession) => {
    try {
      const exportData = {
        ...session,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-tutor-session-${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Session exported");
    } catch (error) {
      toast.error("Failed to export session");
    }
  };

  const handleResumeSession = (session: AITutoringSession) => {
    if (onResumeSession) {
      onResumeSession(session);
      toast.success("Session resumed");
    }
  };

  const filteredSessions = sessions
    .filter((session) => {
      // Filter by completion status
      if (filter === "completed" && !session.completed) return false;
      if (filter === "incomplete" && session.completed) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          session.extractedProblem.toLowerCase().includes(query) ||
          session.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          session.unit?.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Search sessions"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "completed", "incomplete"] as const).map((filterOption) => (
              <Button
                key={filterOption}
                size="sm"
                variant={filter === filterOption ? "default" : "outline"}
                onClick={() => setFilter(filterOption)}
                className="text-xs"
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p>Loading sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">
              {searchQuery || filter !== "all" ? "No sessions found" : "No sessions yet"}
            </p>
            <p className="text-sm">
              {searchQuery || filter !== "all"
                ? "Try adjusting your search or filter"
                : "Start a new tutoring session to see it here"}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
              >
                {/* Session Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {session.completed && (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(session.lastUpdated)}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          session.mode === "socratic"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-purple-500/10 text-purple-500"
                        }`}
                      >
                        {session.mode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Problem Preview */}
                {session.extractedProblem && (
                  <div className="mb-3 p-3 rounded-md bg-card border border-border/50 overflow-x-auto">
                    <MathRenderer
                      latex={session.extractedProblem.slice(0, 100)}
                      displayMode={false}
                      className="text-sm"
                    />
                    {session.extractedProblem.length > 100 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                  </div>
                )}

                {/* Session Stats */}
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{session.messages.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {session.duration > 0 ? formatDuration(session.duration) : "Active"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{session.questionsAsked}</span>
                  </div>
                </div>

                {/* Tags */}
                {session.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {session.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResumeSession(session)}
                    className="flex-1"
                  >
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSession(session)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {sessions.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-primary">{sessions.length}</div>
                <div className="text-xs text-muted-foreground">Total Sessions</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">
                  {sessions.filter((s) => s.completed).length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold text-primary">
                  {sessions.reduce((sum, s) => sum + s.questionsAsked, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Questions</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
