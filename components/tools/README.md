# Interactive Visual Learning Tools

This directory contains interactive visualization and learning tools for AP Precalculus students.

## Components

### 1. UnitCircleVisualizer
**File:** `UnitCircleVisualizer.tsx`

An interactive SVG-based unit circle with color-coded angle families.

**Features:**
- Interactive hover to see trig values (sin, cos, tan)
- Click to lock/unlock angle values
- Color-coded angle families:
  - Blue (#4F8CFF): π/6 family (30°)
  - Red (#FF6B6B): π/4 family (45°)
  - Green (#51CF66): π/3 family (60°)
  - Gray (#868E96): Special axis angles
- Toggle between degrees and radians
- Custom angle input
- Quadrant labels
- Reference angle display

**Props:**
```typescript
interface UnitCircleVisualizerProps {
  className?: string;
}
```

**Usage:**
```tsx
import { UnitCircleVisualizer } from "@/components/tools/UnitCircleVisualizer";

<UnitCircleVisualizer />
```

**Data Source:** `/data/reference/unit-circle.json`

---

### 2. TransformationExplorer
**File:** `TransformationExplorer.tsx`

Side-by-side function transformation visualizer with real-time parameter adjustment.

**Features:**
- Multiple function families (linear, quadratic, cubic, sqrt, abs, sin, cos, exp, log)
- Real-time SVG graph rendering
- Three transformation parameters:
  - Vertical stretch/compress (a) - OUTPUT transformation
  - Horizontal shift (h) - INPUT transformation
  - Vertical shift (k) - OUTPUT transformation
- Color-coded INPUT vs OUTPUT explanations:
  - BLUE: Input/Inside transformations (affect x-axis)
  - RED: Output/Outside transformations (affect y-axis)
- Parent function shown faded for comparison
- Reset button to restore defaults

**Props:**
```typescript
interface TransformationExplorerProps {
  className?: string;
}
```

**Transform Function:** `g(x) = a * f(x - h) + k`

**Usage:**
```tsx
import { TransformationExplorer } from "@/components/tools/TransformationExplorer";

<TransformationExplorer />
```

---

### 3. SOSProtocolChecklist
**File:** `SOSProtocolChecklist.tsx`

A systematic problem-solving framework designed for ADHD-friendly learning.

**Features:**
- Three phases: SCAN, ORGANIZE, SOLVE & STORE
- Checkbox tracking for each step
- Progress bar showing overall completion
- Collapsible/expandable phases
- Tips and explanations for each step
- Keyboard shortcut support (Ctrl+Shift+R to reset)
- Completion celebration message
- Multiple display modes: floating, sidebar, inline

**Props:**
```typescript
interface SOSProtocolChecklistProps {
  mode?: "floating" | "sidebar" | "inline";
  className?: string;
  onComplete?: () => void;
}
```

**Phases:**
1. **SCAN** (Blue) - Read and understand
   - Highlight the verb
   - Identify question type
   - Underline key information
   - Translate notation

2. **ORGANIZE** (Green) - Set up workspace
   - List knowns
   - List unknowns
   - Identify formulas
   - Sketch diagrams
   - Choose strategy

3. **SOLVE & STORE** (Purple) - Execute and track
   - Write steps clearly
   - Label intermediates
   - Check each step
   - Store partial results
   - State final answer
   - Verify solution

**Usage:**
```tsx
import { SOSProtocolChecklist } from "@/components/tools/SOSProtocolChecklist";

<SOSProtocolChecklist mode="sidebar" />
```

---

## Reference Components

### 4. NotationTranslator
**File:** `/components/reference/NotationTranslator.tsx`

Searchable mathematical notation reference with LaTeX support.

**Features:**
- Search by symbol, meaning, or category
- Category filtering (functions, algebra, trig, etc.)
- LaTeX rendering with MathRenderer
- Copy LaTeX to clipboard
- Common confusion warnings
- Mnemonic devices for remembering
- Examples with LaTeX formatting
- Multiple display modes

**Props:**
```typescript
interface NotationTranslatorProps {
  mode?: "sidebar" | "dialog" | "inline";
  className?: string;
}
```

**Data Source:** `/data/reference/notation-table.json`

**Usage:**
```tsx
import { NotationTranslator } from "@/components/reference/NotationTranslator";

// As sidebar
<NotationTranslator mode="sidebar" />

// As dialog trigger button
<NotationTranslator mode="dialog" />
```

---

### 5. GoldenWordsGuide
**File:** `/components/reference/GoldenWordsGuide.tsx`

Glossary of precise mathematical vocabulary to replace vague language.

**Features:**
- Searchable term database
- Category tabs (functions, trig, exponential, calculus, sequences)
- Formal definitions
- Common misconceptions highlighted
- Related terms with badges
- "Why It Matters" explanations
- Quick reference mode
- AP Unit tagging

**Props:**
```typescript
interface GoldenWordsGuideProps {
  mode?: "quick" | "full";
  className?: string;
}
```

**Data Source:** `/data/reference/golden-words.json`

**Categories:**
- Functions & Relations
- Trigonometric Concepts
- Exponential & Logarithmic Concepts
- Calculus Concepts (Introduction)
- Sequences & Series

**Usage:**
```tsx
import { GoldenWordsGuide } from "@/components/reference/GoldenWordsGuide";

// Full mode
<GoldenWordsGuide mode="full" />

// Quick reference
<GoldenWordsGuide mode="quick" />
```

---

## Tools Page

**File:** `/app/tools/page.tsx`

Main landing page for all interactive learning tools.

**Features:**
- Grid layout of tool cards
- Launch tools in dialog overlays
- Tool descriptions and feature lists
- Getting started guide
- ADHD-friendly features callout

**Route:** `/tools`

---

## Design Principles

### ADHD-Friendly Design
- Minimal visual distractions
- Collapsible sections to reduce cognitive load
- Clear progress indicators
- Step-by-step guidance with tips
- Keyboard shortcuts for power users
- Focus management

### Responsive Design
- Mobile-first approach
- Touch-friendly interactive elements
- Fluid typography and spacing
- Responsive SVG graphics
- Grid layouts that adapt to screen size

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- High contrast color schemes
- Focus indicators
- Screen reader compatible

### Performance
- Memoized calculations
- Optimized SVG rendering
- Lazy loading for dialogs
- Minimal re-renders with React hooks

---

## Data Files

All tools load data from JSON files in `/data/reference/`:

1. **unit-circle.json** - Unit circle angle values and families
2. **notation-table.json** - Mathematical notation reference
3. **golden-words.json** - Mathematical vocabulary guide

---

## Integration

All components are exported through index files for clean imports:

```tsx
// Tools
import {
  UnitCircleVisualizer,
  TransformationExplorer,
  SOSProtocolChecklist
} from "@/components/tools";

// Reference
import {
  NotationTranslator,
  GoldenWordsGuide
} from "@/components/reference";
```

---

## Dependencies

- React 19
- Next.js 16
- Radix UI components (dialog, tabs, slider, etc.)
- Lucide React icons
- KaTeX for math rendering
- Tailwind CSS for styling
- Sonner for toast notifications

---

## Future Enhancements

- [ ] Save user progress in SOSProtocolChecklist to localStorage
- [ ] Add favorites/bookmarks to NotationTranslator
- [ ] Export transformation graphs as images
- [ ] Add audio pronunciations for notation
- [ ] Spaced repetition integration
- [ ] Custom angle family creation in UnitCircle
- [ ] More function families in TransformationExplorer
- [ ] Quiz mode using the tools
