"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UnitCircleVisualizer } from "@/components/tools/UnitCircleVisualizer";
import { TransformationExplorer } from "@/components/tools/TransformationExplorer";
import { SOSProtocolChecklist } from "@/components/tools/SOSProtocolChecklist";
import { NotationTranslator } from "@/components/reference/NotationTranslator";
import { GoldenWordsGuide } from "@/components/reference/GoldenWordsGuide";
import {
  Circle,
  TrendingUp,
  CheckSquare,
  BookOpen,
  Star,
  ArrowRight,
} from "lucide-react";

type ToolType =
  | "unit-circle"
  | "transformations"
  | "sos-protocol"
  | "notation"
  | "golden-words"
  | null;

const TOOLS = [
  {
    id: "unit-circle" as ToolType,
    name: "Unit Circle Visualizer",
    description: "Interactive unit circle with color-coded angle families and trig values",
    icon: Circle,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
    features: [
      "Hover to see sin/cos/tan values",
      "Click to lock values",
      "Color-coded angle families",
      "Degrees and radians",
    ],
  },
  {
    id: "transformations" as ToolType,
    name: "Transformation Explorer",
    description: "Visualize function transformations with side-by-side comparison",
    icon: TrendingUp,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
    features: [
      "Multiple function families",
      "Real-time parameter adjustment",
      "Input vs. Output explanations",
      "Visual before/after graphs",
    ],
  },
  {
    id: "sos-protocol" as ToolType,
    name: "SOS Protocol Checklist",
    description: "Step-by-step problem-solving framework for ADHD-friendly learning",
    icon: CheckSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
    features: [
      "SCAN, ORGANIZE, SOLVE phases",
      "Progress tracking",
      "Tips for each step",
      "Collapsible for focus",
    ],
  },
  {
    id: "notation" as ToolType,
    name: "Notation Translator",
    description: "Search and understand mathematical notation with examples",
    icon: BookOpen,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
    features: [
      "Searchable notation database",
      "Common mistakes highlighted",
      "LaTeX copy button",
      "Related concepts",
    ],
  },
  {
    id: "golden-words" as ToolType,
    name: "Golden Words Guide",
    description: "Master precise mathematical vocabulary to communicate clearly",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
    features: [
      "Vague term → Golden word mapping",
      "Formal definitions",
      "Common misconceptions",
      "Context-aware examples",
    ],
  },
];

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<ToolType>(null);

  const renderTool = (toolId: ToolType) => {
    switch (toolId) {
      case "unit-circle":
        return <UnitCircleVisualizer />;
      case "transformations":
        return <TransformationExplorer />;
      case "sos-protocol":
        return <SOSProtocolChecklist mode="inline" />;
      case "notation":
        return <NotationTranslator mode="sidebar" />;
      case "golden-words":
        return <GoldenWordsGuide mode="full" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Interactive Learning Tools</h1>
        <p className="text-muted-foreground text-lg">
          Visual tools and frameworks to help you understand precalculus concepts deeply
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card
              key={tool.id}
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => setSelectedTool(tool.id)}
            >
              <CardHeader>
                <div
                  className={`w-12 h-12 rounded-lg ${tool.bgColor} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <CardTitle className="flex items-center justify-between">
                  {tool.name}
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className={`mt-1 ${tool.color}`}>•</span>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tool Dialog */}
      <Dialog open={selectedTool !== null} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTool &&
                (() => {
                  const tool = TOOLS.find((t) => t.id === selectedTool);
                  if (!tool) return null;
                  const Icon = tool.icon;
                  return (
                    <>
                      <div className={`w-10 h-10 rounded-lg ${tool.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      {tool.name}
                    </>
                  );
                })()}
            </DialogTitle>
            <DialogDescription>
              {TOOLS.find((t) => t.id === selectedTool)?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">{renderTool(selectedTool)}</div>
        </DialogContent>
      </Dialog>

      {/* Quick Access Section */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New to these tools?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Start with the <strong>SOS Protocol Checklist</strong> to build a systematic
                problem-solving habit. Then explore the visual tools as you encounter different
                topics.
              </p>
              <Button onClick={() => setSelectedTool("sos-protocol")} className="w-full">
                Start with SOS Protocol
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ADHD-Friendly Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>All tools are collapsible to minimize distractions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Visual feedback and progress indicators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Step-by-step guidance with tips at each stage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Keyboard shortcuts for quick navigation</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
