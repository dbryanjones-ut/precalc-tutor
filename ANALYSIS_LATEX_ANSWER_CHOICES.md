# Analysis: LaTeX Answer Choices in AI Tutor

## Current Implementation Analysis

### 1. **How LaTeX Extraction Works** (API Route)

**File**: `/Users/dbryanjones/Dev_Lab/precalc-tutor/app/api/ai/tutor/route.ts`

**Lines 73-100**: `extractLatex()` function

```typescript
function extractLatex(content: string): string[] {
  const latex: string[] = [];

  // Pattern 1: Display math $$...$$
  const displayPattern = /\$\$((?:(?!\$\$).)+)\$\$/gs;

  // Pattern 2: Inline math $...$
  const inlinePattern = /(?<!\$)\$(?!\$)((?:(?!\$).)+)\$(?!\$)/gs;

  return [...new Set(latex)]; // Remove duplicates
}
```

**Key Behavior:**
- Extracts **ALL** math expressions wrapped in `$...$` or `$$...$$`
- Returns a deduplicated array
- Does NOT distinguish between math in prose vs. answer choices
- Returns in order of appearance in the AI's response

**Current Problem:**
The AI is writing something like:
```
What do you see?

$expression_1$

$expression_2$

$expression_3$
```

And `extractLatex()` captures all three as separate items, which then get rendered as individual cards in the `message.latex` array.

---

### 2. **AI Prompt Instructions** (Tutor Prompts)

**File**: `/Users/dbryanjones/Dev_Lab/precalc-tutor/lib/ai/tutor-prompts.ts`

**Lines 89-120**: LaTeX formatting rules

```typescript
# LATEX FORMATTING (CRITICAL - READ CAREFULLY)

**IMPORTANT**: You MUST use the following LaTeX delimiters EXACTLY as specified:

- **Inline math**: Use single dollar signs: $expression$
  Example: The value of $x^2 + 5$ is important here.

- **Display math**: Use double dollar signs: $$expression$$
  Example: The quadratic formula is:
  $$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$
```

**Observations:**
- The prompts focus on **formatting rules** (when to use $ vs $$)
- No specific instructions about **answer choices** or multiple-choice questions
- No guidance on how to present clickable options
- The AI is left to improvise how to present options

---

### 3. **ChatMessage Type Definition**

**File**: `/Users/dbryanjones/Dev_Lab/precalc-tutor/types/ai-session.ts`

**Lines 29-36**:

```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  latex?: string[];        // Math expressions in message
  citations?: Citation[];
  metadata?: MessageMetadata;
}
```

**Current Structure:**
- `content`: Main text (including inline/display math)
- `latex[]`: Extracted math expressions (rendered separately below content)
- No dedicated structure for answer choices

---

### 4. **UI Rendering** (ChatInterface Component)

**File**: `/Users/dbryanjones/Dev_Lab/precalc-tutor/components/ai-tutor/ChatInterface.tsx`

**Lines 377-394**: LaTeX rendering

```typescript
{/* LaTeX expressions - NOW WITH ONCLICK HANDLERS */}
{message.latex && Array.isArray(message.latex) && message.latex.length > 0 && (
  <div className="mt-4 space-y-3">
    {message.latex.map((latex, i) => (
      <div
        key={i}
        className="p-4 rounded-xl bg-background/50 border border-border/50"
      >
        <MathRenderer
          latex={latex}
          displayMode={true}
          onClick={!isUser ? () => sendMessage(latex) : undefined}
        />
      </div>
    ))}
  </div>
)}
```

**Current Behavior:**
- Each item in `message.latex[]` is rendered as a **separate card** with gray background
- Cards have onClick handlers that send the LaTeX back as a message
- This works perfectly for clickable answer choices!

**Issue:**
The extracted LaTeX array includes expressions from the main content that shouldn't be answer choices.

---

## Problem Summary

### What's Happening:
1. AI writes: "What do you see? $expr_1$ $expr_2$ $expr_3$"
2. `extractLatex()` captures all three expressions
3. UI renders them as three separate clickable cards
4. These cards appear to be "answer options" but are mixed with explanatory math

### Root Cause:
**The extraction logic is too broad** - it captures ALL math expressions, not just answer choices.

---

## Recommended Solution: Structured Answer Choice Format

### Option 1: **Semantic Delimiters** (Recommended)

Introduce special delimiters for answer choices that the AI can use and the extraction logic can parse.

#### Changes Required:

**1. Update AI Prompts** (`lib/ai/tutor-prompts.ts`)

Add to the LaTeX formatting section:

```typescript
**Answer Choices** (for multiple-choice questions):
When presenting answer options, use this format:

What do you see in the graph?

<CHOICE>A: $f(x) = x^2$</CHOICE>
<CHOICE>B: $f(x) = x^3$</CHOICE>
<CHOICE>C: $f(x) = \sqrt{x}$</CHOICE>

The <CHOICE> tags will be rendered as clickable options.
```

**2. Update ChatMessage Type** (`types/ai-session.ts`)

```typescript
export interface AnswerChoice {
  label: string;        // "A", "B", "C", etc.
  content: string;      // Full text/LaTeX
  latex?: string;       // Extracted LaTeX if present
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  latex?: string[];           // General math expressions
  choices?: AnswerChoice[];   // NEW: Multiple choice options
  citations?: Citation[];
  metadata?: MessageMetadata;
}
```

**3. Update Extraction Logic** (`app/api/ai/tutor/route.ts`)

Add new function after `extractLatex()`:

```typescript
/**
 * Extract answer choices from AI response
 * Format: <CHOICE>A: $expression$</CHOICE>
 */
function extractChoices(content: string): AnswerChoice[] {
  const choices: AnswerChoice[] = [];
  const choicePattern = /<CHOICE>([^:]+):\s*(.+?)<\/CHOICE>/gs;
  let match;

  while ((match = choicePattern.exec(content)) !== null) {
    const label = match[1].trim();
    const fullContent = match[2].trim();

    // Extract LaTeX from the choice content if present
    const latexMatch = fullContent.match(/\$(.+?)\$/);

    choices.push({
      label,
      content: fullContent,
      latex: latexMatch ? latexMatch[1] : undefined,
    });
  }

  return choices;
}

/**
 * Remove choice tags from content before rendering
 */
function stripChoiceTags(content: string): string {
  return content.replace(/<CHOICE>(.+?)<\/CHOICE>/gs, '');
}
```

**4. Update API Response** (`app/api/ai/tutor/route.ts`, line ~296)

```typescript
// 7. Extract LaTeX, choices, and citations
const rawLatex = extractLatex(assistantResponse);
const choices = extractChoices(assistantResponse);
const citations = extractCitations(assistantResponse);

// Remove choice tags from content and then extract remaining LaTeX
const cleanedContent = stripChoiceTags(assistantResponse);
const contentLatex = extractLatex(cleanedContent);

// Return response
return NextResponse.json({
  data: {
    content: cleanedContent,
    latex: contentLatex,    // Only LaTeX from explanatory text
    choices,                 // Structured answer choices
    citations,
    validation: {
      confidence: validation.confidence,
      riskLevel: validation.riskLevel,
      warnings: validation.warnings,
      latexErrors: latexValidationErrors,
    },
  },
  timestamp: new Date().toISOString(),
});
```

**5. Update UI Rendering** (`components/ai-tutor/ChatInterface.tsx`)

Replace the current LaTeX rendering section with:

```typescript
{/* Answer Choices - Clickable Options */}
{message.choices && message.choices.length > 0 && (
  <div className="mt-4 space-y-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      Select an answer:
    </p>
    {message.choices.map((choice, i) => (
      <button
        key={i}
        onClick={() => sendMessage(choice.label)}
        className="w-full p-4 rounded-xl bg-blue-50 hover:bg-blue-100
                   dark:bg-blue-950 dark:hover:bg-blue-900
                   border-2 border-blue-200 hover:border-blue-400
                   dark:border-blue-800 dark:hover:border-blue-600
                   transition-all duration-200 text-left
                   flex items-center gap-3 group"
      >
        <span className="font-bold text-blue-600 dark:text-blue-400
                         text-lg min-w-[2rem]">
          {choice.label}
        </span>
        <div className="flex-1">
          {choice.latex ? (
            <MathRenderer latex={choice.latex} displayMode={false} />
          ) : (
            <span className="text-foreground">{choice.content}</span>
          )}
        </div>
        <span className="opacity-0 group-hover:opacity-100
                         text-blue-600 dark:text-blue-400 transition-opacity">
          →
        </span>
      </button>
    ))}
  </div>
)}

{/* General LaTeX expressions - Read-only display */}
{message.latex && message.latex.length > 0 && (
  <div className="mt-4 space-y-3">
    {message.latex.map((latex, i) => (
      <div
        key={i}
        className="p-4 rounded-xl bg-background/50 border border-border/50"
      >
        <MathRenderer latex={latex} displayMode={true} />
      </div>
    ))}
  </div>
)}
```

---

### Option 2: **Natural Language Parsing** (Alternative)

Instead of special delimiters, train the AI to use a consistent format like:

```
**A.** $expression$
**B.** $expression$
**C.** $expression$
```

Then parse with regex in the extraction logic. This is more error-prone but feels more "natural".

---

### Option 3: **Keep Current Extraction, Improve Prompts** (Minimal Change)

**Pros:** Minimal code changes
**Cons:** Less control, relies on AI consistency

Update prompts to tell the AI:

```typescript
**For Multiple Choice Questions**:
Present options at the END of your response, after your question.
Each option should be on its own line with display math $$...$$

Example:
What transformation is shown?

$$f(x) = x^2$$
$$f(x) = x^3$$
$$f(x) = \sqrt{x}$$

This ensures they render as separate clickable options.
```

Then in the UI, treat `message.latex` items as potential answer choices when they appear at the end of a message.

---

## Recommended Approach

**I recommend Option 1 (Semantic Delimiters)** because:

1. **Explicit Intent**: Clear separation between explanatory math and answer choices
2. **Structured Data**: Enables better UX (labels, styling, analytics)
3. **Reliable Parsing**: Regex is deterministic vs. AI interpretation
4. **Future-Proof**: Can extend with correct/incorrect feedback, explanations per choice, etc.
5. **Better Accessibility**: Screen readers can announce "Answer choice A: ..."

---

## Implementation Priority

1. **Phase 1** (Quick Fix): Update prompts to guide AI to put choices at end
2. **Phase 2** (Better UX): Implement structured choice extraction with `<CHOICE>` tags
3. **Phase 3** (Enhanced): Add choice metadata (correctness, explanations, difficulty)

---

## Example: Before vs After

### Before (Current)
```
AI Response:
"What do you see? The options are $x^2$, $x^3$, and $\sqrt{x}$."

message.latex = ["x^2", "x^3", "\sqrt{x}"]
```
All three render as gray cards (confusing - are they all clickable options?)

### After (Recommended)
```
AI Response:
"What do you see in the graph?

<CHOICE>A: $f(x) = x^2$</CHOICE>
<CHOICE>B: $f(x) = x^3$</CHOICE>
<CHOICE>C: $f(x) = \sqrt{x}$</CHOICE>"

message.choices = [
  { label: "A", content: "$f(x) = x^2$", latex: "f(x) = x^2" },
  { label: "B", content: "$f(x) = x^3$", latex: "f(x) = x^3" },
  { label: "C", content: "$f(x) = \sqrt{x}$", latex: "f(x) = \sqrt{x}" }
]
```

UI renders as proper multiple-choice buttons with labels, hover states, and clear affordance.

---

## Files That Need Changes

### Minimal (Option 3):
- `/Users/dbryanjones/Dev_Lab/precalc-tutor/lib/ai/tutor-prompts.ts` (add guidance)

### Recommended (Option 1):
1. `/Users/dbryanjones/Dev_Lab/precalc-tutor/lib/ai/tutor-prompts.ts` (add `<CHOICE>` format)
2. `/Users/dbryanjones/Dev_Lab/precalc-tutor/types/ai-session.ts` (add `AnswerChoice` type)
3. `/Users/dbryanjones/Dev_Lab/precalc-tutor/app/api/ai/tutor/route.ts` (add `extractChoices()`)
4. `/Users/dbryanjones/Dev_Lab/precalc-tutor/components/ai-tutor/ChatInterface.tsx` (render choices differently)

---

## Summary

The current system extracts **all** LaTeX as clickable cards, which works well when the AI generates pure answer choices but breaks down when math is mixed into prose.

**The best solution is to introduce structured answer choice parsing** with semantic delimiters (`<CHOICE>`) that:
- Give the AI explicit instructions
- Enable deterministic parsing
- Allow better UI/UX differentiation
- Support future enhancements (correctness feedback, explanations, etc.)

This transforms the `latex[]` array from a catch-all into two distinct concepts:
- `latex[]`: Explanatory math (display only)
- `choices[]`: Interactive answer options (buttons with labels)
