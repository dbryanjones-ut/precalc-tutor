# Contributing to PreCalc Tutor

Thank you for your interest in contributing to PreCalc Tutor! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Anthropic API key (for testing AI features)

### Setup

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/yourusername/precalc-tutor.git
cd precalc-tutor
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/originalowner/precalc-tutor.git
```

4. Install dependencies:

```bash
npm install
```

5. Copy environment variables:

```bash
cp .env.example .env.local
```

6. Start development server:

```bash
npm run dev
```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/` - New features (e.g., `feature/add-graphing-calculator`)
- `fix/` - Bug fixes (e.g., `fix/equation-parser-crash`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-state-management`)
- `test/` - Test additions/updates (e.g., `test/add-unit-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```bash
feat(lessons): add trigonometry section
fix(calculator): handle division by zero
docs(readme): update installation instructions
```

### Code Style

#### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper typing
- Use interfaces for object shapes
- Use type aliases for unions/intersections

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Avoid
const user: any = { ... };
```

#### React

- Use functional components with hooks
- Prefer named exports over default exports
- Keep components focused and small (< 200 lines)
- Use Radix UI components when possible

```typescript
// Good
export function MyComponent({ name }: { name: string }) {
  return <div>{name}</div>;
}

// Avoid
export default function MyComponent(props: any) {
  // 500 lines of code
}
```

#### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Use semantic HTML elements

```tsx
// Good
<button className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
  Click me
</button>

// Avoid
<div onClick={handleClick} className="my-button">Click me</div>
```

### Testing

#### Unit Tests

Write unit tests for:
- Utility functions
- Custom hooks
- Store actions
- Math operations

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDerivative } from '@/lib/math';

describe('calculateDerivative', () => {
  it('should calculate derivative correctly', () => {
    expect(calculateDerivative('x^2', 'x')).toBe('2x');
  });
});
```

#### E2E Tests

Write E2E tests for:
- Critical user flows
- Multi-step interactions
- Integration points

```typescript
import { test, expect } from '@playwright/test';

test('user can solve practice problem', async ({ page }) => {
  await page.goto('/practice');
  await page.fill('[data-testid="answer"]', '42');
  await page.click('[data-testid="submit"]');
  await expect(page.locator('[data-testid="result"]')).toContainText('Correct');
});
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Pull Request Process

### Before Submitting

1. Update from upstream:

```bash
git fetch upstream
git rebase upstream/main
```

2. Run checks:

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

3. Update documentation if needed

### Submitting PR

1. Push to your fork:

```bash
git push origin feature/my-feature
```

2. Create PR on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Link to related issue (if applicable)
   - Screenshots (for UI changes)
   - Testing instructions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

- All PRs require at least one review
- Address review feedback
- Keep PR focused and small (< 400 lines when possible)
- Squash commits before merging

## Code Review Guidelines

### As a Reviewer

- Be respectful and constructive
- Ask questions rather than making demands
- Praise good solutions
- Explain reasoning behind suggestions
- Approve when satisfied

### As an Author

- Respond to all comments
- Don't take feedback personally
- Ask for clarification when needed
- Thank reviewers for their time

## Adding New Features

### Lessons

1. Create lesson data in `data/lessons/`
2. Add lesson page in `app/lessons/`
3. Update navigation
4. Add tests
5. Update documentation

### Components

1. Create component in appropriate directory
2. Add TypeScript types
3. Add unit tests
4. Update Storybook (if applicable)
5. Document props

### API Routes

1. Create route handler in `app/api/`
2. Add input validation (Zod)
3. Add error handling
4. Add rate limiting
5. Add tests
6. Document in API docs

## Documentation

### Code Comments

- Use JSDoc for functions
- Explain "why" not "what"
- Update comments when code changes

```typescript
/**
 * Calculates the derivative of a polynomial expression
 *
 * @param expression - The mathematical expression to differentiate
 * @param variable - The variable to differentiate with respect to
 * @returns The derivative expression as a string
 * @throws Error if expression is invalid
 */
export function calculateDerivative(expression: string, variable: string): string {
  // Implementation
}
```

### README Updates

Update README.md when:
- Adding new features
- Changing setup process
- Adding dependencies
- Changing scripts

## Performance Considerations

### Bundle Size

- Code split large dependencies
- Use dynamic imports for heavy components
- Optimize images
- Tree-shake unused code

### Runtime Performance

- Memoize expensive calculations
- Debounce user input
- Use React.memo for expensive renders
- Lazy load non-critical components

### Monitoring

- Check Lighthouse scores
- Monitor bundle size in CI
- Test on slow networks/devices

## Security

### Best Practices

- Validate all user input
- Sanitize data before rendering
- Use parameterized queries
- Never commit secrets
- Follow CSP guidelines

### Reporting Vulnerabilities

Email security@precalc-tutor.com with:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Email support@precalc-tutor.com for private matters

Thank you for contributing!
