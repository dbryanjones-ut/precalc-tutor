"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Settings, History as HistoryIcon } from "lucide-react";
import { ProblemUploader } from "@/components/ai-tutor/ProblemUploader";
import { ChatInterface } from "@/components/ai-tutor/ChatInterface";
import { ModeToggle } from "@/components/ai-tutor/ModeToggle";
import { QuickActions } from "@/components/ai-tutor/QuickActions";
import { SessionHistory } from "@/components/ai-tutor/SessionHistory";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAITutorStore } from "@/stores/useAITutorStore";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { AITutoringSession } from "@/types";

export default function AITutorPage() {
  const [activeTab, setActiveTab] = useState<"tutor" | "history">("tutor");
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useLocalStorage("ai-tutor-welcome-dismissed", false);
  const { currentSession, resumeSession } = useAITutorStore();
  const settingsRef = useRef<HTMLDivElement>(null);
  const welcomeModalRef = useRef<HTMLDivElement>(null);

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (currentSession) {
      const stored = localStorage.getItem("ai-tutor-sessions");
      const sessions: AITutoringSession[] = stored ? JSON.parse(stored) : [];

      // Update or add current session
      const existingIndex = sessions.findIndex((s) => s.id === currentSession.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = currentSession;
      } else {
        sessions.unshift(currentSession);
      }

      // Keep last 50 sessions
      const trimmedSessions = sessions.slice(0, 50);
      localStorage.setItem("ai-tutor-sessions", JSON.stringify(trimmedSessions));
    }
  }, [currentSession]);

  const handleResumeSession = (session: AITutoringSession) => {
    // Restore full session to store (including message history)
    resumeSession(session);
    setActiveTab("tutor");
  };

  // Focus management for settings panel
  useEffect(() => {
    if (showSettings && settingsRef.current) {
      settingsRef.current.focus();
    }
  }, [showSettings]);

  // Focus management for welcome modal
  useEffect(() => {
    if (!welcomeDismissed && !currentSession && activeTab === "tutor" && welcomeModalRef.current) {
      welcomeModalRef.current.focus();
    }
  }, [welcomeDismissed, currentSession, activeTab]);

  // Close settings on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showSettings]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI Tutor</h1>
                  <p className="text-sm text-muted-foreground">
                    Get personalized help with precalculus
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab(activeTab === "tutor" ? "history" : "tutor")}
                  aria-label={activeTab === "tutor" ? "View session history" : "Return to tutor"}
                  className="min-h-[44px]"
                >
                  {activeTab === "tutor" ? (
                    <>
                      <HistoryIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                      History
                    </>
                  ) : (
                    <>
                      <Bot className="w-4 h-4 mr-2" aria-hidden="true" />
                      Tutor
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  aria-label={showSettings ? "Close settings panel" : "Open settings panel"}
                  aria-expanded={showSettings}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  <span className="sr-only">Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tutor" | "history")}>
            <TabsList className="sr-only">
              <TabsTrigger value="tutor">Tutor</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Tutor Tab */}
            <TabsContent value="tutor" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Problem Upload & Mode */}
                <div className="space-y-6 lg:col-span-1">
                  <ErrorBoundary>
                    <ProblemUploader />
                  </ErrorBoundary>

                  {currentSession && (
                    <>
                      <ErrorBoundary>
                        <ModeToggle />
                      </ErrorBoundary>

                      <ErrorBoundary>
                        <QuickActions />
                      </ErrorBoundary>
                    </>
                  )}
                </div>

                {/* Right Column - Chat Interface */}
                <div className="lg:col-span-2">
                  <ErrorBoundary>
                    <ChatInterface />
                  </ErrorBoundary>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-0">
              <div className="max-w-4xl mx-auto">
                <ErrorBoundary>
                  <SessionHistory onResumeSession={handleResumeSession} />
                </ErrorBoundary>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Settings Panel (Optional) */}
        {showSettings && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSettings(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div
              ref={settingsRef}
              className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-lg animate-in slide-in-from-right duration-300 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 id="settings-title" className="text-lg font-semibold">Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  aria-label="Close settings"
                  className="min-h-[44px] min-w-[44px]"
                >
                  Close
                </Button>
              </div>

              <div className="p-4 space-y-6">
                {/* Accessibility Settings */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Accessibility</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">High Contrast Mode</span>
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Reduce Motion</span>
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Screen Reader Mode</span>
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                  </div>
                </div>

                {/* Learning Preferences */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Learning Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Auto-save Sessions</span>
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Show Confidence Scores</span>
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Minimize Distractions</span>
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                  </div>
                </div>

                {/* Math Display */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Math Display</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm block mb-2">Font Size</label>
                      <select className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm">
                        <option>Small</option>
                        <option selected>Medium</option>
                        <option>Large</option>
                        <option>Extra Large</option>
                      </select>
                    </div>
                    <label className="flex items-center justify-between">
                      <span className="text-sm">Color-Coded Math</span>
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted rounded-full peer-checked:bg-primary transition-colors" />
                    </label>
                  </div>
                </div>

                {/* Data Management */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Data Management</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      Export All Sessions
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive hover:text-destructive"
                      size="sm"
                    >
                      Clear All History
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Modal (First Visit) */}
        {!currentSession && activeTab === "tutor" && !welcomeDismissed && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setWelcomeDismissed(true)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
          >
            <div
              ref={welcomeModalRef}
              className="max-w-md p-6 rounded-lg bg-card border border-border shadow-lg text-center"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
            >
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWelcomeDismissed(true)}
                  aria-label="Dismiss welcome message"
                  className="min-h-[44px] min-w-[44px]"
                >
                  ✕
                </Button>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" aria-hidden="true" />
              </div>
              <h2 id="welcome-title" className="text-2xl font-bold mb-2">Welcome to AI Tutor!</h2>
              <p className="text-muted-foreground mb-6">
                I'm here to help you master precalculus through personalized guidance. Upload a
                problem to get started!
              </p>
              <div className="grid grid-cols-2 gap-4 text-left mb-6">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-sm font-semibold text-blue-500 mb-1">Socratic Mode</div>
                  <div className="text-xs text-muted-foreground">
                    Learn through guided questions
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="text-sm font-semibold text-purple-500 mb-1">
                    Explanation Mode
                  </div>
                  <div className="text-xs text-muted-foreground">Get direct solutions</div>
                </div>
              </div>
              <Button
                onClick={() => setWelcomeDismissed(true)}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
