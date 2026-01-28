"use client";

import { useState } from "react";
import { MessageSquare, BookOpen, HelpCircle } from "lucide-react";
import { useAITutorStore } from "@/stores/useAITutorStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
      activeBg: "bg-blue-500/20",
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
      activeBg: "bg-purple-500/20",
    },
  ];

  const currentMode = modes.find((m) => m.id === mode) || modes[0];

  return (
    <Card className={`${className} border-2`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>Tutoring Mode</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mode information"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-muted/50">
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
                    w-full px-4 py-4 rounded-lg transition-all duration-200
                    flex flex-col items-center justify-center gap-2
                    ${
                      isActive
                        ? `${modeOption.activeBg} shadow-md border-2 ${modeOption.borderColor}`
                        : "hover:bg-background/80 border-2 border-transparent"
                    }
                  `}
                  aria-label={`${modeOption.name} mode`}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={`w-6 h-6 ${isActive ? modeOption.color : "text-muted-foreground"}`}
                  />
                  <span
                    className={`text-sm font-semibold ${
                      isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {modeOption.name}
                  </span>
                </button>

                {/* Tooltip */}
                {showTooltip === modeOption.id && (
                  <div
                    className="absolute z-50 w-80 p-5 rounded-xl bg-popover border-2 border-border shadow-xl
                              top-full mt-3 left-1/2 -translate-x-1/2
                              animate-in fade-in slide-in-from-top-2 duration-200"
                    role="tooltip"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg ${modeOption.bgColor}`}>
                          <Icon className={`w-6 h-6 ${modeOption.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-2">{modeOption.name} Mode</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{modeOption.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Benefits:</p>
                        <ul className="space-y-2">
                          {modeOption.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${modeOption.color.replace('text-', 'bg-')} mt-1.5`}></span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Tooltip arrow */}
                    <div
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-popover border-l-2 border-t-2 border-border rotate-45"
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
          p-4 rounded-xl border-2 transition-all duration-300
          ${currentMode.bgColor} ${currentMode.borderColor}
        `}
        >
          <div className="flex items-start gap-3">
            <currentMode.icon className={`w-5 h-5 ${currentMode.color} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1.5">Active: {currentMode.name}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentMode.description}</p>
            </div>
          </div>
        </div>

        {/* Mode Comparison Note */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip:</span> Start with Socratic mode for deeper learning,
            switch to Explanation when you're stuck or short on time.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
