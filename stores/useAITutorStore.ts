import { create } from "zustand";
import type { AITutoringSession, ChatMessage, TutoringMode } from "@/types";

interface AITutorStore {
  currentSession: AITutoringSession | null;
  mode: TutoringMode;
  isLoading: boolean;
  error: string | null;

  // Actions
  startSession: (uploadedImage?: string, extractedProblem?: string) => void;
  resumeSession: (session: AITutoringSession) => void;
  sendMessage: (content: string) => Promise<void>;
  addAssistantMessage: (message: ChatMessage) => void;
  toggleMode: () => void;
  setMode: (mode: TutoringMode) => void;
  endSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAITutorStore = create<AITutorStore>((set, get) => ({
  currentSession: null,
  mode: "socratic",
  isLoading: false,
  error: null,

  startSession: (uploadedImage, extractedProblem = "") => {
    const sessionId = `session-${Date.now()}`;
    const newSession: AITutoringSession = {
      id: sessionId,
      timestamp: new Date().toISOString(),
      uploadedImage,
      extractedProblem,
      mode: get().mode,
      messages: [],
      problemsSolved: [],
      conceptsCovered: [],
      duration: 0,
      questionsAsked: 0,
      hintsGiven: 0,
      completed: false,
      lastUpdated: new Date().toISOString(),
      tags: [],
    };

    set({ currentSession: newSession, error: null });
  },

  resumeSession: (session) => {
    // Restore the full session including all message history
    set({
      currentSession: session,
      mode: session.mode,
      error: null
    });
  },

  sendMessage: async (content: string) => {
    const { currentSession, mode } = get();
    if (!currentSession) return;

    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    set({
      currentSession: {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        questionsAsked: currentSession.questionsAsked + 1,
        lastUpdated: new Date().toISOString(),
      },
      isLoading: true,
      error: null,
    });

    try {
      // Make API call to Claude
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          mode,
          context: {
            extractedProblem: currentSession.extractedProblem,
            messageHistory: currentSession.messages,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI tutor");
      }

      const responseData = await response.json();
      const data = responseData.data; // API wraps response in { data: {...} }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        latex: data.latex,
        citations: data.citations,
      };

      const session = get().currentSession;
      if (session) {
        set({
          currentSession: {
            ...session,
            messages: [...session.messages, assistantMessage],
            lastUpdated: new Date().toISOString(),
          },
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  addAssistantMessage: (message) => {
    const { currentSession } = get();
    if (!currentSession) return;

    set({
      currentSession: {
        ...currentSession,
        messages: [...currentSession.messages, message],
        lastUpdated: new Date().toISOString(),
      },
    });
  },

  toggleMode: () =>
    set((state) => ({
      mode: state.mode === "socratic" ? "explanation" : "socratic",
    })),

  setMode: (mode) => set({ mode }),

  endSession: () => {
    const { currentSession } = get();
    if (currentSession) {
      // Calculate total duration
      const start = new Date(currentSession.timestamp).getTime();
      const end = new Date().getTime();
      const duration = Math.floor((end - start) / 1000); // in seconds

      const completedSession: AITutoringSession = {
        ...currentSession,
        duration,
        completed: true,
        lastUpdated: new Date().toISOString(),
      };

      // TODO: Save to IndexedDB here
      console.log("Session completed:", completedSession);
    }

    set({ currentSession: null, error: null });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
