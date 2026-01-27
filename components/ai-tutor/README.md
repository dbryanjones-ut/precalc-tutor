# AI Tutor Components

Complete AI tutoring interface with image upload, OCR, and intelligent chat.

## Components Overview

### 1. ProblemUploader
**File**: `ProblemUploader.tsx`

Upload math problems via image or manual input.

**Features**:
- Drag-and-drop image upload
- Camera capture (mobile)
- OCR processing with confidence scores
- Manual LaTeX input fallback
- Image preview with crop capability
- Error handling and retry

**Props**:
```typescript
interface ProblemUploaderProps {
  onProblemExtracted?: (latex: string, imageUrl: string) => void;
  className?: string;
}
```

**Usage**:
```tsx
<ProblemUploader onProblemExtracted={(latex, img) => console.log(latex)} />
```

---

### 2. ChatInterface
**File**: `ChatInterface.tsx`

Interactive chat with AI tutor featuring LaTeX rendering.

**Features**:
- Real-time messaging
- LaTeX/math rendering
- Message history with auto-scroll
- Copy message content
- Citation display with links
- Typing indicators
- Clear conversation
- Accessible keyboard navigation

**Props**:
```typescript
interface ChatInterfaceProps {
  className?: string;
}
```

**Usage**:
```tsx
<ChatInterface />
```

---

### 3. ModeToggle
**File**: `ModeToggle.tsx`

Switch between Socratic and Explanation tutoring modes.

**Features**:
- Visual mode indication
- Tooltips explaining each mode
- Smooth animations
- Benefits list for each mode
- Mode comparison tips

**Modes**:
- **Socratic**: Guided questions for deeper learning
- **Explanation**: Direct step-by-step solutions

**Props**:
```typescript
interface ModeToggleProps {
  className?: string;
}
```

**Usage**:
```tsx
<ModeToggle />
```

---

### 4. QuickActions
**File**: `QuickActions.tsx`

One-click shortcuts for common tutoring requests.

**Features**:
- Mode-specific actions
- Contextual suggestions
- Session statistics
- Learning tips
- Disabled state handling

**Socratic Actions**:
- Give me a hint
- What's the first step?
- Explain this term
- Common mistakes

**Explanation Actions**:
- Show steps
- Show step 1
- Explain concept
- Similar example

**Props**:
```typescript
interface QuickActionsProps {
  className?: string;
}
```

**Usage**:
```tsx
<QuickActions />
```

---

### 5. SessionHistory
**File**: `SessionHistory.tsx`

Browse and manage past tutoring sessions.

**Features**:
- Session list with search
- Filter by completion status
- Resume previous sessions
- Export session data (JSON)
- Delete sessions
- Session statistics
- Problem preview with LaTeX

**Props**:
```typescript
interface SessionHistoryProps {
  onResumeSession?: (session: AITutoringSession) => void;
  className?: string;
}
```

**Usage**:
```tsx
<SessionHistory onResumeSession={(session) => console.log(session)} />
```

---

## Main Page

**File**: `/app/ai-tutor/page.tsx`

Complete AI tutor experience integrating all components.

**Features**:
- Tab navigation (Tutor / History)
- Settings panel
- Welcome modal for first-time users
- Auto-save to localStorage
- Error boundaries
- Responsive layout

**Layout**:
- **Desktop**: 3-column grid (uploader + mode | chat | actions)
- **Mobile**: Stacked single column

---

## State Management

Uses Zustand store: `useAITutorStore`

**State**:
```typescript
interface AITutorStore {
  currentSession: AITutoringSession | null;
  mode: TutoringMode;
  isLoading: boolean;
  error: string | null;
}
```

**Actions**:
- `startSession(uploadedImage?, extractedProblem?)`: Create new session
- `sendMessage(content)`: Send user message and get AI response
- `addAssistantMessage(message)`: Add AI response to conversation
- `toggleMode()`: Switch between modes
- `setMode(mode)`: Set specific mode
- `endSession()`: Complete and save session
- `setLoading(loading)`: Set loading state
- `setError(error)`: Set error state

---

## API Integration

### OCR Endpoint
**POST** `/api/ocr`

Upload image for LaTeX extraction.

**Request**:
```typescript
FormData {
  image: File
}
```

**Response**:
```typescript
{
  success: boolean;
  latex: string;
  confidence: number; // 0-1
  plainText: string;
  error?: string;
  processingTime: number; // ms
}
```

### AI Tutor Endpoint
**POST** `/api/ai/tutor`

Send message and get tutoring response.

**Request**:
```typescript
{
  message: string;
  mode: "socratic" | "explanation";
  context: {
    extractedProblem: string;
    messageHistory: ChatMessage[];
  };
}
```

**Response**:
```typescript
{
  content: string;
  latex?: string[];
  citations?: Citation[];
}
```

---

## Data Persistence

Sessions stored in **localStorage**:
- Key: `ai-tutor-sessions`
- Max 50 sessions
- Auto-save on session update
- JSON format

**Session Structure**:
```typescript
interface AITutoringSession {
  id: string;
  timestamp: string; // ISO
  uploadedImage?: string; // Base64
  extractedProblem: string; // LaTeX
  mode: TutoringMode;
  messages: ChatMessage[];
  problemsSolved: string[];
  conceptsCovered: string[];
  duration: number; // seconds
  questionsAsked: number;
  hintsGiven: number;
  completed: boolean;
  lastUpdated: string; // ISO
  tags: string[];
  unit?: string;
}
```

---

## Accessibility Features

### WCAG 2.1 AA Compliance
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

### ADHD-Friendly
- Minimal distractions mode
- Clear visual hierarchy
- Progress indicators
- Reduce motion option

### Visual Accessibility
- High contrast mode
- Color-blind safe palette
- Adjustable font sizes
- Clear focus indicators

---

## Styling

Uses Tailwind CSS with custom design tokens:

**Colors**:
- Primary: `oklch(0.488 0.243 264.376)` (purple-blue)
- Destructive: `oklch(0.704 0.191 22.216)` (red)
- Muted: `oklch(0.269 0 0)` (gray)

**Animations**:
- Fade in: 200ms ease
- Slide in: 300ms ease
- Bounce: 500ms spring

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## Error Handling

All components wrapped in `ErrorBoundary`:

**Handles**:
- Network failures
- OCR errors
- AI response errors
- Invalid LaTeX
- Storage quota exceeded

**User Feedback**:
- Toast notifications (via Sonner)
- Inline error messages
- Retry mechanisms
- Fallback UI

---

## Performance Optimizations

- Lazy loading for heavy components
- Debounced search in history
- Virtual scrolling for long message lists
- Image compression before upload
- Memoized LaTeX rendering
- Auto-save throttling (1s)

---

## Testing Recommendations

### Unit Tests
- Component rendering
- State management
- API response handling
- LaTeX parsing

### Integration Tests
- Upload → OCR → Chat flow
- Mode switching
- Session save/load
- History navigation

### E2E Tests
- Complete tutoring session
- Error recovery
- Accessibility compliance
- Mobile responsiveness

---

## Future Enhancements

### Planned Features
- [ ] Voice input for questions
- [ ] Handwriting recognition
- [ ] Multi-language support
- [ ] Offline mode with service worker
- [ ] Real-time collaboration
- [ ] Video explanations
- [ ] Practice problem generation
- [ ] Progress tracking integration
- [ ] Export to PDF/Markdown
- [ ] Spaced repetition reminders

### Performance
- [ ] IndexedDB migration
- [ ] WebSocket for streaming
- [ ] Image CDN integration
- [ ] LaTeX caching
- [ ] Request deduplication

---

## Development

### Local Setup
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint
```

### File Structure
```
components/ai-tutor/
├── ProblemUploader.tsx    # Image upload & OCR
├── ChatInterface.tsx      # AI chat interface
├── ModeToggle.tsx         # Socratic/Explanation toggle
├── QuickActions.tsx       # Quick action buttons
├── SessionHistory.tsx     # Session management
├── index.ts               # Barrel exports
└── README.md              # This file

app/ai-tutor/
└── page.tsx               # Main AI tutor page

stores/
└── useAITutorStore.ts     # Zustand state management

types/
└── ai-session.ts          # TypeScript types
```

---

## Troubleshooting

### OCR Not Working
1. Check API endpoint is running
2. Verify image format (PNG, JPG, WebP)
3. Check image size (< 10MB)
4. Review browser console for errors

### Chat Not Responding
1. Verify API key is set
2. Check network tab for errors
3. Ensure session is started
4. Review message format

### Sessions Not Saving
1. Check localStorage quota
2. Clear old sessions
3. Verify JSON serialization
4. Check browser permissions

### LaTeX Not Rendering
1. Verify KaTeX is loaded
2. Check LaTeX syntax
3. Review console for errors
4. Try manual input fallback

---

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check TypeScript types
4. Test with example data
5. File bug report with reproduction

---

**Built with**: React 19, Next.js 15, TypeScript, Tailwind CSS, Zustand, KaTeX

**Last Updated**: January 2025
