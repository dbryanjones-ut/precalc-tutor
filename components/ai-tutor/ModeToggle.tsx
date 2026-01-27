"use client";

import { useState } from "react";
import { MessageSquare, BookOpen, HelpCircle } from "lucide-react";
import { useAITutorStore } from "@/stores/useAITutorStore";
import type { TutoringMode } from "@/types";

interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className = "" }: ModeToggleProps) {
  const { mode, setMode } = useAITutorStore();
  const [showTooltip, setShowTooltip] = useState<TutoringMode | null>(null);

  const modes = [
    {
      id: "socratic" as TutoringMode,
      name: "Socratic",
      icon: MessageSquare,
      description: "Learn through guided questions that help you discover solutions",
      benefits: [
        "Builds deeper understanding",
        "Encourages critical thinking",
        "Helps you learn problem-solving strategies",
      ],
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      id: "explanation" as TutoringMode,
      name: "Explanation",
      icon: BookOpen,
      description: "Get direct explanations with step-by-step solutions",
      benefits: [
        "Quick understanding of concepts",
        "See complete solution steps",
        "Good for time-sensitive studying",
      ],
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ];

  const currentMode = modes.find((m) => m.id === mode) || modes[0];

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-muted-foreground">Tutoring Mode</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mode information"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-muted">
        {modes.map((modeOption) => {
          const Icon = modeOption.icon;
          const isActive = mode === modeOption.id;

          return (
            <div key={modeOption.id} className="relative">
              <button
                type="button"
                onClick={() => setMode(modeOption.id)}
                onMouseEnter={() => setShowTooltip(modeOption.id)}
                onMouseLeave={() => setShowTooltip(null)}
                className={`
                  w-full px-4 py-3 rounded-md transition-all duration-200
                  flex items-center justify-center gap-2
                  ${
                    isActive
                      ? "bg-background shadow-sm border border-border"
                      : "hover:bg-background/50"
                  }
                `}
                aria-label={`${modeOption.name} mode`}
                aria-pressed={isActive}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? modeOption.color : "text-muted-foreground"}`}
                />
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {modeOption.name}
                </span>
              </button>

              {/* Tooltip */}
              {showTooltip === modeOption.id && (
                <div
                  className="absolute z-50 w-72 p-4 rounded-lg bg-popover border border-border shadow-lg
                            top-full mt-2 left-1/2 -translate-x-1/2
                            animate-in fade-in slide-in-from-top-2 duration-200"
                  role="tooltip"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className={`p-2 rounded-md ${modeOption.bgColor}`}>
                        <Icon className={`w-5 h-5 ${modeOption.color}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{modeOption.name} Mode</h4>
                        <p className="text-xs text-muted-foreground">{modeOption.description}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs font-medium">Benefits:</p>
                      <ul className="space-y-1">
                        {modeOption.benefits.map((benefit, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start">
                            <span className="mr-2">•</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tooltip arrow */}
                  <div
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-l border-t border-border rotate-45"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Mode Description */}
      <div
        className={`
        mt-3 p-3 rounded-lg border transition-all duration-300
        ${currentMode.bgColor} ${currentMode.borderColor}
      `}
      >
        <div className="flex items-start gap-2">
          <currentMode.icon className={`w-4 h-4 ${currentMode.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <p className="text-xs font-medium mb-1">Active: {currentMode.name}</p>
            <p className="text-xs text-muted-foreground">{currentMode.description}</p>
          </div>
        </div>
      </div>

      {/* Mode Comparison Note */}
      <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Tip:</span> Start with Socratic mode for deeper learning,
          switch to Explanation when you're stuck or short on time.
        </p>
      </div>
    </div>
  );
}
