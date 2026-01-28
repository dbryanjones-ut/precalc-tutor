import Link from "next/link";
import { Brain, Sparkles, Target, BookOpen, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-16 py-8 md:py-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-4xl px-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Brain className="h-20 w-20 text-primary animate-pulse" />
            <div className="absolute inset-0 h-20 w-20 text-primary opacity-20 animate-ping" />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Master AP Precalculus
        </h1>
        <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          AI-powered tutoring platform designed for students with dyslexia and ADHD
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button asChild size="lg" className="text-lg h-14 px-8">
            <Link href="/dashboard">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg h-14 px-8">
            <Link href="/ai-tutor">
              <Sparkles className="mr-2 h-5 w-5" />
              Try AI Tutor
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl px-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">AI Tutor</CardTitle>
            <CardDescription className="text-base">
              Upload any problem and ask questions in natural language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>Upload handwritten or printed problems</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>Socratic or explanation modes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                <span>Save and review sessions</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Target className="h-7 w-7 text-orange-500" />
            </div>
            <CardTitle className="text-2xl">Practice Tools</CardTitle>
            <CardDescription className="text-base">
              Targeted drills for Q4 symbolic manipulation & more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-orange-500 mt-0.5">✓</span>
                <span>Q4 symbolic drills (the "5-maker")</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-500 mt-0.5">✓</span>
                <span>Unit circle practice</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-500 mt-0.5">✓</span>
                <span>Daily 4-question warm-ups</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Interactive Lessons</CardTitle>
            <CardDescription className="text-base">
              CRA-based instruction with multi-sensory learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Concrete-Representational-Abstract phases</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Step-by-step solutions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-0.5">✓</span>
                <span>Multiple solution paths</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Zap className="h-7 w-7 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Visual Tools</CardTitle>
            <CardDescription className="text-base">
              Color-coded references and interactive visualizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Notation Translation Table</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Unit Circle Visualizer (color families)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>Transformation Explorer</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Brain className="h-7 w-7 text-purple-500" />
            </div>
            <CardTitle className="text-2xl">ADHD Support</CardTitle>
            <CardDescription className="text-base">
              Executive function scaffolds and focus tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>S.O.S. Protocol checklist</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>Break reminders & timers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-purple-500 mt-0.5">✓</span>
                <span>Minimize distractions mode</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2">
          <CardHeader className="space-y-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Target className="h-7 w-7 text-yellow-500" />
            </div>
            <CardTitle className="text-2xl">Spaced Repetition</CardTitle>
            <CardDescription className="text-base">
              Smart review scheduling for long-term mastery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-0.5">✓</span>
                <span>Adaptive difficulty</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-0.5">✓</span>
                <span>Review queue management</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-0.5">✓</span>
                <span>Streak tracking</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
