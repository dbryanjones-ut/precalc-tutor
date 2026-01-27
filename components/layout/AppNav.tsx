"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Target,
  Sparkles,
  Library,
  Settings,
  Brain,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Your progress and stats",
  },
  {
    name: "AI Tutor",
    href: "/ai-tutor",
    icon: Sparkles,
    description: "Upload problems & ask questions",
  },
  {
    name: "Practice",
    href: "/practice",
    icon: Target,
    description: "Q4 drills, unit circle & more",
  },
  {
    name: "Lessons",
    href: "/lessons",
    icon: BookOpen,
    description: "Interactive lessons",
  },
  {
    name: "Tools",
    href: "/tools",
    icon: Zap,
    description: "Visual learning tools",
  },
  {
    name: "Reference",
    href: "/reference",
    icon: Library,
    description: "Notation table & guides",
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PreCalc Tutor</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                  title={item.description}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              pathname === "/settings"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
