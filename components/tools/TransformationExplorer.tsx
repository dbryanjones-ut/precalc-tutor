"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MathRenderer } from "@/components/math/MathRenderer";
import { RotateCcw, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransformationExplorerProps {
  className?: string;
}

type FunctionFamily = "linear" | "quadratic" | "cubic" | "sqrt" | "abs" | "sin" | "cos" | "exp" | "log";

const FUNCTION_DEFINITIONS: Record<
  FunctionFamily,
  {
    name: string;
    latex: string;
    fn: (x: number) => number;
    domain: [number, number];
  }
> = {
  linear: {
    name: "Linear",
    latex: "f(x) = x",
    fn: (x) => x,
    domain: [-10, 10],
  },
  quadratic: {
    name: "Quadratic",
    latex: "f(x) = x^2",
    fn: (x) => x * x,
    domain: [-5, 5],
  },
  cubic: {
    name: "Cubic",
    latex: "f(x) = x^3",
    fn: (x) => x * x * x,
    domain: [-3, 3],
  },
  sqrt: {
    name: "Square Root",
    latex: "f(x) = \\sqrt{x}",
    fn: (x) => Math.sqrt(x),
    domain: [0, 10],
  },
  abs: {
    name: "Absolute Value",
    latex: "f(x) = |x|",
    fn: (x) => Math.abs(x),
    domain: [-10, 10],
  },
  sin: {
    name: "Sine",
    latex: "f(x) = \\sin(x)",
    fn: (x) => Math.sin(x),
    domain: [-2 * Math.PI, 2 * Math.PI],
  },
  cos: {
    name: "Cosine",
    latex: "f(x) = \\cos(x)",
    fn: (x) => Math.cos(x),
    domain: [-2 * Math.PI, 2 * Math.PI],
  },
  exp: {
    name: "Exponential",
    latex: "f(x) = e^x",
    fn: (x) => Math.exp(x),
    domain: [-3, 3],
  },
  log: {
    name: "Natural Log",
    latex: "f(x) = \\ln(x)",
    fn: (x) => Math.log(x),
    domain: [0.1, 10],
  },
};

export function TransformationExplorer({ className = "" }: TransformationExplorerProps) {
  const [functionFamily, setFunctionFamily] = useState<FunctionFamily>("quadratic");
  const [verticalStretch, setVerticalStretch] = useState(1); // a
  const [horizontalShift, setHorizontalShift] = useState(0); // h
  const [verticalShift, setVerticalShift] = useState(0); // k

  const parentFunction = FUNCTION_DEFINITIONS[functionFamily];

  // Generate transformed function: g(x) = a * f(x - h) + k
  const transformedFunction = useMemo(() => {
    const a = verticalStretch;
    const h = horizontalShift;
    const k = verticalShift;

    return {
      fn: (x: number) => a * parentFunction.fn(x - h) + k,
      latex: (() => {
        let latex = "";

        // Vertical stretch/compress
        if (a !== 1) {
          latex += `${a}`;
        }

        // Base function with horizontal shift
        let baseFunc = parentFunction.latex.replace("f(x) = ", "");
        if (h !== 0) {
          // Replace x with (x - h) or (x + h)
          if (baseFunc.includes("x")) {
            const shift = h > 0 ? `x - ${h}` : `x + ${Math.abs(h)}`;
            baseFunc = baseFunc.replace(/x/g, `(${shift})`);
          }
        }

        latex += baseFunc;

        // Vertical shift
        if (k !== 0) {
          latex += k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`;
        }

        return `g(x) = ${latex}`;
      })(),
    };
  }, [functionFamily, verticalStretch, horizontalShift, verticalShift, parentFunction]);

  const reset = () => {
    setVerticalStretch(1);
    setHorizontalShift(0);
    setVerticalShift(0);
  };

  // Generate points for plotting
  const generatePoints = (
    fn: (x: number) => number,
    domain: [number, number],
    numPoints: number = 100
  ) => {
    const points: { x: number; y: number }[] = [];
    const [min, max] = domain;
    const step = (max - min) / numPoints;

    for (let i = 0; i <= numPoints; i++) {
      const x = min + i * step;
      const y = fn(x);
      if (isFinite(y)) {
        points.push({ x, y });
      }
    }

    return points;
  };

  const parentPoints = useMemo(
    () => generatePoints(parentFunction.fn, parentFunction.domain),
    [parentFunction]
  );

  const transformedPoints = useMemo(
    () => generatePoints(transformedFunction.fn, parentFunction.domain),
    [transformedFunction, parentFunction]
  );

  // SVG viewBox calculation
  const getViewBox = () => {
    const [xMin, xMax] = parentFunction.domain;
    const padding = 2;

    // Calculate y range from both functions
    let yMin = Infinity;
    let yMax = -Infinity;

    [...parentPoints, ...transformedPoints].forEach(({ y }) => {
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    });

    yMin -= padding;
    yMax += padding;

    return { xMin: xMin - padding, xMax: xMax + padding, yMin, yMax };
  };

  const viewBox = getViewBox();
  const width = viewBox.xMax - viewBox.xMin;
  const height = viewBox.yMax - viewBox.yMin;

  // Convert data coordinates to SVG coordinates
  const toSVG = (x: number, y: number) => ({
    x: ((x - viewBox.xMin) / width) * 500,
    y: 400 - ((y - viewBox.yMin) / height) * 400,
  });

  const pointsToPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const svgPoints = points.map((p) => toSVG(p.x, p.y));
    return svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Transformation Explorer</CardTitle>
        <CardDescription>
          Explore function transformations with real-time visualization
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Function Family Selector */}
        <div>
          <Label>Parent Function</Label>
          <Select value={functionFamily} onValueChange={(v) => setFunctionFamily(v as FunctionFamily)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FUNCTION_DEFINITIONS).map(([key, def]) => (
                <SelectItem key={key} value={key}>
                  {def.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Equations Display */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Parent Function</div>
            <MathRenderer latex={parentFunction.latex} displayMode={false} className="text-lg" />
          </div>
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Transformed Function</div>
            <MathRenderer latex={transformedFunction.latex} displayMode={false} className="text-lg" />
          </div>
        </div>

        {/* Side-by-side graphs */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Parent Function Graph */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Parent Function</h3>
            <svg
              viewBox="0 0 500 400"
              className="w-full border rounded-lg bg-background"
            >
              {/* Grid */}
              <line
                x1={toSVG(0, viewBox.yMin).x}
                y1={0}
                x2={toSVG(0, viewBox.yMax).x}
                y2={400}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1={0}
                y1={toSVG(viewBox.xMin, 0).y}
                x2={500}
                y2={toSVG(viewBox.xMax, 0).y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Parent function curve */}
              <path
                d={pointsToPath(parentPoints)}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3"
              />
            </svg>
          </div>

          {/* Transformed Function Graph */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Transformed Function</h3>
            <svg
              viewBox="0 0 500 400"
              className="w-full border rounded-lg bg-background"
            >
              {/* Grid */}
              <line
                x1={toSVG(0, viewBox.yMin).x}
                y1={0}
                x2={toSVG(0, viewBox.yMax).x}
                y2={400}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />
              <line
                x1={0}
                y1={toSVG(viewBox.xMin, 0).y}
                x2={500}
                y2={toSVG(viewBox.xMax, 0).y}
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Parent function (faded) */}
              <path
                d={pointsToPath(parentPoints)}
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2"
                opacity="0.3"
                strokeDasharray="5,5"
              />

              {/* Transformed function curve */}
              <path
                d={pointsToPath(transformedPoints)}
                fill="none"
                stroke="#10B981"
                strokeWidth="3"
              />
            </svg>
          </div>
        </div>

        {/* Transformation Controls */}
        <div className="space-y-6 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Transformation Parameters</h3>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Vertical Stretch/Compress (a) - OUTSIDE/OUTPUT */}
          <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white">OUTPUT</Badge>
                Vertical Stretch (a)
              </Label>
              <span className="text-sm font-mono">{verticalStretch.toFixed(2)}</span>
            </div>
            <Slider
              value={[verticalStretch]}
              onValueChange={(v) => setVerticalStretch(v[0])}
              min={-3}
              max={3}
              step={0.1}
            />
            <div className="text-xs text-muted-foreground">
              <Info className="inline h-3 w-3 mr-1" />
              Multiplies the output (y-value). |a| &gt; 1 stretches, 0 &lt; |a| &lt; 1 compresses, a &lt; 0 reflects.
            </div>
          </div>

          {/* Horizontal Shift (h) - INSIDE/INPUT */}
          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">INPUT</Badge>
                Horizontal Shift (h)
              </Label>
              <span className="text-sm font-mono">{horizontalShift.toFixed(2)}</span>
            </div>
            <Slider
              value={[horizontalShift]}
              onValueChange={(v) => setHorizontalShift(v[0])}
              min={-5}
              max={5}
              step={0.1}
            />
            <div className="text-xs text-muted-foreground">
              <Info className="inline h-3 w-3 mr-1" />
              Affects input (x-value). Positive h shifts RIGHT, negative shifts LEFT (opposite of sign!).
            </div>
          </div>

          {/* Vertical Shift (k) - OUTSIDE/OUTPUT */}
          <div className="space-y-2 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white">OUTPUT</Badge>
                Vertical Shift (k)
              </Label>
              <span className="text-sm font-mono">{verticalShift.toFixed(2)}</span>
            </div>
            <Slider
              value={[verticalShift]}
              onValueChange={(v) => setVerticalShift(v[0])}
              min={-5}
              max={5}
              step={0.1}
            />
            <div className="text-xs text-muted-foreground">
              <Info className="inline h-3 w-3 mr-1" />
              Adds to the output (y-value). Positive k shifts UP, negative shifts DOWN.
            </div>
          </div>
        </div>

        {/* Input/Output Geography Explanation */}
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-semibold">Understanding Input vs. Output Transformations</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-sm mb-1 text-blue-700 dark:text-blue-300">
                INSIDE = INPUT (x-axis)
              </div>
              <div className="text-xs text-muted-foreground">
                Changes to x happen INSIDE the function. They affect the x-axis (horizontal) and often work OPPOSITE to intuition.
              </div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="font-semibold text-sm mb-1 text-red-700 dark:text-red-300">
                OUTSIDE = OUTPUT (y-axis)
              </div>
              <div className="text-xs text-muted-foreground">
                Changes to the whole function happen OUTSIDE. They affect the y-axis (vertical) and work as expected.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
