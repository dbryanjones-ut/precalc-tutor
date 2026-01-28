# LaTeX Rendering Pipeline - Debug Guide

## Problem Description
LaTeX expressions are rendering incorrectly in the AI Tutor:
- Expressions breaking across lines
- `XY + X` appearing as separate elements
- `XYX = · Y'` showing broken rendering with plain text symbols
- Math not staying together

## Pipeline Overview

The LaTeX goes through these stages:

```
AI Response → Post-Processing → Extraction → Validation → Frontend Parsing → Rendering
```

## Debug Logging Added

### Backend (API Route)
File: `/Users/dbryanjones/Dev_Lab/precalc-tutor/app/api/ai/tutor/route.ts`

**STEP 1: Prompt Verification**
- Logs if LaTeX rules are in the system prompt
- Verifies Unicode symbol warnings are sent
- Checks placeholder warnings are sent

**STEP 2: Raw AI Response**
- Logs the raw response from Claude
- Checks for problematic patterns:
  - Plain · (middle dot)
  - Plain ± (plus-minus)
  - Plain π (pi)
  - Question marks (?) as placeholders

**STEP 3: Post-Processing**
- Logs if content was changed
- Shows all issues found
- Displays cleaned content

**STEP 4: Extraction**
- Logs all extracted LaTeX expressions
- Checks each expression for Unicode symbols
- Checks for question marks

**STEP 5: Validation**
- Validates with KaTeX
- Checks for problematic patterns
- Logs all errors and warnings

**STEP 6: Final Data**
- Logs the exact data sent to frontend
- Shows content preview
- Shows final latex array

### Frontend (Store)
File: `/Users/dbryanjones/Dev_Lab/precalc-tutor/stores/useAITutorStore.ts`

**STEP 1: API Response Received**
- Logs raw API response
- Shows data object structure

**STEP 2: Content Received**
- Shows content preview
- Displays latex array
- Checks for problematic patterns in received content

**STEP 3: Message Object Created**
- Logs the final message object
- Shows counts of content/latex/citations

### Frontend (Parsing)
File: `/Users/dbryanjones/Dev_Lab/precalc-tutor/components/ai-tutor/ChatInterface.tsx`

**NOTE:** Need to add logging to `parseMessageContent` function

**STEP 4: Parsing Message Content**
- Should log input content
- Should show split parts
- Should log created blocks
- Should identify where math expressions break

## How to Debug

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Open terminal** where dev server is running

4. **Ask a question in the AI Tutor** that involves math

5. **Watch logs in both places:**
   - **Terminal (Backend)**: See what AI generates and how it's processed
   - **Browser Console (Frontend)**: See what's received and how it's parsed

6. **Look for the breaking point:**
   - Does AI generate correct LaTeX?
   - Does post-processing corrupt it?
   - Does extraction work properly?
   - Does frontend parsing break it?

## Expected Flow (Correct)

### Input Problem: "Factor XY + X"

**AI Should Generate:**
```
To factor $XY + X$, we use the distributive property:

$$XY + X = X(Y + 1)$$

We factored out the common factor $X$.
```

**Post-Processing Should:**
- Leave it unchanged (no Unicode symbols)
- Log: "No issues found"

**Extraction Should Find:**
- Inline: `XY + X`
- Display: `XY + X = X(Y + 1)`
- Inline: `X`

**Frontend Should Parse:**
- Paragraph with inline math `XY + X`
- Display math block
- Paragraph with inline math `X`

**Rendering Should Show:**
- Text with inline math staying together
- Display math centered
- No breaking across lines

## Common Issues to Look For

### Issue 1: AI Generates Plain Text Symbols
**Symptom:** Logs show `·` or `π` in raw response

**Cause:** AI not following prompt instructions

**Fix:** Enhance prompt or increase temperature/sampling

### Issue 2: Post-Processor Corrupts LaTeX
**Symptom:** Content changes but becomes invalid

**Cause:** Regex patterns too aggressive

**Fix:** Adjust regex in LaTeXPostProcessor

### Issue 3: Extraction Breaks Expressions
**Symptom:** Extracted LaTeX is fragmented

**Cause:** Regex in extractLatex() splits expressions

**Fix:** Improve regex patterns

### Issue 4: Frontend Parsing Breaks Math
**Symptom:** Math appears in wrong blocks or fragmented

**Cause:** parseMessageContent() logic issue

**Fix:** Adjust parsing logic in ChatInterface.tsx

## Testing Checklist

After identifying the issue, test with:

1. **Simple inline math:**
   - Input: "What is x + 5?"
   - Should render: What is $x + 5$?

2. **Display math:**
   - Input: "Show me x^2 + 5x + 6 = 0"
   - Should render: $$x^2 + 5x + 6 = 0$$

3. **Mixed content:**
   - Should have inline and display math together
   - Inline should stay on same line as text

4. **Special symbols:**
   - Should use \cdot not ·
   - Should use \pm not ±
   - Should use \pi not π

5. **No placeholders:**
   - Should NEVER see (?) in math
   - Should be complete expressions

## Next Steps

1. Run a test query
2. Check all logs in sequence
3. Identify where LaTeX breaks
4. Fix that specific stage
5. Re-test with checklist above
