import Link from "next/link";
import { Brain, Sparkles, Target, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-12 py-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl">
        <div className="flex justify-center mb-4">
          <Brain className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">
          Master AP Precalculus
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered tutoring platform designed for students with dyslexia and ADHD
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/ai-tutor">Try AI Tutor</Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        <Card>
          <CardHeader>
            <Sparkles className="h-8 w-8 text-primary mb-2" />
            <CardTitle>AI Tutor</CardTitle>
            <CardDescription>
              Upload any problem and ask questions in natural language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Upload handwritten or printed problems</li>
              <li>• Socratic or explanation modes</li>
              <li>• Save and review sessions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Target className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Practice Tools</CardTitle>
            <CardDescription>
              Targeted drills for Q4 symbolic manipulation & more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Q4 symbolic drills (the "5-maker")</li>
              <li>• Unit circle practice</li>
              <li>• Daily 4-question warm-ups</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <BookOpen className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Interactive Lessons</CardTitle>
            <CardDescription>
              CRA-based instruction with multi-sensory learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Concrete-Representational-Abstract phases</li>
              <li>• Step-by-step solutions</li>
              <li>• Multiple solution paths</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Visual Tools</CardTitle>
            <CardDescription>
              Color-coded references and interactive visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Notation Translation Table</li>
              <li>• Unit Circle Visualizer (color families)</li>
              <li>• Transformation Explorer</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Brain className="h-8 w-8 text-primary mb-2" />
            <CardTitle>ADHD Support</CardTitle>
            <CardDescription>
              Executive function scaffolds and focus tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• S.O.S. Protocol checklist</li>
              <li>• Break reminders & timers</li>
              <li>• Minimize distractions mode</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Target className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Spaced Repetition</CardTitle>
            <CardDescription>
              Smart review scheduling for long-term mastery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Adaptive difficulty</li>
              <li>• Review queue management</li>
              <li>• Streak tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
