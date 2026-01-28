"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Warming up the calculator...",
  "Sharpening pencils...",
  "Consulting with Euler...",
  "Summoning the unit circle...",
  "Checking our work twice...",
  "Dividing by zero... just kidding!",
  "Factoring polynomials...",
  "Graphing transformations...",
  "Remembering SOH CAH TOA...",
  "Finding the asymptotes...",
  "Solving for x...",
  "Applying L'Hôpital's rule...",
  "Drawing perfect parabolas...",
  "Memorizing trig identities...",
  "Thinking mathematically...",
  "Processing your brilliance...",
  "Calculating the derivative of fun...",
  "Integrating knowledge...",
];

const AI_THINKING_MESSAGES = [
  "Thinking deeply about your question...",
  "Consulting my vast mathematical knowledge...",
  "Preparing a helpful explanation...",
  "Crafting the perfect hint...",
  "Finding the best approach...",
  "Analyzing the problem...",
  "Building a step-by-step solution...",
  "Channeling my inner tutor...",
];

const IMAGE_PROCESSING_MESSAGES = [
  "Scanning your problem...",
  "Reading that handwriting...",
  "Detecting mathematical symbols...",
  "Converting image to LaTeX...",
  "Recognizing equations...",
  "Processing that beautiful math...",
];

interface LoadingMessageProps {
  type?: "general" | "ai" | "image";
  message?: string;
  className?: string;
  showSpinner?: boolean;
  cycleInterval?: number;
}

export function LoadingMessage({
  type = "general",
  message,
  className,
  showSpinner = true,
  cycleInterval = 2000,
}: LoadingMessageProps) {
  const [currentMessage, setCurrentMessage] = useState(message || "");

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      return;
    }

    // Select message pool based on type
    let messages: string[];
    switch (type) {
      case "ai":
        messages = AI_THINKING_MESSAGES;
        break;
      case "image":
        messages = IMAGE_PROCESSING_MESSAGES;
        break;
      default:
        messages = LOADING_MESSAGES;
    }

    // Set initial random message
    setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);

    // Cycle through messages if cycleInterval is set
    if (cycleInterval > 0) {
      const interval = setInterval(() => {
        setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
      }, cycleInterval);

      return () => clearInterval(interval);
    }
  }, [message, type, cycleInterval]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-muted-foreground animate-in fade-in duration-500",
        className
      )}
    >
      {showSpinner && <Loader2 className="h-5 w-5 animate-spin" />}
      <span className="text-sm animate-pulse">{currentMessage}</span>
    </div>
  );
}

// Pre-defined variants for common use cases
export function AIThinkingLoader({ className }: { className?: string }) {
  return (
    <LoadingMessage
      type="ai"
      className={className}
      cycleInterval={3000}
    />
  );
}

export function ImageProcessingLoader({ className }: { className?: string }) {
  return (
    <LoadingMessage
      type="image"
      className={className}
      cycleInterval={2500}
    />
  );
}

export function GeneralLoader({ className }: { className?: string }) {
  return (
    <LoadingMessage
      type="general"
      className={className}
      cycleInterval={2000}
    />
  );
}
