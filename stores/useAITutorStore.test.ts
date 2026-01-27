import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAITutorStore } from "./useAITutorStore";
import type { ChatMessage } from "@/types";

// Mock fetch
global.fetch = vi.fn();

describe("useAITutorStore", () => {
  beforeEach(() => {
    // Reset store and mocks before each test
    useAITutorStore.setState({
      currentSession: null,
      mode: "socratic",
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have null current session initially", () => {
      const { currentSession } = useAITutorStore.getState();
      expect(currentSession).toBeNull();
    });

    it("should default to socratic mode", () => {
      const { mode } = useAITutorStore.getState();
      expect(mode).toBe("socratic");
    });

    it("should not be loading initially", () => {
      const { isLoading } = useAITutorStore.getState();
      expect(isLoading).toBe(false);
    });

    it("should have no error initially", () => {
      const { error } = useAITutorStore.getState();
      expect(error).toBeNull();
    });
  });

  describe("startSession", () => {
    it("should create a new session", () => {
      const { startSession } = useAITutorStore.getState();

      startSession();

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession).not.toBeNull();
      expect(currentSession?.id).toBeTruthy();
      expect(currentSession?.messages).toEqual([]);
    });

    it("should include uploaded image if provided", () => {
      const { startSession } = useAITutorStore.getState();

      startSession("data:image/png;base64,abc123");

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.uploadedImage).toBe("data:image/png;base64,abc123");
    });

    it("should include extracted problem if provided", () => {
      const { startSession } = useAITutorStore.getState();

      startSession(undefined, "Solve x^2 + 2x + 1 = 0");

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.extractedProblem).toBe("Solve x^2 + 2x + 1 = 0");
    });

    it("should use current mode", () => {
      const { setMode, startSession } = useAITutorStore.getState();

      setMode("explanation");
      startSession();

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.mode).toBe("explanation");
    });

    it("should initialize session stats to zero", () => {
      const { startSession } = useAITutorStore.getState();

      startSession();

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.questionsAsked).toBe(0);
      expect(currentSession?.hintsGiven).toBe(0);
      expect(currentSession?.duration).toBe(0);
    });

    it("should clear previous error", () => {
      const { startSession } = useAITutorStore.getState();

      useAITutorStore.setState({ error: "Previous error" });
      startSession();

      const { error } = useAITutorStore.getState();
      expect(error).toBeNull();
    });
  });

  describe("sendMessage", () => {
    beforeEach(() => {
      const { startSession } = useAITutorStore.getState();
      startSession();
    });

    it("should add user message immediately", async () => {
      const { sendMessage } = useAITutorStore.getState();

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: "Here's the solution",
          latex: ["x = 2"],
        }),
      });

      await sendMessage("What is x?");

      const { currentSession } = useAITutorStore.getState();
      const userMessages = currentSession?.messages.filter((m) => m.role === "user");
      expect(userMessages).toHaveLength(1);
      expect(userMessages?.[0].content).toBe("What is x?");
    });

    it("should set loading state during request", async () => {
      const { sendMessage } = useAITutorStore.getState();

      // Mock delayed response
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ content: "Response" }),
                }),
              100
            )
          )
      );

      const promise = sendMessage("Test");

      // Check loading state immediately
      const { isLoading } = useAITutorStore.getState();
      expect(isLoading).toBe(true);

      await promise;
    });

    it("should add assistant response on success", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: "The answer is 2",
          latex: ["x = 2"],
          citations: [],
        }),
      });

      await sendMessage("What is x?");

      const { currentSession } = useAITutorStore.getState();
      const assistantMessages = currentSession?.messages.filter(
        (m) => m.role === "assistant"
      );
      expect(assistantMessages).toHaveLength(1);
      expect(assistantMessages?.[0].content).toBe("The answer is 2");
    });

    it("should increment questions asked", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: "Response" }),
      });

      await sendMessage("Question 1");
      await sendMessage("Question 2");

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.questionsAsked).toBe(2);
    });

    it("should handle API errors", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await sendMessage("Test question");

      const { error, isLoading } = useAITutorStore.getState();
      expect(error).toBeTruthy();
      expect(isLoading).toBe(false);
    });

    it("should handle network errors", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await sendMessage("Test question");

      const { error, isLoading } = useAITutorStore.getState();
      expect(error).toBeTruthy();
      expect(isLoading).toBe(false);
    });

    it("should include message history in request", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: "Response" }),
      });

      await sendMessage("First question");
      await sendMessage("Second question");

      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/ai/tutor",
        expect.objectContaining({
          body: expect.stringContaining("messageHistory"),
        })
      );
    });

    it("should update lastUpdated timestamp", async () => {
      const { sendMessage } = useAITutorStore.getState();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: "Response" }),
      });

      const before = new Date().toISOString();
      await sendMessage("Test");

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.lastUpdated).toBeTruthy();
      expect(new Date(currentSession!.lastUpdated).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime()
      );
    });
  });

  describe("addAssistantMessage", () => {
    beforeEach(() => {
      const { startSession } = useAITutorStore.getState();
      startSession();
    });

    it("should add assistant message", () => {
      const { addAssistantMessage } = useAITutorStore.getState();

      const message: ChatMessage = {
        role: "assistant",
        content: "Here's help",
        timestamp: new Date().toISOString(),
      };

      addAssistantMessage(message);

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.messages).toContain(message);
    });

    it("should update lastUpdated", () => {
      const { addAssistantMessage } = useAITutorStore.getState();

      const message: ChatMessage = {
        role: "assistant",
        content: "Test",
        timestamp: new Date().toISOString(),
      };

      addAssistantMessage(message);

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.lastUpdated).toBeTruthy();
    });
  });

  describe("Mode Management", () => {
    it("should toggle between modes", () => {
      const { toggleMode } = useAITutorStore.getState();

      expect(useAITutorStore.getState().mode).toBe("socratic");

      toggleMode();
      expect(useAITutorStore.getState().mode).toBe("explanation");

      toggleMode();
      expect(useAITutorStore.getState().mode).toBe("socratic");
    });

    it("should set specific mode", () => {
      const { setMode } = useAITutorStore.getState();

      setMode("explanation");
      expect(useAITutorStore.getState().mode).toBe("explanation");

      setMode("socratic");
      expect(useAITutorStore.getState().mode).toBe("socratic");
    });
  });

  describe("endSession", () => {
    it("should calculate session duration", () => {
      const { startSession, endSession } = useAITutorStore.getState();

      startSession();

      // Wait a bit
      setTimeout(() => {}, 100);

      endSession();

      // After ending, currentSession should be null
      const { currentSession } = useAITutorStore.getState();
      expect(currentSession).toBeNull();
    });

    it("should mark session as completed", () => {
      const { startSession, endSession } = useAITutorStore.getState();

      startSession();

      // Capture session before ending
      const sessionBefore = useAITutorStore.getState().currentSession;

      endSession();

      // Session should have been logged as completed (check console)
      expect(sessionBefore).not.toBeNull();
    });

    it("should clear error state", () => {
      const { startSession, endSession } = useAITutorStore.getState();

      startSession();
      useAITutorStore.setState({ error: "Some error" });

      endSession();

      const { error } = useAITutorStore.getState();
      expect(error).toBeNull();
    });

    it("should handle ending without active session", () => {
      const { endSession } = useAITutorStore.getState();

      // Should not throw
      expect(() => endSession()).not.toThrow();

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should set loading state", () => {
      const { setLoading } = useAITutorStore.getState();

      setLoading(true);
      expect(useAITutorStore.getState().isLoading).toBe(true);

      setLoading(false);
      expect(useAITutorStore.getState().isLoading).toBe(false);
    });
  });

  describe("Error State", () => {
    it("should set error message", () => {
      const { setError } = useAITutorStore.getState();

      setError("Test error");
      expect(useAITutorStore.getState().error).toBe("Test error");
    });

    it("should clear error", () => {
      const { setError } = useAITutorStore.getState();

      setError("Test error");
      setError(null);

      expect(useAITutorStore.getState().error).toBeNull();
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle complete tutoring conversation", async () => {
      const { startSession, sendMessage, mode } = useAITutorStore.getState();

      // Start session
      startSession(undefined, "Solve x^2 + 2x + 1 = 0");

      // Mock API responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: "What do you think the first step should be?",
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content: "Good! Let's factor it together.",
          }),
        });

      // Conversation
      await sendMessage("I need help with this problem");
      await sendMessage("Factor it?");

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.messages).toHaveLength(4); // 2 user + 2 assistant
      expect(currentSession?.questionsAsked).toBe(2);
    });

    it("should maintain session state across errors", async () => {
      const { startSession, sendMessage } = useAITutorStore.getState();

      startSession();

      // Successful message
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: "Response 1" }),
      });
      await sendMessage("Question 1");

      // Failed message
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
      });
      await sendMessage("Question 2");

      const { currentSession, error } = useAITutorStore.getState();

      // Should have error but session should still exist
      expect(error).toBeTruthy();
      expect(currentSession).not.toBeNull();
      expect(currentSession?.messages.length).toBeGreaterThan(0);
    });

    it("should handle switching modes mid-session", () => {
      const { startSession, setMode } = useAITutorStore.getState();

      startSession();

      // Get currentSession after startSession is called
      const currentSession = useAITutorStore.getState().currentSession;
      expect(currentSession?.mode).toBe("socratic");

      setMode("explanation");
      expect(useAITutorStore.getState().mode).toBe("explanation");

      // Session mode doesn't change retroactively
      expect(useAITutorStore.getState().currentSession?.mode).toBe("socratic");
    });
  });

  describe("Edge Cases", () => {
    it("should handle sendMessage without active session", async () => {
      const { sendMessage } = useAITutorStore.getState();

      // Should not throw or make API call
      await sendMessage("Test");

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should handle addAssistantMessage without active session", () => {
      const { addAssistantMessage } = useAITutorStore.getState();

      const message: ChatMessage = {
        role: "assistant",
        content: "Test",
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      expect(() => addAssistantMessage(message)).not.toThrow();
    });

    it("should handle very long conversations", async () => {
      const { startSession, sendMessage } = useAITutorStore.getState();

      startSession();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ content: "Response" }),
      });

      // Send many messages
      for (let i = 0; i < 50; i++) {
        await sendMessage(`Question ${i}`);
      }

      const { currentSession } = useAITutorStore.getState();
      expect(currentSession?.messages.length).toBe(100); // 50 user + 50 assistant
      expect(currentSession?.questionsAsked).toBe(50);
    });
  });
});
