"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Image as ImageIcon, FileText, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/math/MathRenderer";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ProblemDisplayProps {
  uploadedImage?: string;
  extractedProblem?: string;
  className?: string;
  defaultCollapsed?: boolean;
}

/**
 * ProblemDisplay Component
 *
 * Displays the original problem in a clean, accessible format at the top of the chat interface.
 * Students can reference the problem while chatting with the AI tutor.
 *
 * Features:
 * - Shows uploaded image (if available)
 * - Displays extracted LaTeX problem
 * - Collapsible to save space
 * - Mobile-responsive
 * - Accessibility-focused
 */
export function ProblemDisplay({
  uploadedImage,
  extractedProblem,
  className = "",
  defaultCollapsed = false,
}: ProblemDisplayProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showImage, setShowImage] = useState(true);

  const hasImage = Boolean(uploadedImage);
  const hasProblem = Boolean(extractedProblem && extractedProblem.trim());

  // Don't render if there's no content to show
  if (!hasImage && !hasProblem) {
    return null;
  }

  return (
    <Card
      className={cn(
        "border-2 shadow-sm transition-all duration-300 overflow-hidden",
        "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:dark:to-purple-950/20",
        className
      )}
    >
      {/* Header - Always Visible */}
      <div
        className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
        role="button"
        aria-expanded={!isCollapsed}
        aria-controls="problem-content"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsCollapsed(!isCollapsed);
          }
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm flex items-center gap-2 flex-wrap">
              Original Problem
              {hasImage && (
                <Badge variant="secondary" className="text-xs">
                  <ImageIcon className="w-3 h-3 mr-1" aria-hidden="true" />
                  Image
                </Badge>
              )}
              {hasProblem && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="w-3 h-3 mr-1" aria-hidden="true" />
                  Text
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCollapsed ? "Click to view problem" : "Click to hide"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="flex-shrink-0 h-9 w-9 p-0"
          aria-label={isCollapsed ? "Expand problem" : "Collapse problem"}
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
        >
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Content - Collapsible */}
      <div
        id="problem-content"
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "max-h-0 opacity-0" : "max-h-[800px] opacity-100"
        )}
      >
        <div className="p-4 pt-0 space-y-4 border-t border-border/50">
          {/* Uploaded Image */}
          {hasImage && uploadedImage && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  Problem Image
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowImage(!showImage)}
                  className="h-8 text-xs"
                  aria-label={showImage ? "Hide image" : "Show image"}
                >
                  {showImage ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              {showImage && (
                <div className="relative rounded-lg overflow-hidden border-2 border-border bg-white dark:bg-gray-900 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative w-full" style={{ aspectRatio: "auto" }}>
                    <Image
                      src={uploadedImage}
                      alt="Uploaded problem"
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[400px] object-contain"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extracted Problem Text */}
          {hasProblem && extractedProblem && (
            <div className="space-y-3">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                Problem Statement
              </label>
              <div className="rounded-lg border-2 border-border bg-background/80 p-5 shadow-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MathRenderer
                    latex={extractedProblem}
                    displayMode={true}
                    className="text-base leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">i</span>
            </div>
            <p className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed">
              Reference this problem anytime during your chat. You can collapse this section to focus on the conversation.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
