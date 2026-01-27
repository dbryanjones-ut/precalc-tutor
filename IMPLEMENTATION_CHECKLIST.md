# PreCalc Tutor - Implementation Checklist

**Goal:** Reach 95%+ code quality score
**Current Score:** 72%
**Timeline:** 3-6 days (~35 hours total)

---

## Phase 1: Critical Security & Validation (Days 1-2)

### ✅ Mathematical Validation Systems (COMPLETE)
- [x] LaTeX validator created
- [x] Answer validator created
- [x] AI response validator created
- [x] Error boundary component created

### 🔧 Integration Work (8 hours)

#### Task 1: Fix XSS Vulnerability in MathRenderer (2 hours)
**Priority:** P0 - CRITICAL

**File:** `/Users/dbryanjones/Dev_Lab/precalc-tutor/lib/math/katex-helpers.ts`

**Changes:**
```typescript
// Line 11-17: Update KaTeX config
export function renderMath(latex: string, displayMode: boolean = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: true,   // ✅ Change from false
      trust: false,         // ✅ Change from true - CRITICAL
      strict: "warn",       // ✅ Change from false
      output: "html",
    });
  } catch (error) {
    console.error("KaTeX rendering error:", error);
    return `<span class="text-red-500">Error rendering math</span>`;
  }
}
```

**Test:**
```bash
# Try rendering with these test cases:
# 1. Valid: "x^2 + 2x + 1"
# 2. Invalid: "\\href{javascript:alert('xss')}{click}"
# 3. Invalid: "\\input{/etc/passwd}"
```

- [ ] Update katex-helpers.ts
- [ ] Test with valid LaTeX
- [ ] Test with malicious LaTeX
- [ ] Verify errors are caught properly

---

#### Task 2: Integrate Validators into MathRenderer (2 hours)
**Priority:** P0 - CRITICAL

**File:** `/Users/dbryanjones/Dev_Lab/precalc-tutor/components/math/MathRenderer.tsx`

**Changes:**
```typescript
import { LatexValidator } from "@/lib/math/latex-validator";

export function MathRenderer({ latex, displayMode = false, className = "" }) {
  // Add validation step
  const validation = useMemo(() => LatexValidator.validate(latex), [latex]);

  // Show error for invalid LaTeX
  if (!validation.valid) {
    return (
      <span className="text-destructive text-sm">
        Invalid math expression
      </span>
    );
  }

  // Use sanitized LaTeX
  const html = useMemo(
    () => renderMath(validation.sanitized || latex, displayMode),
    [validation.sanitized, latex, displayMode]
  );

  // Rest of component...
}
```

**Checklist:**
- [ ] Import LatexValidator
- [ ] Add validation step
- [ ] Handle validation errors
- [ ] Use sanitized LaTeX
- [ ] Test with valid expressions
- [ ] Test with invalid expressions
- [ ] Verify error messages display correctly

---

#### Task 3: Create AI Tutor API Route (3 hours)
**Priority:** P0 - CRITICAL

**File:** `/Users/dbryanjones/Dev_Lab/precalc-tutor/app/api/ai/tutor/route.ts`

**Steps:**
1. Create file structure:
```bash
mkdir -p /Users/dbryanjones/Dev_Lab/precalc-tutor/app/api/ai/tutor
```

2. Install Zod if not already:
```bash
npm install zod
```

3. Implement route (see CODE_QUALITY_SUMMARY.md for full code)

**Checklist:**
- [ ] Create route.ts file
- [ ] Add request validation with Zod
- [ ] Integrate Anthropic SDK
- [ ] Add AI response validation
- [ ] Handle errors properly
- [ ] Test with Postman/curl
- [ ] Test from frontend
- [ ] Verify validation catches bad responses

**Test command:**
```bash
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is x^2 + 2x + 1 factored?",
    "mode": "socratic",
    "context": {
      "extractedProblem": "Factor: x^2 + 2x + 1",
      "messageHistory": []
    }
  }'
```

---

#### Task 4: Add Error Boundaries (1 hour)
**Priority:** P0 - CRITICAL

**File:** `/Users/dbryanjones/Dev_Lab/precalc-tutor/app/layout.tsx`

**Changes:**
```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ErrorBoundary>
          <AppNav />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

**Checklist:**
- [ ] Import ErrorBoundary
- [ ] Wrap app content
- [ ] Test error boundary by throwing error
- [ ] Verify fallback UI displays
- [ ] Check console logs error details

**Test:**
```typescript
// Add temporary test component
function TestError() {
  throw new Error("Test error boundary");
  return null;
}
```

---

### 📊 Phase 1 Verification

**After completing Phase 1, verify:**

- [ ] All LaTeX is validated before rendering
- [ ] Malicious LaTeX is rejected
- [ ] AI tutor API is functional
- [ ] Error boundaries catch errors
- [ ] No XSS vulnerabilities remain

**Expected Score After Phase 1:** 85%

---

## Phase 2: Robustness & Error Handling (Days 3-4)

### Task 5: Add Zod Validation to Stores (4 hours)
**Priority:** P1

**Install Zod:**
```bash
npm install zod
```

**Files to update:**
1. `/Users/dbryanjones/Dev_Lab/precalc-tutor/stores/useProgressStore.ts`
2. `/Users/dbryanjones/Dev_Lab/precalc-tutor/stores/useSettingsStore.ts`

**Implementation:**

Create schemas:
```typescript
// lib/schemas/progress-schema.ts
import { z } from 'zod';

export const ProgressSchema = z.object({
  version: z.number(),
  totalProblemsAttempted: z.number().min(0),
  totalProblemsCorrect: z.number().min(0),
  currentStreak: z.number().min(0),
  longestStreak: z.number().min(0),
  lastActiveDate: z.string(),
  startDate: z.string(),
  // ... rest of schema
});

export type ValidatedProgress = z.infer<typeof ProgressSchema>;
```

Update store:
```typescript
import { ProgressSchema } from '@/lib/schemas/progress-schema';

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: "precalc-progress-v1",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const data = JSON.parse(str);
            const validated = ProgressSchema.safeParse(data);

            if (!validated.success) {
              console.error('Invalid persisted data:', validated.error);
              return null;
            }

            return validated.data;
          } catch (error) {
            console.error('Failed to load persisted data:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
```

**Checklist:**
- [ ] Create progress schema
- [ ] Create settings schema
- [ ] Update useProgressStore with validation
- [ ] Update useSettingsStore with validation
- [ ] Test with valid data
- [ ] Test with corrupted data
- [ ] Verify reset on invalid data

---

### Task 6: Comprehensive Error Handling (4 hours)
**Priority:** P1

**Update all store actions with try-catch:**

**Example for useAITutorStore:**
```typescript
import { toast } from "sonner";

sendMessage: async (content: string) => {
  try {
    set({ isLoading: true, error: null });

    // Existing logic...

    const response = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ /* ... */ }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API error: ${response.status}`
      );
    }

    const data = await response.json();

    // Validate response
    const validation = await AIResponseValidator.validate({
      content: data.content,
      latex: data.latex,
      citations: data.citations,
    });

    if (!validation.valid) {
      throw new Error('AI response validation failed');
    }

    if (validation.requiresHumanReview) {
      toast.warning('Response flagged for review', {
        description: 'This answer may need verification',
      });
    }

    // Success case...

  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unknown error';

    set({ isLoading: false, error: message });

    toast.error('Failed to send message', {
      description: message,
    });

    console.error('AI tutor error:', error);
  }
},
```

**Files to update:**
- [ ] useProgressStore.ts - all actions
- [ ] useSettingsStore.ts - all actions
- [ ] useAITutorStore.ts - all actions

**Test error cases:**
- [ ] Network failure
- [ ] Invalid API response
- [ ] Validation failure
- [ ] Corrupted data

---

### Task 7: Security Headers (1 hour)
**Priority:** P1

**File:** Create `/Users/dbryanjones/Dev_Lab/precalc-tutor/next.config.js`

**Implementation:** (See CODE_QUALITY_SUMMARY.md for full code)

**Checklist:**
- [ ] Create next.config.js
- [ ] Add CSP headers
- [ ] Add security headers
- [ ] Test locally
- [ ] Verify headers in browser DevTools
- [ ] Check for CSP violations in console

---

### Task 8: Rate Limiting (2 hours)
**Priority:** P1

**Install limiter:**
```bash
npm install limiter
```

**Implementation:**
```typescript
// lib/rate-limiter.ts
import { RateLimiter } from 'limiter';

export const aiTutorLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
});

export const problemSubmitLimiter = new RateLimiter({
  tokensPerInterval: 30,
  interval: 'minute'
});
```

**Usage in store:**
```typescript
import { aiTutorLimiter } from '@/lib/rate-limiter';

sendMessage: async (content: string) => {
  // Check rate limit
  const allowed = await aiTutorLimiter.removeTokens(1);

  if (!allowed) {
    throw new Error('Rate limit exceeded. Please wait a moment.');
  }

  // Continue with request...
}
```

**Checklist:**
- [ ] Install limiter package
- [ ] Create rate limiter instances
- [ ] Add to AI tutor store
- [ ] Test rate limiting
- [ ] Add user-friendly error messages

---

### Task 9: Migration Strategy (2 hours)
**Priority:** P1

**Add versioning to stores:**

```typescript
export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({ /* ... */ }),
    {
      name: "precalc-progress-v1",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle version 0 (initial/no version)
        if (version === 0) {
          console.log('Migrating from v0 to v1');
          return {
            ...persistedState,
            version: 1,
            // Add any new fields with defaults
            newField: defaultValue,
          };
        }

        return persistedState;
      },
    }
  )
);
```

**Checklist:**
- [ ] Add version to all stores
- [ ] Add migrate function
- [ ] Test migration from v0
- [ ] Document migration strategy
- [ ] Plan for future schema changes

---

### 📊 Phase 2 Verification

**After completing Phase 2, verify:**

- [ ] All persisted data is validated
- [ ] Errors are handled gracefully
- [ ] Security headers are active
- [ ] Rate limiting works
- [ ] Data migration strategy in place

**Expected Score After Phase 2:** 91%

---

## Phase 3: Polish & Excellence (Days 5-6)

### Task 10: Performance Optimizations (4 hours)
**Priority:** P2

**Optimize MathRenderer:**
```typescript
export const MathRenderer = React.memo(function MathRenderer({
  latex,
  displayMode,
  className
}) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.latex === nextProps.latex &&
         prevProps.displayMode === nextProps.displayMode &&
         prevProps.className === nextProps.className;
});
```

**Add code splitting:**
```typescript
import dynamic from 'next/dynamic';

const MathRenderer = dynamic(() =>
  import('@/components/math/MathRenderer').then(mod => mod.MathRenderer),
  {
    loading: () => <Skeleton className="h-8 w-32" />,
    ssr: false,
  }
);
```

**Checklist:**
- [ ] Add React.memo to MathRenderer
- [ ] Add React.memo to navigation
- [ ] Implement code splitting for heavy components
- [ ] Optimize regex patterns in color highlighting
- [ ] Add Zustand selectors
- [ ] Profile with React DevTools

---

### Task 11: Enhanced Accessibility (3 hours)
**Priority:** P2

**Improvements needed:**

1. Better math labels:
```typescript
// Consider using speech-rule-engine for math-to-speech
npm install speech-rule-engine
```

2. Add skip links:
```typescript
// In layout.tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">
  {children}
</main>
```

3. Verify color contrast:
```typescript
// Use contrast checker
// WCAG AA: 4.5:1 for normal text, 3:1 for large text
```

**Checklist:**
- [ ] Improve generateAccessibleLabel
- [ ] Add skip navigation
- [ ] Verify all color contrasts
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Test keyboard navigation

---

### Task 12: Documentation (3 hours)
**Priority:** P2

**Add JSDoc comments:**
```typescript
/**
 * Validates mathematical answer for correctness
 *
 * @param studentAnswer - The student's submitted answer (LaTeX or plain text)
 * @param correctAnswer - The correct answer(s) to check against
 * @param options - Validation options
 * @returns Validation result with feedback
 *
 * @example
 * ```typescript
 * const result = AnswerValidator.validate("x^2 + 2x + 1", "(x+1)^2");
 * if (result.isCorrect) {
 *   showSuccess(result.feedback);
 * }
 * ```
 */
```

**Create constants file:**
```typescript
// lib/constants.ts
export const VALIDATION = {
  MAX_LATEX_LENGTH: 10000,
  MAX_MESSAGE_LENGTH: 5000,
  DEFAULT_TOLERANCE: 1e-6,
} as const;

export const RATE_LIMITS = {
  AI_TUTOR: {
    TOKENS: 10,
    INTERVAL: 'minute',
  },
  PROBLEM_SUBMIT: {
    TOKENS: 30,
    INTERVAL: 'minute',
  },
} as const;

export const ERROR_MESSAGES = {
  LATEX_TOO_LONG: 'Mathematical expression is too long',
  INVALID_LATEX: 'Invalid mathematical notation',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
} as const;
```

**Checklist:**
- [ ] Add JSDoc to all validators
- [ ] Add JSDoc to all stores
- [ ] Create constants file
- [ ] Update imports to use constants
- [ ] Add inline code examples
- [ ] Document error codes

---

### Task 13: Testing Infrastructure (4 hours)
**Priority:** P2

**Install testing dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Create test files:**

1. `lib/math/__tests__/latex-validator.test.ts`
2. `lib/math/__tests__/answer-validator.test.ts`
3. `lib/ai/__tests__/response-validator.test.ts`

**Example test:**
```typescript
import { describe, it, expect } from 'vitest';
import { LatexValidator } from '../latex-validator';

describe('LatexValidator', () => {
  it('validates correct LaTeX', () => {
    const result = LatexValidator.validate('x^2 + 1');
    expect(result.valid).toBe(true);
  });

  it('rejects malicious LaTeX', () => {
    const result = LatexValidator.validate('\\href{javascript:alert("xss")}');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Forbidden command detected: \\href');
  });
});
```

**Checklist:**
- [ ] Install test dependencies
- [ ] Create test files
- [ ] Write LaTeX validator tests
- [ ] Write answer validator tests
- [ ] Write AI response validator tests
- [ ] Add test scripts to package.json
- [ ] Achieve >80% coverage

---

### 📊 Phase 3 Verification

**After completing Phase 3, verify:**

- [ ] Performance benchmarks meet targets
- [ ] Accessibility audit passes
- [ ] All code is documented
- [ ] Test coverage >80%

**Expected Score After Phase 3:** 96%

---

## Final Quality Checklist

### Mathematical Correctness
- [x] LaTeX validation system exists
- [x] Answer validation system exists
- [x] AI response validation exists
- [ ] All validators integrated
- [ ] Edge cases tested

### Security
- [ ] XSS vulnerabilities fixed
- [ ] Security headers implemented
- [ ] Rate limiting active
- [ ] API keys protected
- [ ] Input sanitization complete

### Error Handling
- [ ] Error boundaries implemented
- [ ] All store actions have try-catch
- [ ] Network errors handled
- [ ] Data corruption handled
- [ ] User-friendly error messages

### Type Safety
- [x] TypeScript strict mode enabled
- [ ] Zod validation for persisted data
- [ ] No unsafe type assertions
- [ ] Runtime type checking

### Performance
- [ ] Components memoized
- [ ] Code splitting implemented
- [ ] Regex patterns optimized
- [ ] No unnecessary re-renders

### Accessibility
- [ ] ARIA labels complete
- [ ] Color contrast verified
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Skip navigation added

### Documentation
- [ ] JSDoc comments added
- [ ] Constants extracted
- [ ] Error codes documented
- [ ] Code examples provided

### Testing
- [ ] Unit tests written
- [ ] Integration tests exist
- [ ] >80% code coverage
- [ ] Edge cases covered

---

## Time Tracking

| Phase | Task | Estimated | Actual | Status |
|-------|------|-----------|--------|--------|
| 1 | Fix XSS | 2h | | ⏳ |
| 1 | Integrate validators | 2h | | ⏳ |
| 1 | Create API route | 3h | | ⏳ |
| 1 | Error boundaries | 1h | | ⏳ |
| 2 | Zod validation | 4h | | ⏳ |
| 2 | Error handling | 4h | | ⏳ |
| 2 | Security headers | 1h | | ⏳ |
| 2 | Rate limiting | 2h | | ⏳ |
| 2 | Migration | 2h | | ⏳ |
| 3 | Performance | 4h | | ⏳ |
| 3 | Accessibility | 3h | | ⏳ |
| 3 | Documentation | 3h | | ⏳ |
| 3 | Testing | 4h | | ⏳ |
| **Total** | | **35h** | | |

---

## Quick Win Commands

**Run linting:**
```bash
npm run lint
```

**Check types:**
```bash
npx tsc --noEmit
```

**Run tests (after setup):**
```bash
npm test
```

**Build for production:**
```bash
npm run build
```

---

## Success Metrics

Track these metrics as you implement:

- ✅ LaTeX validation success rate: >99%
- ✅ AI response confidence: >0.9 average
- ✅ Error boundary triggers: <1 per 1000 page views
- ✅ Build warnings: 0
- ✅ Type errors: 0
- ✅ Test coverage: >80%
- ✅ Lighthouse performance: >90
- ✅ Lighthouse accessibility: >95

---

## Support & Resources

**Questions?** Refer to:
- AUDIT_REPORT.md - Detailed technical analysis
- CODE_QUALITY_SUMMARY.md - Overview and integration guide
- Individual validator files - Implementation details

**Need help?** Ask specific questions about any task!

---

**Remember:** Champions adjust. You're not starting from zero—you're fortifying an already solid foundation. Each checkbox brings you closer to an exceptional product.

Let's build something bulletproof! 🏆
