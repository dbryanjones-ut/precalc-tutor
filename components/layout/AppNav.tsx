"use client";

import { useState, useEffect } from "react";
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
  Zap,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="border-b-2 bg-background sticky top-0 z-50 backdrop-blur-sm bg-background/95" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl group"
            aria-label="PreCalc Tutor home"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold hidden sm:inline">PreCalc Tutor</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
                    "hover:bg-primary/10 hover:text-primary hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground"
                  )}
                  title={item.description}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Settings & Mobile Menu Button */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className={cn(
                "hidden sm:flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 min-h-[44px]",
                "hover:bg-primary/10 hover:text-primary hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                pathname === "/settings"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground"
              )}
              aria-label="Settings"
              aria-current={pathname === "/settings" ? "page" : undefined}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-h-[44px] min-w-[44px] hover:bg-primary/10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-background border-l-2 border-border z-50 lg:hidden overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
          >
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2">
                <span className="text-xl font-bold">Navigation</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>

              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 rounded-xl px-5 py-4 text-base font-medium transition-all duration-200 w-full min-h-[60px] border-2",
                      "hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:shadow-md",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/20 shadow-md"
                        : "text-foreground border-transparent"
                    )}
                    aria-label={item.description}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      isActive ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-4 border-t-2 border-border mt-4">
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-5 py-4 text-base font-medium transition-all duration-200 w-full min-h-[60px] border-2",
                    "hover:bg-primary/10 hover:text-primary hover:border-primary/20 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    pathname === "/settings"
                      ? "bg-primary/10 text-primary border-primary/20 shadow-md"
                      : "text-foreground border-transparent"
                  )}
                  aria-label="Settings"
                  aria-current={pathname === "/settings" ? "page" : undefined}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    pathname === "/settings" ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Settings className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Settings</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Customize your experience</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
