"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, BookMarked, AlertCircle } from "lucide-react";
import goldenWordsData from "@/data/reference/golden-words.json";

interface GoldenWord {
  term: string;
  definition: string;
  formalDefinition: string;
  examples: string[];
  commonMisconceptions: string[];
  relatedTerms: string[];
  apUnit: number;
}

interface Category {
  name: string;
  words: GoldenWord[];
}

interface GoldenWordsGuideProps {
  mode?: "quick" | "full";
  className?: string;
}

const categoryColors: Record<string, string> = {
  functions: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  trigonometry: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  exponential: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  calculus: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  sequences: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
};

export function GoldenWordsGuide({ mode = "full", className = "" }: GoldenWordsGuideProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<GoldenWord | null>(null);

  const categories = goldenWordsData.categories as unknown as Record<string, Category>;

  // Flatten all words with their category
  const allWords = useMemo(() => {
    return Object.entries(categories).flatMap(([categoryKey, category]) =>
      category.words.map((word) => ({
        ...word,
        categoryKey,
        categoryName: category.name,
      }))
    );
  }, [categories]);

  // Filter words based on search and category
  const filteredWords = useMemo(() => {
    return allWords.filter((word) => {
      const matchesSearch =
        searchQuery === "" ||
        word.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.relatedTerms.some((term) =>
          term.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory = !selectedCategory || word.categoryKey === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allWords, searchQuery, selectedCategory]);

  // Quick reference mode - just show the terms
  if (mode === "quick") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Golden Words Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {filteredWords.map((word, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWord(word)}
                className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
              >
                <div className="font-semibold text-sm">{word.term}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {word.definition}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Golden Words Guide
        </CardTitle>
        <CardDescription>
          Use precise mathematical vocabulary to communicate clearly
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for a term or vague word..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Tabs */}
        <Tabs
          value={selectedCategory || "all"}
          onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(categories).map(([key, category]) => (
              <TabsTrigger key={key} value={key}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory || "all"} className="mt-4">
            {filteredWords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookMarked className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No terms found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWords.map((word, idx) => (
                  <Card
                    key={idx}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedWord(word)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {word.term}
                            <Badge
                              variant="secondary"
                              className={
                                categoryColors[word.categoryKey as keyof typeof categoryColors] || ""
                              }
                            >
                              {word.categoryName}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {word.definition}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Detail View */}
        {selectedWord && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{selectedWord.term}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedWord(null)}>
                Close
              </Button>
            </div>

            {/* Definition */}
            <div>
              <h4 className="font-semibold mb-2">Definition</h4>
              <p className="text-muted-foreground">{selectedWord.definition}</p>
            </div>

            {/* Formal Definition */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                Formal Definition
              </h4>
              <p className="text-sm">{selectedWord.formalDefinition}</p>
            </div>

            {/* Examples */}
            <div>
              <h4 className="font-semibold mb-2">Examples</h4>
              <ul className="space-y-2">
                {selectedWord.examples.map((example, idx) => (
                  <li key={idx} className="bg-green-50 dark:bg-green-950 p-3 rounded-md text-sm border border-green-200 dark:border-green-800">
                    {example}
                  </li>
                ))}
              </ul>
            </div>

            {/* Common Misconceptions */}
            {selectedWord.commonMisconceptions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  Common Misconceptions
                </h4>
                <ul className="space-y-2">
                  {selectedWord.commonMisconceptions.map((misconception, idx) => (
                    <li
                      key={idx}
                      className="bg-amber-50 dark:bg-amber-950 p-3 rounded-md text-sm border border-amber-200 dark:border-amber-800"
                    >
                      {misconception}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Terms */}
            <div>
              <h4 className="font-semibold mb-2">Related Terms</h4>
              <div className="flex flex-wrap gap-2">
                {selectedWord.relatedTerms.map((term, idx) => (
                  <Badge key={idx} variant="outline" className="cursor-pointer">
                    {term}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Why It Matters */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                Why It Matters
              </h4>
              <p className="text-sm text-muted-foreground">
                Using the precise term "{selectedWord.term}" instead of vague language helps you:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Communicate clearly with teachers and peers</li>
                <li>Write accurate solutions on tests</li>
                <li>Think more precisely about mathematical concepts</li>
                <li>Understand textbooks and problem statements better</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground">
              AP Precalculus Unit {selectedWord.apUnit}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
