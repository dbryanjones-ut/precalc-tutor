# AI Validation & Prompt Engineering System

**Mission**: Make the AI tutor mathematically bulletproof with zero hallucinations.

## Overview

This system provides comprehensive validation and prompt engineering for the AP Precalculus AI tutor. It ensures every response is:

- ✅ Mathematically accurate
- ✅ Properly cited
- ✅ Free from hallucinations
- ✅ Pedagogically sound
- ✅ LaTeX-validated

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Question                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Context Builder                             │
│  • Loads relevant notation                                       │
│  • Injects golden words                                          │
│  • Adds common mistakes to avoid                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Prompt Generator                             │
│  • Builds system prompt (Socratic or Explanation)                │
│  • Injects reference materials                                   │
│  • Adds self-verification instructions                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Claude API Call                             │
│  • Streams response                                              │
│  • Real-time LaTeX extraction                                    │
│  • Real-time citation extraction                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Response Validator                            │
│  • Validates LaTeX syntax                                        │
│  • Checks for hallucination indicators                           │
│  • Verifies mathematical claims                                  │
│  • Extracts and fact-checks claims                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          Pass: Show to Student | Fail: Human Review              │
└─────────────────────────────────────────────────────────────────┘
```

## Modules

### 1. `tutor-prompts.ts` - Prompt Engineering

**Purpose**: Build bulletproof system prompts with mathematical rigor.

**Key Features**:
- Separate prompts for Socratic and Explanation modes
- Self-verification instructions built-in
- Examples of good vs. bad responses
- Citation requirements enforced
- Zero tolerance for uncertain language

**Usage**:
```typescript
import { generateTutorPrompt } from '@/lib/ai';

const prompt = generateTutorPrompt({
  mode: 'socratic',
  problemContext: 'Solve x² + 5x + 6 = 0',
  referenceMaterials: {
    notation: [...],
    goldenWords: [...],
    commonMistakes: [...]
  }
});

// Use prompt.systemPrompt with Claude API
```

### 2. `context-builder.ts` - Intelligent Context Assembly

**Purpose**: Inject relevant reference materials to prevent hallucinations.

**Key Features**:
- Automatically detects concepts in problem text
- Loads relevant notation from notation table
- Injects key terms from golden words
- Includes common mistakes to avoid
- Stays under token limits

**Usage**:
```typescript
import { ContextBuilder } from '@/lib/ai';

const context = await ContextBuilder.buildContext(
  problemText,
  conversationHistory,
  { maxTokens: 4000 }
);

// Use context.notation, context.goldenWords, context.commonMistakes
```

### 3. `response-validator.ts` - Base Validation

**Purpose**: Validate AI responses for mathematical correctness.

**Key Features**:
- LaTeX syntax validation
- Hallucination indicator detection
- Uncertainty phrase detection
- Mathematical claim verification
- Consistency checking with conversation history

**Usage**:
```typescript
import { AIResponseValidator } from '@/lib/ai';

const validation = await AIResponseValidator.validate({
  content: response.content,
  latex: response.latex,
  citations: response.citations
});

if (validation.valid && !validation.requiresHumanReview) {
  // Show to student
} else {
  // Flag for review
}
```

### 4. `response-validator-enhanced.ts` - Advanced Fact-Checking

**Purpose**: Deep validation with fact-checking against reference materials.

**Key Features**:
- Extracts mathematical claims
- Fact-checks against notation table
- Verifies definitions against golden words
- Detects if teaching common mistakes
- Generates trust score (0-100)

**Usage**:
```typescript
import { EnhancedResponseValidator } from '@/lib/ai';

const validation = await EnhancedResponseValidator.validateWithFactChecking({
  content: response.content,
  latex: response.latex,
  citations: response.citations
});

console.log('Trust Score:', validation.overallTrustScore);
console.log('Recommendation:', validation.recommendAction);
// 'accept' | 'review' | 'reject'
```

### 5. `stream-handler.ts` - Streaming Response Handler

**Purpose**: Handle Claude streaming responses with real-time processing.

**Key Features**:
- Streams responses for better UX
- Real-time LaTeX extraction
- Real-time citation extraction
- Progressive validation (optional)
- Error recovery

**Usage**:
```typescript
import { StreamHandler } from '@/lib/ai';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const stream = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [...],
  stream: true
});

const handler = new StreamHandler({
  onChunk: (chunk) => {
    // Update UI in real-time
    console.log('Received:', chunk.content);
  },
  onComplete: (response) => {
    console.log('Complete:', response);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

const response = await handler.handleStream(stream);
```

## Reference Data

### `/data/reference/notation-table.json`

Comprehensive notation reference covering:
- Function notation (f(x), f⁻¹(x), f∘g)
- Trigonometry (sin, cos, tan, inverse trig)
- Logarithms (ln, log, properties)
- Calculus (limits, derivatives)
- Special notation (absolute value, floor, ceiling, summation)

**Structure**:
```json
{
  "notations": [
    {
      "id": "func-notation",
      "notation": "f(x)",
      "meaning": "Output of function f at input x",
      "confusedWith": "f·x (multiplication)",
      "trap": "Parentheses indicate function application",
      "examples": [...],
      "category": "functions",
      "apUnit": 1
    }
  ]
}
```

### `/data/reference/golden-words.json`

Precise mathematical vocabulary to replace vague student language:
- "The function is increasing" (not "the graph goes up")
- "f(2) = 5" (not "at the point (2, 5)")
- "The domain is [0, ∞)" (not "x starts at 0")

**Structure**:
```json
{
  "categories": {
    "functions": {
      "terms": [
        {
          "term": "The function is increasing",
          "vagueTerm": "The graph goes up",
          "context": "Describing function behavior",
          "examples": [...]
        }
      ]
    }
  }
}
```

### `/data/reference/common-mistakes.json`

Database of mathematical mistakes to avoid:
- √(a² + b²) = a + b (WRONG)
- (a + b)² = a² + b² (WRONG)
- f⁻¹(x) = 1/f(x) (WRONG)

**Structure**:
```json
{
  "categories": {
    "algebra": {
      "mistakes": [
        {
          "id": "sqrt-distribute",
          "mistake": "√(a² + b²) = a + b",
          "correct": "√(a² + b²) cannot be simplified",
          "explanation": "Square root does not distribute over addition",
          "examples": [...],
          "severity": "high",
          "frequency": "very-common"
        }
      ]
    }
  }
}
```

## Validation Flow

### Level 1: Syntax Validation (Base)
- ✅ LaTeX syntax correct
- ✅ No forbidden phrases ("I think", "probably")
- ✅ No hallucination indicators ("obviously", "clearly")
- ✅ Domain restrictions noted
- ✅ Angle units specified

### Level 2: Mathematical Validation (Base)
- ✅ Algebraic steps preserve equality
- ✅ Numeric claims are reasonable
- ✅ No contradictions in content
- ✅ Consistent with conversation history

### Level 3: Fact-Checking (Enhanced)
- ✅ Claims verified against notation table
- ✅ Definitions match golden words
- ✅ Not teaching common mistakes
- ✅ Citations present for major claims

### Level 4: Trust Score (Enhanced)
- Combines all validation metrics
- Generates 0-100 trust score
- Recommends: accept | review | reject
- Provides detailed report for human review

## Best Practices

### For Prompt Engineering

1. **Always specify angle units**: "sin(30°) = 1/2" not "sin(30) = 1/2"
2. **Show every step**: Never skip "obvious" steps
3. **Verify claims**: Include numerical examples
4. **Cite sources**: Reference notation table and golden words
5. **Check domains**: State domain restrictions explicitly

### For Validation

1. **Validate before showing**: Always run validation before displaying to students
2. **Use enhanced validation for critical responses**: Complex proofs, formulas
3. **Log flagged responses**: Track what gets flagged for human review
4. **Update reference materials**: Add new mistakes as they're discovered
5. **Monitor trust scores**: Track average trust scores over time

### For Error Handling

1. **Graceful degradation**: Show partial response if validation passes
2. **Clear error messages**: Tell user what went wrong
3. **Retry logic**: Auto-retry on transient errors
4. **Fallback responses**: Have templated responses for common errors
5. **Human escalation**: Flag for human review when uncertain

## Anti-Hallucination Checklist

Before deploying ANY AI response, verify:

- [ ] Every formula is cited or verifiable
- [ ] No uncertain language ("I think", "probably")
- [ ] No hallucination indicators ("obviously", "clearly")
- [ ] All LaTeX is syntactically valid
- [ ] Domain restrictions are stated
- [ ] Angle units are specified
- [ ] Steps are mathematically valid
- [ ] No common mistakes being taught
- [ ] Numerical examples verify claims
- [ ] Trust score > 80

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_api_key_here

# Optional
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.2  # Lower for math (more deterministic)
AI_VALIDATION_STRICT=true
```

### Tuning Parameters

```typescript
// Context Builder
const context = await ContextBuilder.buildContext(problem, history, {
  maxTokens: 4000,          // Adjust based on model
  includeAllMistakes: false // True for complex problems
});

// Stream Handler
const handler = new StreamHandler({
  validateRealTime: false,  // True for immediate feedback
  extractCitations: true    // Always true in production
});
```

## Testing

### Unit Tests

```typescript
import { AIResponseValidator } from '@/lib/ai';

// Test hallucination detection
const response = { content: "Obviously, sin(x) is always positive..." };
const validation = await AIResponseValidator.validate(response);
expect(validation.warnings).toContain('hallucination indicator');

// Test common mistake detection
const badResponse = { content: "√(a² + b²) = a + b" };
const enhanced = await EnhancedResponseValidator.validateWithFactChecking(badResponse);
expect(enhanced.recommendAction).toBe('reject');
```

### Integration Tests

```typescript
// Full workflow test
const prompt = generateTutorPrompt({ mode: 'explanation', problemContext });
const response = await callClaudeAPI(prompt);
const validation = await EnhancedResponseValidator.validateWithFactChecking(response);
expect(validation.overallTrustScore).toBeGreaterThan(80);
```

## Metrics to Track

- **Trust Score Distribution**: Track percentile distribution
- **Validation Pass Rate**: % of responses passing without review
- **Common Failures**: Most frequent validation errors
- **Fact-Check Accuracy**: Manual spot-checks of fact-checked claims
- **False Positive Rate**: Valid responses flagged incorrectly
- **Response Time**: End-to-end latency including validation

## Troubleshooting

### Low Trust Scores

**Problem**: Trust scores consistently below 70

**Solutions**:
1. Add more examples to reference materials
2. Strengthen system prompt with more explicit rules
3. Increase temperature for less certain domains
4. Review and update common mistakes database

### Too Many False Positives

**Problem**: Valid responses being flagged

**Solutions**:
1. Tune validation thresholds
2. Improve pattern matching in validators
3. Add more examples to golden words
4. Whitelist known-good patterns

### Slow Validation

**Problem**: Validation taking too long

**Solutions**:
1. Disable real-time validation in stream handler
2. Reduce maxTokens in context builder
3. Cache reference material lookups
4. Run validation async after showing response

## Future Enhancements

- [ ] Semantic similarity checking for definitions
- [ ] Automated theorem verification with CAS
- [ ] Multi-step proof validation
- [ ] Student error pattern learning
- [ ] Adaptive difficulty based on validation confidence
- [ ] A/B testing different prompts

## Support

For issues or questions:
1. Check validation logs for specific errors
2. Review reference materials for coverage
3. Test with simplified inputs
4. Consult validation report for details

## License

MIT - Part of the AP Precalculus Tutor project
