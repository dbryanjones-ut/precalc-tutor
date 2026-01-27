"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MathRenderer } from "@/components/math/MathRenderer";
import { cn } from "@/lib/utils";
import { ArrowRight, RotateCcw, Lightbulb } from "lucide-react";

type FunctionFamily = "quadratic" | "absolute" | "radical" | "sine" | "cosine" | "exponential" | "log";

interface TransformationParams {
  a: number; // Vertical stretch/compress
  h: number; // Horizontal shift
  k: number; // Vertical shift
}

interface FunctionFamilyConfig {
  name: string;
  parent: string;
  parentLatex: string;
  transformed: (a: number, h: number, k: number) => string;
  transformedLatex: (a: number, h: number, k: number) => string;
  domain: string | ((h: number) => string);
  range: (a: number, k: number) => string;
}

const FUNCTION_FAMILIES: Record<FunctionFamily, FunctionFamilyConfig> = {
  quadratic: {
    name: "Quadratic",
    parent: "f(x) = x^2",
    parentLatex: "f(x) = x^2",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)})^2 ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)})^2 ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: "(-\\infty, \\infty)",
    range: (a: number, k: number) => a > 0 ? `[${k}, \\infty)` : `(-\\infty, ${k}]`,
  },
  absolute: {
    name: "Absolute Value",
    parent: "f(x) = |x|",
    parentLatex: "f(x) = |x|",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}|x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}| ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}|x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}| ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: "(-\\infty, \\infty)",
    range: (a: number, k: number) => a > 0 ? `[${k}, \\infty)` : `(-\\infty, ${k}]`,
  },
  radical: {
    name: "Square Root",
    parent: "f(x) = √x",
    parentLatex: "f(x) = \\sqrt{x}",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}√(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}\\sqrt{x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}} ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: (h: number) => `[${h}, \\infty)`,
    range: (a: number, k: number) => a > 0 ? `[${k}, \\infty)` : `(-\\infty, ${k}]`,
  },
  sine: {
    name: "Sine",
    parent: "f(x) = sin(x)",
    parentLatex: "f(x) = \\sin(x)",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}sin(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}\\sin(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: "(-\\infty, \\infty)",
    range: (a: number, k: number) => `[${k - Math.abs(a)}, ${k + Math.abs(a)}]`,
  },
  cosine: {
    name: "Cosine",
    parent: "f(x) = cos(x)",
    parentLatex: "f(x) = \\cos(x)",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}cos(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}\\cos(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: "(-\\infty, \\infty)",
    range: (a: number, k: number) => `[${k - Math.abs(a)}, ${k + Math.abs(a)}]`,
  },
  exponential: {
    name: "Exponential",
    parent: "f(x) = 2^x",
    parentLatex: "f(x) = 2^x",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}·2^(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""} \\cdot 2^{x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}} ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: "(-\\infty, \\infty)",
    range: (a: number, k: number) => a > 0 ? `(${k}, \\infty)` : `(-\\infty, ${k})`,
  },
  log: {
    name: "Logarithm",
    parent: "f(x) = log₂(x)",
    parentLatex: "f(x) = \\log_2(x)",
    transformed: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}log₂(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    transformedLatex: (a: number, h: number, k: number) =>
      `f(x) = ${a !== 1 ? a : ""}\\log_2(x ${h >= 0 ? "-" : "+"} ${Math.abs(h)}) ${k >= 0 ? "+" : "-"} ${Math.abs(k)}`,
    domain: (h: number) => `(${h}, \\infty)`,
    range: () => "(-\\infty, \\infty)",
  },
};

export function TransformationPractice() {
  const [family, setFamily] = useState<FunctionFamily>("quadratic");
  const [params, setParams] = useState<TransformationParams>({ a: 1, h: 0, k: 0 });
  const [showHints, setShowHints] = useState(false);
  const [mode, setMode] = useState<"explore" | "practice">("explore");

  const familyConfig = FUNCTION_FAMILIES[family];

  const resetTransformations = () => {
    setParams({ a: 1, h: 0, k: 0 });
  };

  const setRandomTransformation = () => {
    setParams({
      a: Math.floor(Math.random() * 5) - 2 || 1, // -2 to 2, excluding 0
      h: Math.floor(Math.random() * 9) - 4, // -4 to 4
      k: Math.floor(Math.random() * 9) - 4, // -4 to 4
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Function Transformation Practice</CardTitle>
          <CardDescription>
            Explore how parameters a, h, and k transform parent functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Function Family Selector */}
          <div className="space-y-2">
            <Label>Function Family</Label>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {(Object.keys(FUNCTION_FAMILIES) as FunctionFamily[]).map((f) => (
                <Button
                  key={f}
                  variant={family === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFamily(f);
                    resetTransformations();
                  }}
                  className="text-xs"
                >
                  {FUNCTION_FAMILIES[f].name}
                </Button>
              ))}
            </div>
          </div>

          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "explore" | "practice")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="practice">Practice</TabsTrigger>
            </TabsList>

            <TabsContent value="explore" className="space-y-6">
              {/* Transformation Display */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Parent Function */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Parent Function</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-background rounded-lg">
                      <MathRenderer
                        latex={familyConfig.parentLatex}
                        displayMode={true}
                      />
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <strong>Domain:</strong>{" "}
                        <MathRenderer
                          latex={
                            typeof familyConfig.domain === "function"
                              ? familyConfig.domain(0)
                              : familyConfig.domain
                          }
                          displayMode={false}
                        />
                      </div>
                      <div>
                        <strong>Range:</strong>{" "}
                        <MathRenderer
                          latex={familyConfig.range(1, 0)}
                          displayMode={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transformed Function */}
                <Card className="bg-primary/5 border-primary">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ArrowRight className="h-5 w-5" />
                      Transformed Function
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-background rounded-lg">
                      <MathRenderer
                        latex={familyConfig.transformedLatex(params.a, params.h, params.k)}
                        displayMode={true}
                      />
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div>
                        <strong>Domain:</strong>{" "}
                        <MathRenderer
                          latex={
                            typeof familyConfig.domain === "function"
                              ? familyConfig.domain(params.h)
                              : familyConfig.domain
                          }
                          displayMode={false}
                        />
                      </div>
                      <div>
                        <strong>Range:</strong>{" "}
                        <MathRenderer
                          latex={familyConfig.range(params.a, params.k)}
                          displayMode={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Parameter Controls */}
              <div className="space-y-6 p-6 bg-muted/50 rounded-lg">
                {/* Parameter a (Vertical Stretch/Compress) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Vertical Stretch/Compress: a = {params.a}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {params.a > 1 && "Stretch"}
                      {params.a === 1 && "No change"}
                      {params.a > 0 && params.a < 1 && "Compress"}
                      {params.a < 0 && "Reflect & " + (Math.abs(params.a) > 1 ? "Stretch" : "Compress")}
                    </span>
                  </div>
                  <Slider
                    value={[params.a]}
                    onValueChange={([value]) => setParams({ ...params, a: value })}
                    min={-3}
                    max={3}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Output geography: Affects y-values (multiply output by a)
                  </p>
                </div>

                {/* Parameter h (Horizontal Shift) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Horizontal Shift: h = {params.h}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {params.h > 0 && `Right ${params.h} units`}
                      {params.h === 0 && "No shift"}
                      {params.h < 0 && `Left ${Math.abs(params.h)} units`}
                    </span>
                  </div>
                  <Slider
                    value={[params.h]}
                    onValueChange={([value]) => setParams({ ...params, h: value })}
                    min={-5}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Input geography: Affects x-values (opposite direction!)
                  </p>
                </div>

                {/* Parameter k (Vertical Shift) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      Vertical Shift: k = {params.k}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {params.k > 0 && `Up ${params.k} units`}
                      {params.k === 0 && "No shift"}
                      {params.k < 0 && `Down ${Math.abs(params.k)} units`}
                    </span>
                  </div>
                  <Slider
                    value={[params.k]}
                    onValueChange={([value]) => setParams({ ...params, k: value })}
                    min={-5}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Output geography: Affects y-values (add k to output)
                  </p>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-2">
                  <Button onClick={resetTransformations} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button onClick={setRandomTransformation} variant="outline" size="sm">
                    Random
                  </Button>
                  <Button
                    onClick={() => setShowHints(!showHints)}
                    variant="outline"
                    size="sm"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {showHints ? "Hide" : "Show"} Hints
                  </Button>
                </div>
              </div>

              {/* Hints Panel */}
              {showHints && (
                <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                      Transformation Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                    <div>
                      <strong>Input vs Output Geography:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>
                          <strong>h</strong> (inside parentheses) affects INPUT (x-values) -
                          moves graph OPPOSITE direction
                        </li>
                        <li>
                          <strong>k</strong> (outside) affects OUTPUT (y-values) - moves
                          graph same direction
                        </li>
                        <li>
                          <strong>a</strong> (multiplier) affects OUTPUT - stretches/compresses
                          vertically
                        </li>
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded">
                      <strong>Memory Trick:</strong> Inside changes are opposite, outside
                      changes are intuitive!
                    </div>
                    <div>
                      <strong>Order of Operations:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Horizontal shift (h) - changes input first</li>
                        <li>Vertical stretch/compress (a) - changes output</li>
                        <li>Vertical shift (k) - final adjustment to output</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="practice" className="space-y-4">
              <Card>
                <CardContent className="py-6">
                  <div className="text-center space-y-4">
                    <p className="text-lg">
                      Practice problems coming soon! For now, use Explore mode to master
                      the concepts.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>In Practice mode, you'll:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Identify transformations from equations</li>
                        <li>Write transformed equations from descriptions</li>
                        <li>Match graphs to transformation parameters</li>
                        <li>Determine domain and range after transformations</li>
                      </ul>
                    </div>
                    <Button onClick={() => setMode("explore")} variant="outline">
                      Back to Explore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Reference */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <strong className="text-primary">General Form:</strong>
                  <div className="mt-1">
                    <MathRenderer
                      latex="f(x) = a \cdot g(x - h) + k"
                      displayMode={true}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <strong>a:</strong> Vertical stretch (|a| &gt; 1) or compress (0 &lt;
                    |a| &lt; 1)
                  </div>
                  <div>
                    <strong>a &lt; 0:</strong> Reflection over x-axis
                  </div>
                  <div>
                    <strong>h:</strong> Horizontal shift (opposite sign!)
                  </div>
                  <div>
                    <strong>k:</strong> Vertical shift (same sign)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
