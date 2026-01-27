"use client";

import { useState, useMemo } from "react";
import { Search, Copy, AlertTriangle, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/math/MathRenderer";
import notationData from "@/data/reference/notation-table.json";
import { toast } from "sonner";

interface Notation {
  id: string;
  notation: string;
  meaning: string;
  confusedWith: string;
  trap: string;
  mnemonic: string;
  examples: string[];
  category: string;
  apUnit: number;
}

interface NotationTranslatorProps {
  mode?: "sidebar" | "dialog" | "inline";
  className?: string;
}

const categoryColors: Record<string, string> = {
  functions: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  algebra: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  trigonometry: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  exponential: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  logarithmic: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  calculus: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  sequences: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  combinatorics: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  parametric: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  polar: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};

function NotationContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotation, setSelectedNotation] = useState<Notation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const notations = notationData.notations as Notation[];

  // Filter notations based on search query and category
  const filteredNotations = useMemo(() => {
    return notations.filter((notation) => {
      const matchesSearch =
        searchQuery === "" ||
        notation.notation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notation.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notation.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !selectedCategory || notation.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [notations, searchQuery, selectedCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(notations.map((n) => n.category)));
  }, [notations]);

  const copyLatex = (latex: string) => {
    navigator.clipboard.writeText(latex);
    toast.success("LaTeX copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notation, symbol, or concept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Notation List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredNotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No notations found</p>
          </div>
        ) : (
          filteredNotations.map((notation) => (
            <Card
              key={notation.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedNotation(notation)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MathRenderer latex={notation.notation} displayMode={false} />
                      <Badge
                        variant="secondary"
                        className={categoryColors[notation.category] || ""}
                      >
                        {notation.category}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {notation.meaning}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyLatex(notation.notation);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      {selectedNotation && (
        <Dialog
          open={!!selectedNotation}
          onOpenChange={(open) => !open && setSelectedNotation(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                <MathRenderer
                  latex={selectedNotation.notation}
                  displayMode={false}
                  className="text-2xl"
                />
                <Badge
                  variant="secondary"
                  className={categoryColors[selectedNotation.category] || ""}
                >
                  {selectedNotation.category}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedNotation.meaning}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Mnemonic */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  How to Remember
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedNotation.mnemonic}
                </p>
              </div>

              {/* Examples */}
              <div>
                <h3 className="font-semibold mb-2">Examples</h3>
                <ul className="space-y-2">
                  {selectedNotation.examples.map((example, idx) => (
                    <li
                      key={idx}
                      className="bg-muted p-3 rounded-md text-sm"
                    >
                      <MathRenderer latex={example} displayMode={false} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Common Confusion */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Commonly Confused With
                </h3>
                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Often mistaken for:</span>
                    <MathRenderer latex={selectedNotation.confusedWith} displayMode={false} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Trap:</strong> {selectedNotation.trap}
                  </p>
                </div>
              </div>

              {/* LaTeX Code */}
              <div>
                <h3 className="font-semibold mb-2">LaTeX Code</h3>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono">
                    {selectedNotation.notation}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLatex(selectedNotation.notation)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* AP Unit */}
              <div className="text-xs text-muted-foreground">
                AP Precalculus Unit {selectedNotation.apUnit}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function NotationTranslator({
  mode = "sidebar",
  className = "",
}: NotationTranslatorProps) {
  if (mode === "dialog") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            <BookOpen className="h-4 w-4 mr-2" />
            Notation Reference
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Notation Translator</DialogTitle>
            <DialogDescription>
              Search and explore mathematical notation used in AP Precalculus
            </DialogDescription>
          </DialogHeader>
          <NotationContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={`${className} flex flex-col h-full`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Notation Translator
        </CardTitle>
        <CardDescription>
          Search and explore mathematical notation
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <NotationContent />
      </CardContent>
    </Card>
  );
}
