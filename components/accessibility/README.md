# Accessibility Features

Comprehensive accessibility implementation for the PreCalc Tutor application, designed specifically for students with dyslexia, ADHD, and color vision deficiency.

## Features Overview

### 1. Dyslexia Support (`DyslexiaMode.tsx`)

**Features:**
- OpenDyslexic font integration
- Adjustable line spacing (1.5x - 2.5x)
- Color overlays to reduce contrast (cream, blue, green, pink)
- Simplified language mode
- Content chunking utilities

**Components:**
- `<DyslexiaMode />` - Global dyslexia mode provider
- `<ContentChunker />` - Breaks long text into digestible chunks
- `<SimplifiedText />` - Provides simplified language alternatives

**Usage:**
```tsx
import { ContentChunker, SimplifiedText } from "@/components/accessibility";

// Content chunking
<ContentChunker content={longText} chunkSize={3} />

// Simplified text
<SimplifiedText
  standard="This quadratic equation has two distinct real roots."
  simplified="This equation has two answers."
/>
```

### 2. Reading Ruler (`ReadingRuler.tsx`)

**Features:**
- Horizontal line overlay that follows cursor
- Adjustable height and opacity
- Tinted background above/below for focus
- Keyboard controls (Ctrl+Arrow keys to move)
- Mouse/keyboard toggle (Ctrl+M)
- Press Escape to toggle off

**Keyboard Shortcuts:**
- `Escape` - Toggle reading ruler on/off
- `Ctrl + ↑/↓` - Move ruler up/down manually
- `Ctrl + M` - Toggle between mouse and keyboard control

**Settings:**
- Height: 40-120px
- Overlay opacity: 10-50%

### 3. Focus Timer (`FocusTimer.tsx`)

**Features:**
- Pomodoro-style timer (customizable intervals)
- Visual countdown with circular progress
- Work/break session tracking
- Gentle audio notifications
- Auto-start break option
- Session statistics

**Default Settings:**
- Work interval: 25 minutes
- Break interval: 5 minutes
- Customizable from 15-60 minutes (work) and 5-15 minutes (break)

**Usage:**
The timer appears automatically when enabled in settings. It displays in the bottom-left corner and doesn't interfere with content.

### 4. ADHD Scaffolding (`ADHDScaffold.tsx`)

**Components:**

#### S.O.S. Protocol
Shows "Stuck? Overwhelmed? Scared?" steps when students feel stuck:
1. Take 3 Deep Breaths
2. Read the Problem Again
3. What Do I Know?
4. What Do I Need?
5. Ask for a Hint

```tsx
import { SOSProtocol } from "@/components/accessibility";

<SOSProtocol className="mb-6" />
```

#### Task Sequencer
Shows one step at a time to prevent overwhelm:

```tsx
import { TaskSequencer } from "@/components/accessibility";

<TaskSequencer
  steps={[
    {
      id: "step-1",
      title: "Identify the function type",
      description: "Look at the equation structure",
      content: <StepOneContent />
    },
    // ... more steps
  ]}
  onComplete={() => console.log("All steps complete!")}
/>
```

#### Progress Chunker
Breaks progress into smaller, encouraging chunks:

```tsx
import { ProgressChunker } from "@/components/accessibility";

<ProgressChunker
  current={7}
  total={25}
  chunkSize={5}
  label="Problems Completed"
/>
```

### 5. Color Blind Support (`ColorBlindMode.tsx`)

**Modes:**
- Deuteranopia (red-green color blindness)
- Protanopia (red-green color blindness)
- Tritanopia (blue-yellow color blindness)

**Features:**
- Color-blind safe palettes
- Optional pattern overlays (dots, stripes, checkers, waves)
- Validated for sufficient contrast

**Components:**

```tsx
import { ColorBlindSwatch, ColorBlindLegend } from "@/components/accessibility";

// Single color swatch with pattern
<ColorBlindSwatch
  color="#0066CC"
  pattern="stripes"
  className="w-8 h-8 rounded"
  label="Primary color"
/>

// Legend for charts
<ColorBlindLegend
  items={[
    { label: "Series A", color: "#0066CC", pattern: "dots" },
    { label: "Series B", color: "#FF6600", pattern: "stripes" },
  ]}
/>
```

### 6. Accessibility Provider (`AccessibilityProvider.tsx`)

Central provider that coordinates all accessibility features. Automatically included in the app layout.

**Features:**
- Global settings management
- Font loading
- Reduced motion support
- High contrast mode
- Keyboard navigation enhancement
- Skip to main content link
- Screen reader announcements

**Screen Reader Announcements:**

```tsx
import { announceToScreenReader } from "@/components/accessibility";

// Announce a message to screen readers
announceToScreenReader("Problem solved correctly!", "polite");

// Urgent announcement
announceToScreenReader("Error: Invalid input", "assertive");
```

## Settings Management

All accessibility settings are managed through Zustand store at `/stores/useSettingsStore.ts`.

### Quick Setup Presets

**Dyslexia Preset:**
- OpenDyslexic font: ON
- Line spacing: 1.75x
- Color overlay: Cream
- Simplified language: ON
- Reading ruler: ON
- Font size: Large
- Reduced motion: ON

**ADHD Preset:**
- S.O.S. Protocol: Always visible
- Break reminders: ON (25 min work, 5 min break)
- Focus timer: Enabled
- Minimize distractions: ON
- Task sequencing: ON
- Progress chunking: ON
- Reduced motion: ON

**Color Blind Preset:**
- Mode: Deuteranopia
- Use patterns: ON
- High contrast: ON

### Custom Settings

Navigate to `/settings` to customize individual settings. All changes are saved automatically to local storage.

## WCAG 2.1 AA Compliance

### Implemented Standards

✅ **1.4.3 Contrast (Minimum)** - All text has minimum 4.5:1 contrast ratio
✅ **1.4.4 Resize Text** - Text can be resized up to 200% without loss of functionality
✅ **1.4.10 Reflow** - Content reflows at 320px viewport without horizontal scrolling
✅ **1.4.11 Non-text Contrast** - UI components have 3:1 contrast minimum
✅ **1.4.12 Text Spacing** - Text spacing can be adjusted without loss of content
✅ **1.4.13 Content on Hover/Focus** - Hoverable content is dismissible and persistent

✅ **2.1.1 Keyboard** - All functionality available via keyboard
✅ **2.1.2 No Keyboard Trap** - Keyboard focus can move away from all components
✅ **2.4.3 Focus Order** - Focus order is logical and meaningful
✅ **2.4.7 Focus Visible** - Keyboard focus is clearly visible (3px outline)

✅ **3.2.3 Consistent Navigation** - Navigation is consistent across pages
✅ **3.2.4 Consistent Identification** - Components are identified consistently

✅ **4.1.2 Name, Role, Value** - All UI components have appropriate ARIA labels
✅ **4.1.3 Status Messages** - Status messages announced to screen readers

### Touch Targets

All interactive elements have minimum 44x44px touch targets per WCAG 2.5.5 (AAA).

## Testing

### Automated Testing

```bash
# Run accessibility tests with axe-core
npm run test:a11y

# Run with specific viewport
npm run test:a11y -- --viewport=mobile
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators clearly visible
- [ ] No keyboard traps
- [ ] Skip to main content works
- [ ] All functionality accessible via keyboard

#### Screen Reader Testing

**VoiceOver (macOS):**
```bash
# Enable VoiceOver
Cmd + F5
```

Test:
- [ ] Page structure announced correctly
- [ ] All headings identified
- [ ] Form labels associated with inputs
- [ ] Button purposes clear
- [ ] ARIA live regions announce updates
- [ ] Images have alt text

**NVDA (Windows):**
- [ ] Similar checks as VoiceOver
- [ ] Test in Firefox and Chrome

#### Dyslexia Mode
- [ ] OpenDyslexic font loads correctly
- [ ] Line spacing increases
- [ ] Color overlays apply without breaking layout
- [ ] Content chunking works for long text
- [ ] Reading ruler follows cursor/focus

#### ADHD Support
- [ ] S.O.S. Protocol displays when enabled
- [ ] Focus timer counts down correctly
- [ ] Break notifications appear
- [ ] Task sequencer shows one step at a time
- [ ] Progress chunking displays chunks correctly
- [ ] Minimize distractions hides non-essential UI

#### Color Blind Mode
- [ ] Color palettes change appropriately
- [ ] Patterns overlay correctly when enabled
- [ ] Charts/graphs remain distinguishable
- [ ] All information conveyed without color alone

#### Responsive Design
- [ ] Test at 320px viewport (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1024px (desktop)
- [ ] No horizontal scrolling
- [ ] Touch targets adequate on mobile

#### High Contrast Mode
- [ ] Border contrast sufficient
- [ ] Text remains readable
- [ ] Focus indicators visible
- [ ] Icons distinguishable

#### Reduced Motion
- [ ] Animations disabled or minimal
- [ ] Transitions shortened
- [ ] No autoplay videos
- [ ] Respects prefers-reduced-motion

### Browser Testing

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance

All accessibility features are optimized for performance:

- **Font Loading:** OpenDyslexic loaded only when enabled
- **Reading Ruler:** Uses CSS transforms for 60fps performance
- **Focus Timer:** RequestAnimationFrame for smooth countdown
- **Settings:** Persisted in localStorage, cached in memory
- **CSS Variables:** Global styles updated via CSS custom properties

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: 14+
- Chrome Mobile: 90+

## Future Enhancements

Potential additions for even better accessibility:

- [ ] Text-to-speech for problem reading
- [ ] Speech input for answers
- [ ] Augmented reading mode (highlighting while reading)
- [ ] Customizable keyboard shortcuts
- [ ] Bionic reading mode
- [ ] Additional color blind modes (Achromatopsia)
- [ ] Dark mode for specific cognitive needs
- [ ] Font size per-component customization

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [OpenDyslexic Font](https://opendyslexic.org/)
- [ADHD & Learning Resources](https://chadd.org/)
- [Color Blind Awareness](https://www.colourblindawareness.org/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)

## Support

For issues or suggestions regarding accessibility features, please file an issue with the `accessibility` label.
