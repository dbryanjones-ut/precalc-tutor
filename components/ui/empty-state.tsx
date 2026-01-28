"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tip?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tip,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-500",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Animated background circle */}
        <div className="absolute inset-0 -z-10 animate-pulse">
          <div className="h-24 w-24 rounded-full bg-primary/10" />
        </div>
        {/* Icon with subtle animation */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 animate-in zoom-in-50 duration-700">
          <Icon className="h-12 w-12 text-primary" />
        </div>
      </div>

      <h3 className="mb-2 text-xl font-semibold animate-in slide-in-from-bottom-4 duration-500 delay-100">
        {title}
      </h3>

      <p className="mb-6 max-w-md text-muted-foreground animate-in slide-in-from-bottom-4 duration-500 delay-200">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="lg"
          className="animate-in slide-in-from-bottom-4 duration-500 delay-300 hover:scale-105 transition-transform"
        >
          {actionLabel}
        </Button>
      )}

      {tip && (
        <div className="mt-8 rounded-lg bg-primary/5 px-4 py-3 text-sm text-muted-foreground animate-in slide-in-from-bottom-4 duration-500 delay-500">
          <span className="font-semibold text-primary">💡 Pro tip:</span> {tip}
        </div>
      )}
    </div>
  );
}
