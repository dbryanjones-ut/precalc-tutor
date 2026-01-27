# AI Tutor Demo Guide

Complete walkthrough of the AI Tutor interface features.

## Quick Start

1. **Navigate to AI Tutor**
   ```
   http://localhost:3000/ai-tutor
   ```

2. **Upload a Problem**
   - Drag and drop an image
   - Or click "Browse Files"
   - Or click "Take Photo" (mobile)
   - Or click "Type Problem Manually"

3. **Start Chatting**
   - Type your question in the chat input
   - Or use Quick Actions for common requests
   - Press Enter to send (Shift+Enter for new line)

---

## Feature Demos

### 1. Image Upload Flow

**Test Case**: Upload a quadratic equation image

**Steps**:
1. Open `/ai-tutor`
2. Drag image of: `x^2 + 5x + 6 = 0`
3. Wait for OCR processing (2-3 seconds)
4. Verify extracted LaTeX appears
5. Check confidence score (should be > 70%)
6. Problem automatically starts session

**Expected Result**:
- Image preview shows uploaded file
- OCR confidence displayed
- LaTeX rendered correctly
- Session starts automatically
- Chat interface becomes active

---

### 2. Manual LaTeX Input

**Test Case**: Type problem manually

**Steps**:
1. Click "Type Problem Manually"
2. Enter: `\frac{x^2 - 4}{x + 2}`
3. See live LaTeX preview
4. Click "Use This Problem"
5. Session starts with typed problem

**Expected Result**:
- Textarea expands for input
- Preview updates in real-time
- LaTeX renders correctly
- No OCR processing needed
- Immediate session start

---

### 3. Socratic Mode Chat

**Test Case**: Guided learning conversation

**Steps**:
1. Upload problem: `2x + 5 = 13`
2. Ensure "Socratic" mode is active
3. Click "Give me a hint"
4. Answer the AI's guiding question
5. Continue conversation
6. AI asks follow-up questions

**Expected Chat Flow**:
```
User: Give me a hint
AI: What's the first step to isolate x?
User: Subtract 5 from both sides?
AI: Exactly! What does that give you?
User: 2x = 8
AI: Great! Now what?
```

**Expected Behavior**:
- AI asks questions (doesn't give answers)
- Progressive hints (1, 2, 3 levels)
- Encourages student reasoning
- Validates thinking process

---

### 4. Explanation Mode Chat

**Test Case**: Direct solution path

**Steps**:
1. Upload problem: `x^2 - 5x + 6 = 0`
2. Switch to "Explanation" mode
3. Click "Show steps"
4. Review step-by-step solution
5. Each step includes explanation

**Expected Response**:
```
Step 1: Factor the quadratic
  (x - 2)(x - 3) = 0

Step 2: Apply zero product property
  x - 2 = 0  OR  x - 3 = 0

Step 3: Solve each equation
  x = 2  OR  x = 3

Solution: x = 2, 3
```

**Expected Behavior**:
- Complete solution shown
- Each step explained
- LaTeX rendered for math
- Can ask clarifying questions

---

### 5. Quick Actions

**Test Case**: One-click shortcuts

**Socratic Quick Actions**:
- "Give me a hint" → Progressive hint
- "What's the first step?" → Starting guidance
- "Explain this term" → Concept explanation
- "Common mistakes" → Warning about pitfalls

**Explanation Quick Actions**:
- "Show steps" → Full solution
- "Show step 1" → Just first step
- "Explain concept" → Theory background
- "Similar example" → Related problem

**Test Flow**:
1. Upload any problem
2. Click each quick action
3. Verify appropriate response
4. Check action is disabled without session

---

### 6. Mode Switching

**Test Case**: Switch between learning styles

**Steps**:
1. Start session in Socratic mode
2. Ask a few questions
3. Switch to Explanation mode
4. Notice response style change
5. Switch back to Socratic
6. Previous messages preserved

**Expected Behavior**:
- Mode switch doesn't clear chat
- Response style changes immediately
- Visual mode indicator updates
- Tooltip shows mode benefits
- Quick actions adapt to mode

---

### 7. Session History

**Test Case**: Browse past sessions

**Steps**:
1. Complete 3-4 tutoring sessions
2. Click "History" button
3. Browse session list
4. Search for specific problem
5. Filter by completed status
6. Resume a previous session
7. Export session as JSON
8. Delete old session

**Expected Features**:
- Sessions sorted by date (newest first)
- Problem preview with LaTeX
- Session stats (messages, duration, questions)
- Search filters by problem/tags
- Resume continues where left off
- Export downloads JSON file
- Delete confirms before removing

---

### 8. Citations and References

**Test Case**: Reference links in responses

**Steps**:
1. Ask: "What's the quadratic formula?"
2. AI response includes citation
3. Click citation card
4. Navigate to reference material

**Expected Citation Types**:
- **Notation**: Links to notation table
- **Golden Word**: Links to vocabulary
- **Common Mistake**: Links to pitfalls guide
- **Reference**: Links to concept page

**Citation Card Format**:
```
┌─────────────────────────────┐
│ 📘 Quadratic Formula        │
│ Used to solve ax² + bx + c = 0 │
│ → Learn more                │
└─────────────────────────────┘
```

---

### 9. Accessibility Features

**Test Case**: Screen reader and keyboard nav

**Keyboard Navigation**:
- `Tab` → Navigate between elements
- `Enter` → Send message / activate button
- `Shift + Enter` → New line in chat
- `Esc` → Close modal/panel
- `Arrow keys` → Navigate history

**Screen Reader**:
- All images have alt text
- ARIA labels on interactive elements
- Live region for new messages
- Role="log" for chat history
- Math expressions have accessible labels

**High Contrast**:
- Open settings panel
- Enable "High Contrast Mode"
- All text meets WCAG AA standards
- Focus indicators clearly visible

---

### 10. Error Handling

**Test Case**: Graceful error recovery

**Network Error**:
1. Disconnect internet
2. Try to send message
3. See error toast
4. Reconnect internet
5. Retry message
6. Message sends successfully

**OCR Failure**:
1. Upload corrupted image
2. OCR fails with error
3. Manual input option appears
4. Type problem manually
5. Session continues normally

**Invalid LaTeX**:
1. Type invalid LaTeX: `\frac{x`
2. Preview shows error
3. Correction guidance shown
4. Fix LaTeX syntax
5. Preview updates correctly

---

## Edge Cases

### Empty States

**No Session**:
- Chat shows welcome message
- Quick actions disabled
- History shows "No sessions yet"

**No History**:
- History tab shows empty state
- Encourages starting first session

**Low OCR Confidence**:
- Warning toast appears
- Manual input auto-opens
- Confidence score displayed

### Long Sessions

**100+ Messages**:
- Virtual scrolling (not yet implemented)
- Auto-scroll to bottom
- "Scroll to bottom" button

**Large Images**:
- Compression before upload
- Loading spinner during process
- Error if > 10MB

### Mobile Experience

**Portrait Mode**:
- Stacked single column
- Uploader at top
- Chat in middle
- Quick actions at bottom

**Landscape Mode**:
- 2-column layout
- Uploader + chat side-by-side

**Touch Gestures**:
- Swipe to clear message
- Pull to refresh history
- Pinch to zoom image

---

## Performance Testing

### Load Times

**Initial Page Load**:
- Should load in < 2s
- Progressive rendering
- Critical CSS inline

**Image Upload**:
- < 1s for compression
- 2-3s for OCR processing
- Instant preview

**Message Send**:
- Optimistic UI update
- Streaming response (if implemented)
- < 3s for AI response

### Memory Usage

**After 50 Messages**:
- Memory should stay < 100MB
- No memory leaks
- Efficient re-renders

**History with 50 Sessions**:
- Fast filtering (< 100ms)
- Search debounced (300ms)
- Smooth scrolling

---

## Data Validation

### LaTeX Validation

**Valid Inputs**:
- `x^2 + 5x + 6`
- `\frac{a}{b}`
- `\sqrt{x + 1}`
- `\int_{0}^{1} x dx`

**Invalid Inputs**:
- `\frac{x` (unclosed)
- `}x{` (mismatched braces)
- `\unknown{x}` (unknown command)

**Sanitization**:
- XSS prevention
- SQL injection safe
- Path traversal safe

---

## Settings Panel

### Accessibility Settings

**Options**:
- [ ] High Contrast Mode
- [ ] Reduce Motion
- [ ] Screen Reader Mode
- Font Size: Small | Medium | Large | XL

### Learning Preferences

**Options**:
- [x] Auto-save Sessions (default on)
- [ ] Show Confidence Scores
- [ ] Minimize Distractions
- Default Mode: Socratic | Explanation

### Data Management

**Actions**:
- Export All Sessions → Downloads JSON
- Clear All History → Confirms first
- View Storage Usage → Shows localStorage size

---

## Common User Flows

### Flow 1: Homework Help
```
1. Upload homework problem
2. Try solving on paper
3. Ask for hint when stuck
4. Get guided question
5. Work through with AI
6. Complete solution
7. Session auto-saves
```

### Flow 2: Concept Review
```
1. Type problem manually
2. Switch to Explanation mode
3. Ask "Explain the concept"
4. Read full explanation
5. Click citation links
6. Export session for notes
```

### Flow 3: Test Prep
```
1. Browse history for similar problems
2. Resume previous session
3. Ask for similar example
4. Practice new problem
5. Check work with AI
6. Track questions asked
```

---

## Troubleshooting Demos

### Issue: Chat not responding

**Debug Steps**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Verify session exists in store
5. Try refreshing page

**Common Causes**:
- No active session
- Network timeout
- Invalid API key
- Rate limiting

### Issue: OCR incorrect

**Solutions**:
1. Retake clearer photo
2. Crop to just problem
3. Increase image quality
4. Use manual input
5. Report issue with image

### Issue: LaTeX not rendering

**Check**:
1. KaTeX loaded (check console)
2. Valid LaTeX syntax
3. No conflicting CSS
4. Try in incognito mode

---

## Analytics to Track

**User Engagement**:
- Sessions per user
- Messages per session
- Session completion rate
- Average session duration

**Feature Usage**:
- Upload vs manual input %
- Mode preference (Socratic vs Explanation)
- Quick action click rate
- Citation click rate

**Quality Metrics**:
- OCR accuracy rate
- User satisfaction (implicit)
- Retry rate after error
- Session abandonment rate

---

## Demo Data

### Sample Problems

**Algebra**:
```latex
2x + 5 = 13
x^2 - 5x + 6 = 0
\frac{x + 3}{x - 2} = 5
```

**Functions**:
```latex
f(x) = 2x^2 - 3x + 1
g(x) = \sqrt{x + 4}
(f \circ g)(x) = ?
```

**Trigonometry**:
```latex
\sin^2(x) + \cos^2(x) = 1
\tan(\theta) = \frac{3}{4}, \text{ find } \sin(\theta)
```

**Calculus**:
```latex
\lim_{x \to 0} \frac{\sin(x)}{x}
\frac{d}{dx}[x^2 + 3x]
```

---

## Known Limitations

1. **No streaming responses** (yet)
   - Responses appear all at once
   - Plan: Implement SSE

2. **localStorage only** (no IndexedDB yet)
   - Limited to ~5MB storage
   - Plan: Migrate to IndexedDB

3. **No voice input** (yet)
   - Text only
   - Plan: Add Web Speech API

4. **No multi-user** (local only)
   - No cloud sync
   - Plan: Add user accounts

5. **No offline mode** (yet)
   - Requires internet
   - Plan: Service worker

---

## Success Criteria

**User completes demo successfully if**:
- ✅ Uploads problem (image or manual)
- ✅ Has conversation with AI
- ✅ Uses quick actions
- ✅ Switches modes
- ✅ Views session history
- ✅ Exports session
- ✅ Navigates without errors

**Quality checklist**:
- ✅ No console errors
- ✅ Fast response times (< 3s)
- ✅ LaTeX renders correctly
- ✅ Mobile responsive
- ✅ Keyboard accessible
- ✅ Graceful error handling

---

**Ready to demo!** Open `/ai-tutor` and start exploring.
