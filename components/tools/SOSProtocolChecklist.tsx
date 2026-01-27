"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, RotateCcw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  tip: string;
  completed: boolean;
}

interface SOSPhase {
  id: string;
  name: string;
  color: string;
  description: string;
  items: ChecklistItem[];
}

interface SOSProtocolChecklistProps {
  mode?: "floating" | "sidebar" | "inline";
  className?: string;
  onComplete?: () => void;
}

const INITIAL_PHASES: SOSPhase[] = [
  {
    id: "scan",
    name: "SCAN",
    color: "bg-blue-500",
    description: "Read and understand what's being asked",
    items: [
      {
        id: "scan-1",
        text: "Highlight the VERB (find, solve, evaluate, simplify, etc.)",
        tip: "The verb tells you what mathematical operation to perform",
        completed: false,
      },
      {
        id: "scan-2",
        text: "Identify the question type (function, equation, graph, etc.)",
        tip: "Knowing the type helps you recall relevant formulas and strategies",
        completed: false,
      },
      {
        id: "scan-3",
        text: "Underline key numbers, variables, and constraints",
        tip: "Circle domain restrictions, special conditions, or given values",
        completed: false,
      },
      {
        id: "scan-4",
        text: "Translate math notation to plain English",
        tip: "Use the Notation Translator if you see unfamiliar symbols",
        completed: false,
      },
    ],
  },
  {
    id: "organize",
    name: "ORGANIZE",
    color: "bg-green-500",
    description: "Set up your workspace and plan your approach",
    items: [
      {
        id: "org-1",
        text: "List all KNOWNS (given information)",
        tip: "Write down everything you know from the problem statement",
        completed: false,
      },
      {
        id: "org-2",
        text: "List all UNKNOWNS (what you need to find)",
        tip: "Be specific: Are you finding x, f(x), a domain, etc.?",
        completed: false,
      },
      {
        id: "org-3",
        text: "Identify relevant formulas or theorems",
        tip: "Think: What topic is this? What formulas apply?",
        completed: false,
      },
      {
        id: "org-4",
        text: "Sketch a diagram or graph if helpful",
        tip: "Visual representations often reveal the solution path",
        completed: false,
      },
      {
        id: "org-5",
        text: "Choose your strategy (work forward, backward, or both)",
        tip: "Sometimes starting from the answer and working back helps",
        completed: false,
      },
    ],
  },
  {
    id: "solve",
    name: "SOLVE & STORE",
    color: "bg-purple-500",
    description: "Execute your plan and track intermediate results",
    items: [
      {
        id: "solve-1",
        text: "Write each step clearly and legibly",
        tip: "Your future self will thank you during review",
        completed: false,
      },
      {
        id: "solve-2",
        text: "Label intermediate results (a, b, c or step 1, 2, 3)",
        tip: "Naming results helps you track complex calculations",
        completed: false,
      },
      {
        id: "solve-3",
        text: "Check each step before moving to the next",
        tip: "Catch errors early to avoid wasted work",
        completed: false,
      },
      {
        id: "solve-4",
        text: "Store partial results if problem has multiple parts",
        tip: "Write them in a box or sidebar for easy reference",
        completed: false,
      },
      {
        id: "solve-5",
        text: "State your final answer clearly",
        tip: "Box it, underline it, or write 'Answer:' to make it obvious",
        completed: false,
      },
      {
        id: "solve-6",
        text: "Verify: Does the answer make sense?",
        tip: "Check domain, range, units, sign, and magnitude",
        completed: false,
      },
    ],
  },
];

export function SOSProtocolChecklist({
  mode = "sidebar",
  className = "",
  onComplete,
}: SOSProtocolChecklistProps) {
  const [phases, setPhases] = useState<SOSPhase[]>(INITIAL_PHASES);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["scan"]));
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate progress
  const totalItems = phases.reduce((sum, phase) => sum + phase.items.length, 0);
  const completedItems = phases.reduce(
    (sum, phase) => sum + phase.items.filter((item) => item.completed).length,
    0
  );
  const progressPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const toggleItem = (phaseId: string, itemId: string) => {
    setPhases((prev) =>
      prev.map((phase) => {
        if (phase.id === phaseId) {
          return {
            ...phase,
            items: phase.items.map((item) =>
              item.id === itemId ? { ...item, completed: !item.completed } : item
            ),
          };
        }
        return phase;
      })
    );
  };

  const resetChecklist = () => {
    setPhases(INITIAL_PHASES);
    setExpandedPhases(new Set(["scan"]));
  };

  const getPhaseProgress = (phase: SOSPhase) => {
    const completed = phase.items.filter((item) => item.completed).length;
    return `${completed}/${phase.items.length}`;
  };

  if (isCollapsed) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">SOS Protocol</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(false)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              SOS Problem-Solving Protocol
              <Badge variant="outline" className="text-xs">
                ADHD-Friendly
              </Badge>
            </CardTitle>
            <CardDescription>
              A systematic approach to tackle any precalculus problem
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">
              {completedItems}/{totalItems} ({Math.round(progressPercentage)}%)
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {phases.map((phase, phaseIdx) => {
          const isExpanded = expandedPhases.has(phase.id);
          const phaseCompleted = phase.items.every((item) => item.completed);

          return (
            <div key={phase.id} className="border rounded-lg overflow-hidden">
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold", phase.color)}>
                    {phaseIdx + 1}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold flex items-center gap-2">
                      {phase.name}
                      {phaseCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {phase.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{getPhaseProgress(phase)}</Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {/* Phase Items */}
              {isExpanded && (
                <div className="border-t bg-muted/20">
                  <div className="p-4 space-y-3">
                    {phase.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 group"
                      >
                        <button
                          onClick={() => toggleItem(phase.id, item.id)}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 space-y-1">
                          <div
                            className={cn(
                              "text-sm",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.text}
                          </div>
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                            <Lightbulb className="h-3 w-3 flex-shrink-0 mt-0.5 text-amber-600" />
                            <span>{item.tip}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Reset Button */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+R</kbd> to reset
          </div>
          <Button variant="outline" size="sm" onClick={resetChecklist}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Checklist
          </Button>
        </div>

        {/* Completion Message */}
        {progressPercentage === 100 && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-semibold mb-1">
              <CheckCircle2 className="h-5 w-5" />
              All steps completed!
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              Great job following the SOS protocol. Double-check your answer and you're ready to move on!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Keyboard shortcut hook (optional)
export function useSOSKeyboardShortcuts(resetFn: () => void) {
  if (typeof window === "undefined") return;

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === "R") {
      e.preventDefault();
      resetFn();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }
}
