# Secure Math Components - Quick Start Guide

## TL;DR - Copy & Paste Examples

### 1. Render Math Safely

```typescript
import { SafeMathRenderer, MathRenderer } from "@/components/math";

// DO THIS (safest)
<SafeMathRenderer>
  <MathRenderer latex={userInput} />
</SafeMathRenderer>

// OR THIS (if you handle errors)
<MathRenderer
  latex={userInput}
  showValidationErrors={true}
/>
```

### 2. Practice Problem Input

```typescript
import { AnswerInput } from "@/components/practice";

<AnswerInput
  questionId="problem-1"
  correctAnswer="x^2 + 2x + 1"
  onAnswerSubmit={(answer, isCorrect, confidence) => {
    if (isCorrect) {
      // Handle correct answer
    }
  }}
/>
```

### 3. Multiple Choice

```typescript
import { MultipleChoiceInput } from "@/components/practice";

<MultipleChoiceInput
  questionId="problem-2"
  correctAnswer="2x"
  options={[
    { value: "x", label: "x" },
    { value: "2x", label: "2x" },
    { value: "x²", label: "x²" },
  ]}
/>
```

---

## Security Rules (Must Follow)

### ✅ DO
- Use `SafeMathRenderer` wrapper for all user/AI LaTeX
- Validate LaTeX before storing in database
- Use `AnswerInput` component for all practice problems
- Show validation errors in development
- Wrap math-heavy components in error boundaries

### ❌ DON'T
- Never use `trust: true` in KaTeX config
- Never render unvalidated user input
- Never render unvalidated AI-generated LaTeX
- Never skip LaTeX validation
- Never ignore validation errors

---

## Common Patterns

### Pattern 1: Display User-Generated Math
```typescript
import { SafeMathRenderer, DisplayMath } from "@/components/math";

function UserMathDisplay({ latex }: { latex: string }) {
  return (
    <SafeMathRenderer>
      <DisplayMath latex={latex} />
    </SafeMathRenderer>
  );
}
```

### Pattern 2: Practice Problem with Feedback
```typescript
import { AnswerInput } from "@/components/practice";
import { MathRenderer } from "@/components/math";

function PracticeProblem() {
  return (
    <div>
      <p>Solve: <MathRenderer latex="2x + 4 = 10" /></p>
      <AnswerInput
        questionId="solve-linear"
        correctAnswer={["3", "x = 3"]}
        validationOptions={{
          allowPartialCredit: true,
          tolerance: 1e-6,
        }}
        showHints={true}
      />
    </div>
  );
}
```

### Pattern 3: Validate Before Storing
```typescript
import { LatexValidator } from "@/lib/math/latex-validator";

async function saveUserLatex(latex: string) {
  const validation = LatexValidator.validate(latex);

  if (!validation.valid) {
    throw new Error(`Invalid LaTeX: ${validation.errors[0]}`);
  }

  // Safe to store
  await db.save({
    latex: validation.sanitized || latex,
    validated: true,
  });
}
```

### Pattern 4: Validate AI Response
```typescript
import { LatexValidator } from "@/lib/math/latex-validator";

async function getAIExplanation(problem: string) {
  const response = await ai.generate(problem);

  // Extract LaTeX from AI response
  const latexExpressions = extractLatex(response);

  // Validate each expression
  for (const latex of latexExpressions) {
    const validation = LatexValidator.validate(latex);
    if (!validation.valid) {
      console.error("AI generated invalid LaTeX:", latex);
      // Use fallback or retry
    }
  }

  return response;
}
```

---

## Error Handling

### Pattern 5: Graceful Degradation
```typescript
import { MathErrorBoundary } from "@/components/math";

function MathContent({ latex }: { latex: string }) {
  return (
    <MathErrorBoundary
      fallback={
        <span className="text-muted-foreground italic">
          [Math expression unavailable]
        </span>
      }
    >
      <MathRenderer latex={latex} />
    </MathErrorBoundary>
  );
}
```

---

## Validation API

### LaTeX Validation
```typescript
import { LatexValidator } from "@/lib/math/latex-validator";

const result = LatexValidator.validate(latex);

// result.valid: boolean
// result.errors: string[]
// result.warnings: string[]
// result.sanitized?: string
```

### Answer Validation
```typescript
import { AnswerValidator } from "@/lib/math/answer-validator";

const result = AnswerValidator.validate(
  studentAnswer,
  correctAnswer,
  {
    tolerance: 1e-6,              // numeric tolerance
    allowPartialCredit: true,     // assess partial credit
    requireSimplified: false,     // require simplified form
  }
);

// result.isCorrect: boolean
// result.confidence: number (0-1)
// result.feedback: string
// result.method: "symbolic" | "numeric" | "string"
// result.equivalentForms: string[]
```

---

## Component Props

### MathRenderer
```typescript
interface MathRendererProps {
  latex: string;                  // LaTeX to render
  displayMode?: boolean;          // inline (false) or display (true)
  className?: string;             // CSS classes
  colorHighlights?: Record<string, string>;  // { part: "#hex" }
  showValidationErrors?: boolean; // show errors to user
}
```

### AnswerInput
```typescript
interface AnswerInputProps {
  questionId: string;             // unique ID
  correctAnswer: string | string[];  // accepted answers

  validationOptions?: {
    tolerance?: number;           // default: 1e-6
    allowPartialCredit?: boolean; // default: false
    requireSimplified?: boolean;  // default: false
  };

  onAnswerSubmit?: (
    answer: string,
    isCorrect: boolean,
    confidence: number
  ) => void;

  placeholder?: string;
  label?: string;
  showHints?: boolean;           // default: true
  disabled?: boolean;
  className?: string;
}
```

---

## Testing

### Test XSS Prevention
```typescript
import { LatexValidator } from "@/lib/math/latex-validator";

const malicious = [
  "\\href{javascript:alert('xss')}{click}",
  "\\def\\bad{<script>alert('xss')</script>}",
  "<script>alert('xss')</script>",
];

malicious.forEach(latex => {
  const result = LatexValidator.validate(latex);
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
});
```

### Test Valid LaTeX
```typescript
const valid = [
  "x^2 + 2x + 1",
  "\\frac{1}{2}",
  "\\sin(x) + \\cos(x)",
];

valid.forEach(latex => {
  const result = LatexValidator.validate(latex);
  expect(result.valid).toBe(true);
});
```

---

## Common Gotchas

### 1. Trust Mode
```typescript
// ❌ NEVER DO THIS
katex.renderToString(latex, { trust: true });

// ✅ ALWAYS DO THIS
const validation = LatexValidator.validate(latex);
if (validation.valid) {
  katex.renderToString(validation.sanitized || latex, { trust: false });
}
```

### 2. Direct Rendering
```typescript
// ❌ DON'T
<span dangerouslySetInnerHTML={{ __html: katex.renderToString(userInput) }} />

// ✅ DO
<MathRenderer latex={userInput} />
```

### 3. Skipping Validation
```typescript
// ❌ DON'T
<MathRenderer latex={aiResponse.latex} />

// ✅ DO
const validation = LatexValidator.validate(aiResponse.latex);
if (validation.valid) {
  <MathRenderer latex={validation.sanitized || aiResponse.latex} />
}
```

---

## Performance Tips

### Memoize Expensive Validation
```typescript
import { useMemo } from "react";
import { LatexValidator } from "@/lib/math/latex-validator";

function MathDisplay({ latex }: { latex: string }) {
  const validation = useMemo(
    () => LatexValidator.validate(latex),
    [latex]
  );

  if (!validation.valid) {
    return <ErrorDisplay errors={validation.errors} />;
  }

  return <MathRenderer latex={validation.sanitized || latex} />;
}
```

---

## Live Demo

Visit `/examples/secure-math` to see:
- Safe rendering examples
- Validation demos
- Answer input examples
- Security test cases

---

## Files Reference

### Components
- `/components/math/MathRenderer.tsx` - Secure rendering
- `/components/math/MathErrorBoundary.tsx` - Error handling
- `/components/practice/AnswerInput.tsx` - Validated input

### Validators
- `/lib/math/latex-validator.ts` - LaTeX security
- `/lib/math/answer-validator.ts` - Answer checking
- `/lib/math/katex-helpers.ts` - Rendering helpers

### Documentation
- `/SECURITY_IMPLEMENTATION.md` - Full guide
- `/SECURITY_FIXES_SUMMARY.md` - Implementation summary
- `/SECURE_MATH_QUICK_START.md` - This file

---

## Quick Checklist

Before deploying math features:

- [ ] All user LaTeX uses `SafeMathRenderer`
- [ ] All AI LaTeX validated before rendering
- [ ] All practice problems use `AnswerInput`
- [ ] Error boundaries in place
- [ ] No `trust: true` anywhere
- [ ] Tested with malicious inputs
- [ ] Validation errors logged

**When in doubt, wrap it in SafeMathRenderer!**
