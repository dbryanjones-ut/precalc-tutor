"use client";

import { Lightbulb, ListOrdered, BookOpen, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAITutorStore } from "@/stores/useAITutorStore";
import { toast } from "sonner";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className = "" }: QuickActionsProps) {
  const { currentSession, sendMessage, mode } = useAITutorStore();

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

  const actions = mode === "socratic" ? socraticActions : explanationActions;

  const additionalActions = [
    {
      icon: BookOpen,
      label: "Related formulas",
      prompt: "What formulas are relevant to this problem?",
      description: "Get a list of applicable formulas",
    },
    {
      icon: Zap,
      label: "Check my work",
      prompt: "I have a solution. Can you help me check if it's correct?",
      description: "Verify your solution step by step",
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={!currentSession}
                  className={`
                    justify-start h-auto py-3 px-4 border transition-all duration-200
                    ${action.bgColor} ${action.borderColor}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Icon className={`w-4 h-4 mr-2 flex-shrink-0 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">More Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {additionalActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                disabled={!currentSession}
                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-0.5">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Contextual Tips */}
      {currentSession && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Learning Tip</h4>
                <p className="text-xs text-muted-foreground">
                  {mode === "socratic"
                    ? "Try to answer the questions yourself before asking for more hints. This builds stronger understanding and problem-solving skills."
                    : "After seeing the solution, try to explain each step in your own words. This helps solidify your understanding."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Stats */}
      {currentSession && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentSession.questionsAsked}
                </div>
                <div className="text-xs text-muted-foreground">Questions Asked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentSession.hintsGiven}</div>
                <div className="text-xs text-muted-foreground">Hints Given</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mode-Specific Guidance */}
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">
            {mode === "socratic" ? "Socratic Mode:" : "Explanation Mode:"}
          </span>{" "}
          {mode === "socratic"
            ? "I'll guide you with questions to help you discover the solution yourself."
            : "I'll provide clear explanations and step-by-step solutions."}
        </p>
      </div>
    </div>
  );
}
