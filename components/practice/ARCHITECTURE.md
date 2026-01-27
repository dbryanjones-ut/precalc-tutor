# Practice Components - Architecture

## Component Hierarchy

```
app/practice/page.tsx (Practice Hub)
├── Stats Overview Cards
├── Daily Routines Section
│   ├── DailyWarmup
│   │   ├── Timer Display
│   │   ├── Progress Indicator
│   │   ├── Question Navigation
│   │   ├── Answer Input
│   │   └── Results Summary
│   └── Q4SymbolicDrill
│       ├── Timer Display
│       ├── Progress Bar
│       ├── Problem Display (MathRenderer)
│       ├── Answer Input
│       ├── Streak Tracker
│       └── Performance Analytics
└── Focused Practice Section
    ├── UnitCirclePractice
    │   ├── Interactive SVG Circle
    │   ├── Family Filters
    │   ├── Click-to-Reveal Logic
    │   ├── Quiz Mode
    │   └── Reference Table
    └── TransformationPractice
        ├── Function Family Selector
        ├── Parameter Sliders
        ├── Parent/Transformed Display
        ├── Domain/Range Display
        └── Hints Panel
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Action                             │
│              (Answer question, start practice)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Practice Component                            │
│        (DailyWarmup, Q4Drill, UnitCircle, etc.)                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Local State  │  │    Timer     │  │  UI State    │         │
│  │  - answers   │  │ - elapsed    │  │  - current   │         │
│  │  - current   │  │ - startTime  │  │  - revealed  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Validation Layer                              │
│                                                                   │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │  LatexValidator    │────────▶│  AnswerValidator   │         │
│  │  - Security check  │         │  - Symbolic equiv  │         │
│  │  - Syntax check    │         │  - Numeric check   │         │
│  └────────────────────┘         │  - Multiple choice │         │
│                                  └────────────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Feedback & Results                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Visual     │  │   Audio      │  │   Haptic     │         │
│  │  - Color     │  │  (optional)  │  │  (mobile)    │         │
│  │  - Icons     │  │              │  │              │         │
│  │  - Animation │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Progress Store                              │
│                   (Zustand + localStorage)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  State:                                                   │  │
│  │  - warmups[]         - q4Sprints[]                       │  │
│  │  - currentStreak     - totalProblemsAttempted            │  │
│  │  - units{}           - skills{}                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Actions:                                                 │  │
│  │  - addWarmup()       - addQ4Sprint()                     │  │
│  │  - updateStreak()    - updateProblemResult()             │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                           │
│                    (localStorage/IndexedDB)                      │
│                                                                   │
│  Key: "precalc-progress-v1"                                     │
│  Format: JSON                                                    │
│  Size: ~50KB typical                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Component Dependencies

```
┌───────────────────────────────────────────────────────────┐
│                      Practice Components                   │
└───────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┬──────────────┐
           │               │               │              │
           ▼               ▼               ▼              ▼
┌──────────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   UI Components  │  │  Types   │  │  Stores  │  │   Lib    │
└──────────────────┘  └──────────┘  └──────────┘  └──────────┘
│                     │            │             │
├─ Button            ├─ Problem   ├─ Progress   ├─ AnswerValidator
├─ Card              ├─ Progress  │             ├─ LatexValidator
├─ Input             └─ Settings  │             ├─ timer utils
├─ Progress                        │             └─ MathRenderer
├─ Slider                          │
├─ Tabs                            │
└─ Label                           │

         ┌─────────────────────────┘
         │
         ▼
┌──────────────────┐
│   External Deps   │
└──────────────────┘
│
├─ react
├─ zustand
├─ mathjs
├─ katex
├─ lucide-react
└─ tailwindcss
```

## State Management

### Local State (Component Level)

```typescript
// Managed within each component
interface LocalState {
  // UI state
  currentIndex: number;
  isComplete: boolean;
  showHints: boolean;

  // Input state
  answer: string;
  selectedChoice: number | null;

  // Timer state
  timeElapsed: number;
  startTime: number;

  // Feedback state
  feedback: FeedbackMessage | null;
  isCorrect: boolean | null;
}
```

### Global State (Store Level)

```typescript
// useProgressStore (Zustand)
interface GlobalState {
  // User progress
  progress: UserProgress;

  // Actions
  updateProblemResult: (id, correct, time) => void;
  updateStreak: () => void;
  addWarmup: (problems, scores, time) => void;
  addQ4Sprint: (solved, total, avgTime, accuracy) => void;
}
```

## Event Flow

### Daily Warmup Flow

```
1. Component Mount
   └─ Load 4 problems from props
   └─ Initialize timer
   └─ Set currentIndex = 0

2. User Interaction Loop
   ├─ User enters answer
   ├─ User clicks Next (or Previous)
   ├─ Store answer in local state
   └─ Advance to next problem

3. Submission
   ├─ User clicks "Finish Warmup"
   ├─ Grade all 4 answers
   │  └─ AnswerValidator.validate() for each
   ├─ Calculate stats (time, accuracy)
   └─ Show results screen

4. Completion
   ├─ Call onComplete callback
   ├─ Update progress store
   │  ├─ addWarmup()
   │  └─ updateStreak()
   └─ Save to localStorage
```

### Q4 Sprint Flow

```
1. Component Mount
   └─ Load 10 problems
   └─ Initialize timer
   └─ Set currentIndex = 0

2. Problem Attempt Loop (10x)
   ├─ Display problem
   ├─ User enters answer
   ├─ User submits
   ├─ Validate answer
   │  └─ AnswerValidator.validate(requireSimplified: true)
   ├─ Show instant feedback (1.5s)
   ├─ Record result
   │  └─ { problemId, correct, timeSeconds }
   ├─ Update streak
   └─ Auto-advance to next problem

3. Sprint Complete
   ├─ Calculate final stats
   │  ├─ Total correct
   │  ├─ Accuracy
   │  ├─ Average time
   │  └─ Best streak
   ├─ Show results screen
   ├─ Update progress store
   │  └─ addQ4Sprint()
   └─ Call onComplete callback
```

### Unit Circle Flow

```
Explore Mode:
1. Display interactive circle
2. User clicks point
   └─ Toggle reveal state for that angle
3. Family filters
   └─ Show/hide points by family
4. Show all / Reset
   └─ Bulk state changes

Quiz Mode:
1. Generate 10 random questions
2. For each question:
   ├─ Display angle/value to find
   ├─ Show 4 multiple choice options
   ├─ User selects answer
   ├─ Validate immediately
   └─ Track score
3. Quiz complete
   └─ Show results (score, time, accuracy)
```

## Rendering Pipeline

```
Problem Data (LaTeX strings)
        │
        ▼
┌────────────────┐
│ LatexValidator │──── Security Check
└────────┬───────┘
         │ (sanitized LaTeX)
         ▼
┌────────────────┐
│  KaTeX Render  │──── HTML string
└────────┬───────┘
         │
         ▼
┌────────────────┐
│  MathRenderer  │──── React component
└────────┬───────┘
         │
         ▼
    DOM Output
```

## Performance Optimizations

### Memoization Strategy

```typescript
// Expensive calculations memoized
const processedLatex = useMemo(() => {
  // LaTeX processing
}, [latex, colorHighlights]);

const ariaLabel = useMemo(() => {
  // Accessibility label generation
}, [latex]);

const validation = useMemo(() => {
  // Answer validation
}, [answer, correctAnswer]);
```

### Timer Optimization

```typescript
// Single interval per component
useEffect(() => {
  if (isComplete) return;

  const interval = setInterval(() => {
    setTimeElapsed(/* update */);
  }, 1000); // 1 second precision sufficient

  return () => clearInterval(interval); // Cleanup
}, [isComplete]);
```

### Lazy Loading

```typescript
// Components loaded only when activated
if (activeMode === "warmup") {
  return <DailyWarmup ... />;
}
if (activeMode === "q4-sprint") {
  return <Q4SymbolicDrill ... />;
}
// etc.
```

## Security Architecture

```
User Input
    │
    ▼
┌─────────────────┐
│ Input Validation│
│  - Length check │
│  - Type check   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LaTeX Validation│
│  - Forbidden cmds│
│  - XSS patterns  │
│  - Balance check│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sanitization   │
│  - Remove HTML  │
│  - Remove URIs  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Safe Rendering │
│  trust: false   │
│  throwOnError   │
└─────────────────┘
```

## Accessibility Architecture

```
┌─────────────────────────────────────┐
│          Semantic HTML              │
│  - <button> for actions             │
│  - <form> for submissions           │
│  - <label> for inputs               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│          ARIA Attributes            │
│  - role="alert" for feedback        │
│  - aria-label for math              │
│  - aria-invalid for errors          │
│  - aria-live for updates            │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│       Keyboard Navigation           │
│  - Tab order logical                │
│  - Enter to submit                  │
│  - Escape to cancel                 │
│  - Arrow keys for nav               │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         Visual Indicators           │
│  - Focus rings visible              │
│  - High contrast mode               │
│  - Color + icon + text              │
└─────────────────────────────────────┘
```

## Testing Strategy

```
Unit Tests
├─ Timer utilities
├─ Answer validation logic
├─ LaTeX validation
└─ State transformations

Integration Tests
├─ Component rendering
├─ User interactions
├─ State updates
└─ Store integration

E2E Tests
├─ Complete warmup flow
├─ Complete sprint flow
├─ Navigation between modes
└─ Progress persistence

Performance Tests
├─ Render time < 100ms
├─ Answer validation < 500ms
├─ Bundle size analysis
└─ Memory leak detection
```

## Deployment Architecture

```
┌─────────────────────────────────────┐
│         Next.js App Router          │
│                                     │
│  /practice ──────┐                 │
│  /practice/warmup│                 │
│  /practice/q4    │  SSR/SSG        │
│  /practice/unit  │                 │
└──────────────────┼─────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      Client-Side Components         │
│         ("use client")              │
│                                     │
│  - Interactive practice tools       │
│  - Real-time validation             │
│  - Timer management                 │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│         Browser Storage             │
│                                     │
│  localStorage                       │
│  - Progress data                    │
│  - Settings                         │
│                                     │
│  sessionStorage                     │
│  - Current practice session         │
│  - Temporary state                  │
└─────────────────────────────────────┘
```

This architecture enables:
- **Separation of concerns** - Each component has a clear responsibility
- **Reusability** - Components can be used independently
- **Type safety** - Full TypeScript coverage
- **Performance** - Optimized rendering and state management
- **Security** - Multiple validation layers
- **Accessibility** - Built-in from the ground up
- **Testability** - Clear boundaries for testing
- **Maintainability** - Well-documented and organized
