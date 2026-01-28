# LaTeX Math Rendering Fix - Complete Analysis

## Issue Summary

Math expressions in the AI Tutor chat were breaking across lines, causing expressions like `$5^3 \cdot 5^2 = 5^{3 + 2}$` and `$XY + X = 7$` to render as separate pieces instead of inline with their surrounding text.

## Root Cause Analysis - Multiple Fixes Required

### Previous Fix (Delimiter Standardization)
The first issue was inconsistent LaTeX delimiters (`\( \)` vs `$`). This was fixed by standardizing on `$` and `$$` across the entire system. See the previous sections below for details.

### Current Fix (Rendering Logic - January 28, 2026)

**The New Problem**: Even with correct delimiters, math expressions were still breaking across lines.

#### Initial Hypothesis (Incorrect)
Initially suspected the regex pattern `/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g` was causing the issue.

#### Actual Root Cause (Correct)
**The regex was working perfectly.** The issue was in the **rendering logic** at lines 248-283 in `ChatInterface.tsx`.

The old rendering logic wrapped every text fragment in separate `<p>` tags:

```jsx
// OLD CODE (BROKEN)
{(message.content || "").split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).map((part, i) => {
  // Handle display math $$...$$
  if (part.startsWith("$$") && part.endsWith("$$")) {
    return <div><MathRenderer displayMode={true} /></div>
  }

  // Handle inline math $...$
  if (part.startsWith("$") && part.endsWith("$")) {
    return <MathRenderer />
  }

  // Handle regular text - THIS WAS THE ISSUE
  return part.split("\n").map((line, j) =>
    line ? (
      <p key={`${i}-${j}`} className="leading-relaxed whitespace-pre-wrap mb-2">
        {line}
      </p>
    ) : (
      <br key={`${i}-${j}`} />
    )
  );
})}
```

**Why This Failed:**

This caused React to render:
```html
<div class="prose">
  <p>Consider the equation </p>              <!-- Block element -->
  <span class="math-inline">XY + X = 7</span>  <!-- Inline element between blocks -->
  <p> and solve for X.</p>                    <!-- Block element -->
</div>
```

Since `<p>` tags are **block-level elements**, they forced line breaks around them. The inline math renderer appeared isolated between two block elements, creating unwanted line breaks.

## The Solution

Created a new `parseMessageContent()` function that intelligently groups content into structured blocks.

### New Data Structure

```typescript
// Message content types for structured rendering
type ContentBlock =
  | { type: "paragraph"; content: ContentPart[] }
  | { type: "display-math"; latex: string };

type ContentPart =
  | { type: "text"; content: string }
  | { type: "inline-math"; latex: string }
  | { type: "line-break" };
```

### Key Algorithm Improvements

1. **Inline math stays within paragraphs**: Expressions like `$x + y$` are added to the current paragraph, not treated as separate blocks

2. **Display math gets its own block**: Expressions like `$$x^2$$` flush the current paragraph and create a standalone block

3. **Intelligent paragraph breaking**: Only double newlines (`\n\n`) create new paragraphs

4. **Single newlines become `<br />`**: Within the same paragraph for proper text flow

### Implementation

```typescript
/**
 * Parse message content into structured blocks for proper rendering
 * This ensures inline math stays within paragraphs and doesn't break across lines
 */
function parseMessageContent(content: string): ContentBlock[] {
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = content.split(regex);

  const blocks: ContentBlock[] = [];
  let currentParagraph: ContentPart[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: "paragraph", content: [...currentParagraph] });
      currentParagraph = [];
    }
  };

  parts.forEach((part) => {
    if (!part) return;

    // Handle display math $$...$$ - always a separate block
    if (part.startsWith("$$") && part.endsWith("$$")) {
      flushParagraph();
      blocks.push({
        type: "display-math",
        latex: part.slice(2, -2),
      });
      return;
    }

    // Handle inline math $...$ - stays within paragraph
    if (part.startsWith("$") && part.endsWith("$")) {
      currentParagraph.push({
        type: "inline-math",
        latex: part.slice(1, -1),
      });
      return;
    }

    // Handle text - split by double newlines for paragraph breaks
    const paragraphs = part.split(/\n\n+/);

    paragraphs.forEach((para, pIdx) => {
      const lines = para.split(/\n/);

      lines.forEach((line, lIdx) => {
        if (line.trim()) {
          currentParagraph.push({
            type: "text",
            content: line,
          });

          // Add line break if not the last line in the paragraph
          if (lIdx < lines.length - 1) {
            currentParagraph.push({ type: "line-break" });
          }
        }
      });

      // Flush paragraph if we have double line breaks (new paragraph)
      if (pIdx < paragraphs.length - 1) {
        flushParagraph();
      }
    });
  });

  // Flush any remaining content
  flushParagraph();

  return blocks;
}
```

### New Rendering Logic

```jsx
const renderMessageContent = (content: string, isUser: boolean) => {
  const blocks = parseMessageContent(content);

  return blocks.map((block, blockIdx) => {
    if (block.type === "display-math") {
      return (
        <div key={blockIdx} className="my-4 flex justify-center">
          <MathRenderer
            latex={block.latex}
            displayMode={true}
            onClick={!isUser ? () => sendMessage(block.latex) : undefined}
          />
        </div>
      );
    }

    // Render paragraph with inline math and text together
    return (
      <p key={blockIdx} className="leading-relaxed mb-2">
        {block.content.map((part, partIdx) => {
          if (part.type === "inline-math") {
            return (
              <MathRenderer
                key={partIdx}
                latex={part.latex}
                onClick={!isUser ? () => sendMessage(part.latex) : undefined}
              />
            );
          }

          if (part.type === "line-break") {
            return <br key={partIdx} />;
          }

          // Text content
          return <span key={partIdx}>{part.content}</span>;
        })}
      </p>
    );
  });
};
```

## Results

Now React renders correctly:
```html
<div class="prose">
  <p class="leading-relaxed mb-2">
    <span>Consider the equation </span>
    <span class="math-inline">XY + X = 7</span>  <!-- stays inline! -->
    <span> and solve for X.</span>
  </p>
</div>
```

### Test Cases Verified

1. ✅ Simple inline math: `$5^3 \cdot 5^2 = 5^{3 + 2}$` renders inline with text
2. ✅ Expression breaking: `$XY + X = 7$` stays on the same line
3. ✅ Line breaks preserved: Text with `\n` keeps math inline but adds `<br />`
4. ✅ Display math: `$$x^2 + y^2 = r^2$$` gets its own centered block
5. ✅ Multiple paragraphs: Double `\n\n` creates separate paragraphs correctly
6. ✅ Complex content: Mix of inline math, display math, and text all render properly

## Benefits of This Fix

1. **Proper inline rendering**: Math expressions now truly render inline with text
2. **Better text flow**: Respects paragraph structure while keeping math integrated
3. **Cleaner DOM**: More semantic HTML structure
4. **Maintainable**: Clear separation of parsing and rendering logic
5. **Type-safe**: TypeScript types ensure correct data structure

## Files Modified (Current Fix)

- `/Users/dbryanjones/Dev_Lab/precalc-tutor/components/ai-tutor/ChatInterface.tsx`
  - Added `ContentBlock` and `ContentPart` type definitions (lines 19-27)
  - Added `parseMessageContent()` function (lines 29-100)
  - Added `renderMessageContent()` function (lines 302-342)
  - Updated `renderMessage()` to use new rendering logic (line 374)

## Key Takeaway

**The regex was never the problem.** The issue was that we were creating too many block-level elements (`<p>` tags) which forced line breaks. The solution was to parse the content into a structured format that keeps inline math within the same paragraph as its surrounding text.

---

# Previous Fix: Delimiter Standardization

## Root Causes Identified

### 1. **Inconsistent LaTeX Delimiters**
- **Issue**: The system was using multiple LaTeX delimiter formats simultaneously:
  - Prompts instructed AI to use `\( \)` and `\[ \]` delimiters
  - Frontend (ChatInterface) expected `$` and `$$` delimiters
  - API route extraction logic looked for `$` and `$$` only
  - StreamHandler tried to parse all four delimiter types at once

- **Impact**: This inconsistency caused:
  - AI responses using wrong delimiters that frontend couldn't parse
  - Regex patterns conflicting with each other
  - LaTeX expressions being split mid-formula

### 2. **Regex Pattern Issues**
- **Issue**: The extraction patterns used greedy vs non-greedy matching inconsistently:
  ```typescript
  // OLD: Could match across multiple expressions
  /\$\$[^$]+\$\$/g
  /\$[^$]+\$/g
  ```

- **Impact**:
  - Expressions with multiple `$` signs would break
  - Multi-line LaTeX could be split incorrectly
  - Nested delimiters caused parsing failures

### 3. **No Whitespace/Newline Protection**
- **Issue**: LaTeX expressions with legitimate newlines or spaces could be split by text processing
- **Impact**: Display math blocks that spanned multiple lines would render incorrectly

## Solution Implemented (Previous)

### 1. **Standardized on `$` and `$$` Delimiters**

Updated all system components to use only dollar sign delimiters:

**lib/ai/tutor-prompts.ts:**
```typescript
# LATEX FORMATTING (CRITICAL - READ CAREFULLY)

**IMPORTANT**: You MUST use the following LaTeX delimiters EXACTLY as specified:

- **Inline math**: Use single dollar signs: $expression$
  Example: The value of $x^2 + 5$ is important here.

- **Display math**: Use double dollar signs: $$expression$$
  Example: The quadratic formula is:
  $$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

**LaTeX Formatting Rules**:
1. NEVER use \( \) or \[ \] delimiters - ONLY use $ and $$
2. ALWAYS put display math ($$) on its own line with blank lines before and after
3. Keep inline math ($) continuous without line breaks inside the expression
```

### 2. **Improved Regex Patterns**

**app/api/ai/tutor/route.ts:**
```typescript
function extractLatex(content: string): string[] {
  const latex: string[] = [];

  // Pattern 1: Display math $$...$$
  // Non-greedy matching that won't cross display block boundaries
  const displayPattern = /\$\$((?:(?!\$\$).)+)\$\$/gs;
  let match;

  while ((match = displayPattern.exec(content)) !== null) {
    if (match[1]) {
      latex.push(match[1].trim());
    }
  }

  // Pattern 2: Inline math $...$
  // Negative lookbehind/lookahead to avoid matching $ in $$
  const inlinePattern = /(?<!\$)\$(?!\$)((?:(?!\$).)+)\$(?!\$)/gs;

  while ((match = inlinePattern.exec(content)) !== null) {
    if (match[1]) {
      latex.push(match[1].trim());
    }
  }

  return [...new Set(latex)]; // Remove duplicates
}
```

**Key Improvements:**
- `(?:(?!\$\$).)+` - Matches any character except `$$` sequence (prevents crossing boundaries)
- `(?<!\$)\$(?!\$)` - Matches single `$` not preceded or followed by another `$`
- Global flag with dotall (`/gs`) to handle multi-line expressions properly

## Testing

Build verification:
```bash
npm run build
# ✓ Compiled successfully
```

All test cases pass with proper inline rendering of math expressions.

## Monitoring Recommendations

1. **Check console logs** for LaTeX validation warnings
2. **Monitor user reports** of broken math rendering
3. **Review AI responses** periodically to ensure delimiter compliance
4. **Test with various math expressions** to ensure robustness

## Rollback Plan

If issues occur, revert:
- `components/ai-tutor/ChatInterface.tsx`
- `lib/ai/tutor-prompts.ts`
- `app/api/ai/tutor/route.ts`
- `lib/ai/stream-handler.ts`

The changes are self-contained and don't affect database schema or external APIs.
