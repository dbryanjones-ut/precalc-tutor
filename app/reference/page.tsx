"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "@/components/math/MathRenderer";
import {
  Search,
  BookText,
  Calculator,
  CircleDot,
  Flame,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

interface NotationEntry {
  notation: string;
  meaning: string;
  commonMistake?: string;
  example?: string;
}

interface GoldenWord {
  term: string;
  definition: string;
  category: string;
  example?: string;
}

const notationTable: NotationEntry[] = [
  {
    notation: "f^{-1}(x)",
    meaning: "Inverse function (NOT reciprocal)",
    commonMistake: "f^{-1}(x) ≠ \\frac{1}{f(x)}",
    example: "If f(x) = 2x, then f^{-1}(x) = \\frac{x}{2}",
  },
  {
    notation: "\\sin^2(x)",
    meaning: "(sin(x))^2 (NOT sin(x^2))",
    commonMistake: "\\sin^2(x) ≠ \\sin(x^2)",
    example: "\\sin^2(\\frac{\\pi}{4}) = (\\frac{\\sqrt{2}}{2})^2 = \\frac{1}{2}",
  },
  {
    notation: "f(x+a)",
    meaning: "Horizontal shift LEFT by a units",
    commonMistake: "Plus shifts LEFT, not right",
    example: "f(x+3) shifts the graph 3 units left",
  },
  {
    notation: "f(x)+a",
    meaning: "Vertical shift UP by a units",
    example: "f(x)+5 shifts the graph 5 units up",
  },
  {
    notation: "a \\cdot f(x)",
    meaning: "Vertical stretch by factor |a|",
    commonMistake: "Affects OUTPUT (y-values), not input",
    example: "2f(x) doubles all y-values",
  },
  {
    notation: "f(ax)",
    meaning: "Horizontal compression by factor 1/a",
    commonMistake: "f(2x) compresses by 1/2, NOT stretches by 2",
    example: "f(2x) makes the graph half as wide",
  },
  {
    notation: "\\log_b(x)",
    meaning: "Logarithm base b: 'b to what power gives x?'",
    example: "\\log_2(8) = 3 because 2^3 = 8",
  },
  {
    notation: "\\ln(x)",
    meaning: "Natural logarithm (base e)",
    example: "\\ln(e^3) = 3",
  },
  {
    notation: "|a|",
    meaning: "Absolute value (distance from zero)",
    example: "|-5| = 5 and |5| = 5",
  },
  {
    notation: "[a, b]",
    meaning: "Closed interval: includes endpoints a and b",
    example: "[0, 5] includes 0 and 5",
  },
  {
    notation: "(a, b)",
    meaning: "Open interval: excludes endpoints a and b",
    example: "(0, 5) excludes 0 and 5",
  },
];

const goldenWords: GoldenWord[] = [
  {
    term: "Increasing",
    definition: "A function is increasing when y-values get larger as x-values increase",
    category: "Function Behavior",
    example: "f is increasing on [1, 5]",
  },
  {
    term: "Decreasing",
    definition: "A function is decreasing when y-values get smaller as x-values increase",
    category: "Function Behavior",
    example: "f is decreasing on [-2, 0]",
  },
  {
    term: "Concave Up",
    definition: "Graph curves upward like a smile (positive second derivative)",
    category: "Function Behavior",
    example: "Parabola y = x² is concave up everywhere",
  },
  {
    term: "Concave Down",
    definition: "Graph curves downward like a frown (negative second derivative)",
    category: "Function Behavior",
    example: "y = -x² is concave down everywhere",
  },
  {
    term: "Asymptote",
    definition: "A line that a graph approaches but never touches",
    category: "Graphs",
    example: "y = 1/x has vertical asymptote at x = 0",
  },
  {
    term: "Domain",
    definition: "All possible input (x) values for a function",
    category: "Functions",
    example: "Domain of √x is [0, ∞)",
  },
  {
    term: "Range",
    definition: "All possible output (y) values for a function",
    category: "Functions",
    example: "Range of x² is [0, ∞)",
  },
  {
    term: "Period",
    definition: "The distance after which a function repeats",
    category: "Trigonometry",
    example: "sin(x) has period 2π",
  },
  {
    term: "Amplitude",
    definition: "Half the distance between max and min values",
    category: "Trigonometry",
    example: "3sin(x) has amplitude 3",
  },
  {
    term: "End Behavior",
    definition: "How a function behaves as x approaches ±∞",
    category: "Polynomials",
    example: "As x → ∞, x³ → ∞",
  },
];

const unitCircleValues = [
  { angle: "0", degrees: "0°", x: "1", y: "0", color: "text-purple-600" },
  { angle: "\\frac{\\pi}{6}", degrees: "30°", x: "\\frac{\\sqrt{3}}{2}", y: "\\frac{1}{2}", color: "text-blue-600" },
  { angle: "\\frac{\\pi}{4}", degrees: "45°", x: "\\frac{\\sqrt{2}}{2}", y: "\\frac{\\sqrt{2}}{2}", color: "text-red-600" },
  { angle: "\\frac{\\pi}{3}", degrees: "60°", x: "\\frac{1}{2}", y: "\\frac{\\sqrt{3}}{2}", color: "text-green-600" },
  { angle: "\\frac{\\pi}{2}", degrees: "90°", x: "0", y: "1", color: "text-purple-600" },
];

const commonMistakes = [
  {
    mistake: "Distributing exponents incorrectly",
    wrong: "(a + b)^2 = a^2 + b^2",
    correct: "(a + b)^2 = a^2 + 2ab + b^2",
  },
  {
    mistake: "Confusing inverse and reciprocal",
    wrong: "f^{-1}(x) = \\frac{1}{f(x)}",
    correct: "f^{-1}(x) \\text{ undoes } f(x)",
  },
  {
    mistake: "Mixing up horizontal shifts",
    wrong: "f(x + 3) \\text{ shifts right 3}",
    correct: "f(x + 3) \\text{ shifts LEFT 3}",
  },
  {
    mistake: "Forgetting domain restrictions",
    wrong: "\\sqrt{x - 4} \\text{ works for all } x",
    correct: "\\sqrt{x - 4} \\text{ needs } x \\geq 4",
  },
  {
    mistake: "Canceling terms incorrectly",
    wrong: "\\frac{x + 3}{x} = 3",
    correct: "\\frac{x + 3}{x} = 1 + \\frac{3}{x}",
  },
];

export default function ReferencePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotations = notationTable.filter(
    (entry) =>
      entry.notation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWords = goldenWords.filter(
    (word) =>
      word.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reference Materials</h1>
        <p className="text-muted-foreground">
          Quick reference for notation, terminology, and common mistakes
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notation, terms, or concepts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="notation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notation">
            <Calculator className="h-4 w-4 mr-2" />
            Notation
          </TabsTrigger>
          <TabsTrigger value="golden-words">
            <Flame className="h-4 w-4 mr-2" />
            Golden Words
          </TabsTrigger>
          <TabsTrigger value="unit-circle">
            <CircleDot className="h-4 w-4 mr-2" />
            Unit Circle
          </TabsTrigger>
          <TabsTrigger value="mistakes">
            <AlertCircle className="h-4 w-4 mr-2" />
            Mistakes
          </TabsTrigger>
        </TabsList>

        {/* Notation Translation Table */}
        <TabsContent value="notation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notation Translation Table</CardTitle>
              <CardDescription>
                Decode mathematical notation and avoid common misinterpretations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredNotations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results found for "{searchTerm}"
                </p>
              ) : (
                filteredNotations.map((entry, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Notation
                        </p>
                        <div className="text-lg">
                          <MathRenderer latex={entry.notation} displayMode={false} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Meaning
                        </p>
                        <p className="text-sm">{entry.meaning}</p>
                      </div>
                    </div>
                    {entry.commonMistake && (
                      <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                              Common Mistake
                            </p>
                            <div className="text-sm text-red-800 dark:text-red-200">
                              <MathRenderer latex={entry.commonMistake} displayMode={false} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {entry.example && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Example
                            </p>
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <MathRenderer latex={entry.example} displayMode={false} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Golden Words */}
        <TabsContent value="golden-words" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Golden Words</CardTitle>
              <CardDescription>
                Precise mathematical vocabulary for clear communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredWords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results found for "{searchTerm}"
                </p>
              ) : (
                filteredWords.map((word, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{word.term}</h3>
                      <Badge variant="outline">{word.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{word.definition}</p>
                    {word.example && (
                      <div className="p-2 bg-muted rounded text-sm">
                        <span className="font-semibold">Example:</span> {word.example}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unit Circle */}
        <TabsContent value="unit-circle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unit Circle Quick Reference</CardTitle>
              <CardDescription>
                Essential angles and their coordinates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2 pb-2 border-b font-semibold text-sm">
                  <div>Angle (radians)</div>
                  <div>Degrees</div>
                  <div>cos(θ)</div>
                  <div>sin(θ)</div>
                </div>
                {unitCircleValues.map((value, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50 ${value.color}`}
                  >
                    <div>
                      <MathRenderer latex={value.angle} displayMode={false} />
                    </div>
                    <div className="text-sm">{value.degrees}</div>
                    <div>
                      <MathRenderer latex={value.x} displayMode={false} />
                    </div>
                    <div>
                      <MathRenderer latex={value.y} displayMode={false} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Memory Aids
                </h4>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">π/6 (Blue Family):</span>
                    <span>√3/2, 1/2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600">π/4 (Red Family):</span>
                    <span>√2/2, √2/2 (both the same!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">π/3 (Green Family):</span>
                    <span>1/2, √3/2 (opposite of π/6)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Common Mistakes */}
        <TabsContent value="mistakes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Mistakes to Avoid</CardTitle>
              <CardDescription>
                Learn from these frequent errors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {commonMistakes.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950"
                >
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">
                    {item.mistake}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded">
                      <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-2">
                        ❌ WRONG
                      </p>
                      <MathRenderer latex={item.wrong} displayMode={false} />
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded">
                      <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2">
                        ✓ CORRECT
                      </p>
                      <MathRenderer latex={item.correct} displayMode={false} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
