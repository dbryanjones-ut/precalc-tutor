# Testing Infrastructure for PreCalc Tutor

## Overview

Comprehensive testing suite with 100+ test cases covering unit tests, component tests, store tests, and end-to-end tests.

## Test Coverage

### Unit Tests

#### LaTeX Validator (`lib/math/latex-validator.test.ts`)
- 25+ test cases covering:
  - Valid LaTeX expressions
  - Invalid/dangerous LaTeX detection
  - XSS prevention
  - Brace balance checking
  - KaTeX parsing
  - Command whitelisting/blacklisting
  - Batch validation
  - Edge cases

#### Answer Validator (`lib/math/answer-validator.test.ts`)
- 30+ test cases covering:
  - Symbolic equivalence (algebraic expressions)
  - Numeric comparison with tolerance
  - Multiple correct answer forms
  - Unit conversion (degrees/radians)
  - Partial credit assessment
  - Simplification checking
  - Multiple choice validation
  - Expression normalization
  - Error handling
  - Complex mathematical expressions

#### AI Response Validator (`lib/ai/response-validator.test.ts`)
- 20+ test cases covering:
  - Hallucination detection
  - Uncertainty detection
  - Citation requirements
  - Contradiction detection
  - Numeric claim validation
  - Step verification
  - Confidence scoring
  - Risk level assessment

### Component Tests

#### MathRenderer (`components/math/MathRenderer.test.tsx`)
- Basic rendering (inline/display modes)
- Accessibility (ARIA labels, keyboard navigation)
- Color highlighting
- Memoization
- Performance
- XSS protection

### Store Tests

#### Progress Store (`stores/useProgressStore.test.ts`)
- Problem result tracking
- Streak management
- Warm-up logging
- Q4 Sprint tracking
- Brain dump storage
- Unit progress updates
- AI session tracking
- State persistence

#### AI Tutor Store (`stores/useAITutorStore.test.ts`)
- Session management
- Message sending/receiving
- Mode switching (Socratic/Explanation)
- Loading/error states
- API error handling
- Complex conversation flows

### End-to-End Tests (Playwright)

#### Daily Warm-up Flow (`e2e/daily-warmup.spec.ts`)
- Page loading
- Starting warm-up
- Answering problems
- Progress tracking
- Completion and results
- Streak updates
- State persistence
- Accessibility
- Performance

#### AI Tutor Flow (`e2e/ai-tutor.spec.ts`)
- Navigation
- Chat interface
- Message sending
- Mode toggling
- Image upload
- Loading states
- LaTeX rendering

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/daily-warmup.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Coverage Targets

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 75%
- **Statements**: 80%

## Test Organization

```
precalc-tutor/
├── test/
│   ├── setup.ts              # Test environment setup
│   └── test-utils.tsx        # Custom render & utilities
├── lib/
│   ├── math/
│   │   ├── latex-validator.test.ts
│   │   ├── answer-validator.test.ts
│   │   └── katex-helpers.test.ts (future)
│   └── ai/
│       └── response-validator.test.ts
├── components/
│   └── math/
│       └── MathRenderer.test.tsx
├── stores/
│   ├── useProgressStore.test.ts
│   └── useAITutorStore.test.ts
├── e2e/
│   ├── daily-warmup.spec.ts
│   └── ai-tutor.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

## Writing New Tests

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";

describe("MyFunction", () => {
  it("should do something", () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Component Tests

```typescript
import { render, screen } from "@/test/test-utils";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test("should complete user flow", async ({ page }) => {
  await page.goto("/");
  await page.click('button:has-text("Start")');
  await expect(page).toHaveURL(/.*result/);
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state unnecessarily

2. **Use Descriptive Test Names**
   - Good: "should reject invalid LaTeX with XSS attempt"
   - Bad: "test 1"

3. **Follow AAA Pattern**
   - Arrange: Set up test data
   - Act: Execute the code under test
   - Assert: Verify the results

4. **Keep Tests Fast**
   - Unit tests: < 100ms
   - Component tests: < 500ms
   - E2E tests: < 5s per test

5. **Isolate Tests**
   - Each test should be independent
   - Use `beforeEach` to reset state

6. **Mock External Dependencies**
   - API calls
   - File system
   - Time-dependent functions

## CI/CD Integration

Tests run automatically on:
- Every commit (unit & component tests)
- Pull requests (full suite including E2E)
- Pre-deployment (all tests must pass)

## Debugging Tests

### Vitest

```bash
# Run single test file
npm test -- latex-validator.test.ts

# Run tests matching pattern
npm test -- -t "should validate"

# Debug in VS Code
# Add breakpoint and use "Debug Test" option
```

### Playwright

```bash
# Run with headed browser
npx playwright test --headed

# Debug mode with pause
npx playwright test --debug

# Show test trace
npx playwright show-trace trace.zip
```

## Common Issues

### Test Timeouts

Increase timeout in test file:
```typescript
test("long test", async ({ page }) => {
  test.setTimeout(30000); // 30 seconds
  // ...
});
```

### Flaky Tests

- Use proper wait conditions
- Avoid hard-coded delays
- Mock time-dependent code

### Coverage Not Meeting Threshold

- Check uncovered lines in coverage report
- Add tests for edge cases
- Exclude generated files in vitest.config.ts

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

## Maintenance

- Review and update tests when features change
- Remove obsolete tests
- Keep test data realistic
- Maintain test documentation
- Monitor test execution time

---

**Last Updated**: 2026-01-27
**Test Count**: 100+ test cases
**Coverage**: 80%+ target
