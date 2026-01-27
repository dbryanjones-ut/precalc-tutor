# PreCalc Tutor API Setup Guide

Complete guide to setting up and using the production-ready API routes.

## Table of Contents

1. [Quick Start](#quick-start)
2. [File Overview](#file-overview)
3. [Environment Configuration](#environment-configuration)
4. [Testing the APIs](#testing-the-apis)
5. [Integration Guide](#integration-guide)
6. [Troubleshooting](#troubleshooting)

## Quick Start

### 1. Install Dependencies

All required dependencies are already in `package.json`:
- `@anthropic-ai/sdk` - Claude API
- `zod` - Runtime validation
- `next` - API routes framework

No additional packages needed!

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local

# Add your Anthropic API key (REQUIRED)
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here" >> .env.local

# Optional: Add Mathpix credentials for better OCR
echo "MATHPIX_APP_ID=your-app-id" >> .env.local
echo "MATHPIX_APP_KEY=your-app-key" >> .env.local
```

Get your API keys:
- Anthropic: https://console.anthropic.com/
- Mathpix: https://mathpix.com/ocr (optional)

### 3. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/*`

### 4. Test the APIs

```bash
# Run the automated test script
./scripts/test-api.sh

# Or test manually with curl
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I solve x^2 + 5x + 6 = 0?",
    "mode": "socratic"
  }'
```

## File Overview

### API Route Files

```
app/api/
├── ai/
│   └── tutor/
│       └── route.ts          # AI tutoring endpoint
├── ocr/
│   └── route.ts              # Image OCR processing
├── sessions/
│   └── route.ts              # Session management
└── README.md                 # API documentation
```

### Supporting Library Files

```
lib/api/
├── rate-limiter.ts           # Rate limiting implementation
├── errors.ts                 # Error handling utilities
├── validation.ts             # Zod validation schemas
└── client.ts                 # Frontend API client
```

### Configuration Files

```
.env.example                  # Environment variable template
API_SETUP_GUIDE.md           # This file
API_IMPLEMENTATION_SUMMARY.md # Technical implementation details
```

### Test Scripts

```
scripts/
├── test-api.sh              # Bash test script
└── test-api.ts              # TypeScript test script
```

## Environment Configuration

### Required Variables

```bash
# REQUIRED - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### Optional Variables

```bash
# OCR Service (optional, falls back to Claude Vision)
MATHPIX_APP_ID=your-app-id
MATHPIX_APP_KEY=your-app-key

# Rate Limiting (optional, has defaults)
RATE_LIMIT_AI_TUTOR=10        # Requests per minute
RATE_LIMIT_OCR=5              # Requests per minute
RATE_LIMIT_SESSIONS=30        # Requests per minute

# Development (optional)
DEBUG_API=false               # Enable verbose logging
DISABLE_RATE_LIMIT=false      # Disable rate limiting in dev
```

### Production Variables

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Error Tracking
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Testing the APIs

### Automated Testing

#### Option 1: Bash Script (Recommended)

```bash
# Make sure the dev server is running
npm run dev

# In another terminal, run tests
./scripts/test-api.sh

# Test against a different URL
./scripts/test-api.sh https://your-production-url.com
```

#### Option 2: Manual cURL Tests

```bash
# Test AI Tutor
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain the quadratic formula",
    "mode": "explanation",
    "context": {
      "extractedProblem": "x^2 + 5x + 6 = 0"
    }
  }'

# Test OCR (requires valid base64 image)
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "options": {
      "validateLatex": true
    }
  }'

# Test Sessions - List
curl http://localhost:3000/api/sessions?page=1&limit=10

# Test Sessions - Create
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "extractedProblem": "x^2 + 5x + 6 = 0",
    "mode": "socratic",
    "messages": [],
    "duration": 120,
    "questionsAsked": 5,
    "hintsGiven": 2,
    "completed": true
  }'

# Test Sessions - Delete
curl -X DELETE "http://localhost:3000/api/sessions?id=session-1234567890"
```

### Expected Responses

#### Success Response (200/201)
```json
{
  "data": {
    /* Response data */
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

#### Error Response (4xx/5xx)
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional */ }
  },
  "timestamp": "2024-01-27T12:00:00.000Z",
  "requestId": "req_123456_abc"
}
```

## Integration Guide

### Using the TypeScript Client

The easiest way to use the APIs from your frontend:

```typescript
// Import the client
import { AITutorAPI, OCRAPI, SessionsAPI } from "@/lib/api/client";

// Example 1: Send message to AI tutor
try {
  const response = await AITutorAPI.sendMessage({
    message: "How do I factor this equation?",
    mode: "socratic",
    context: {
      extractedProblem: "x^2 + 5x + 6 = 0",
      messageHistory: previousMessages,
    },
  });

  console.log(response.content);
  console.log(response.latex);
  console.log(response.validation.confidence);
} catch (error) {
  console.error("AI Tutor error:", error);
}

// Example 2: Process image with OCR
try {
  const file = /* File from input */;

  // Validate before upload
  const validation = OCRAPI.validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Convert to base64
  const base64 = await OCRAPI.fileToBase64(file);

  // Process OCR
  const result = await OCRAPI.processImage({
    image: base64,
    options: {
      validateLatex: true,
      confidenceThreshold: 0.7,
    },
  });

  console.log(result.latex);
  console.log(result.confidence);
} catch (error) {
  console.error("OCR error:", error);
}

// Example 3: Manage sessions
try {
  // Get sessions with filters
  const { sessions, pagination, stats } = await SessionsAPI.getSessions({
    page: 1,
    limit: 20,
    mode: "socratic",
    completed: true,
    sortBy: "lastUpdated",
    sortOrder: "desc",
    includeStats: true,
  });

  console.log(`Found ${pagination.total} sessions`);
  console.log(`Average duration: ${stats?.averageDuration}s`);

  // Create new session
  const newSession = await SessionsAPI.createSession({
    extractedProblem: "x^2 + 5x + 6 = 0",
    mode: "socratic",
    messages: [],
    duration: 0,
    questionsAsked: 0,
    hintsGiven: 0,
    completed: false,
  });

  console.log(`Created session: ${newSession.id}`);

  // Delete session
  await SessionsAPI.deleteSession(newSession.id);
} catch (error) {
  console.error("Sessions error:", error);
}
```

### Error Handling

```typescript
import {
  APIClientError,
  isRateLimitError,
  isValidationError,
  getErrorMessage,
} from "@/lib/api/client";

try {
  const response = await AITutorAPI.sendMessage({...});
} catch (error) {
  if (isRateLimitError(error)) {
    // Handle rate limit (show countdown)
    const resetTime = (error as APIClientError).details?.resetTime;
    console.log(`Rate limited. Try again in ${resetTime}s`);
  } else if (isValidationError(error)) {
    // Handle validation error (show field errors)
    const details = (error as APIClientError).details;
    console.log("Validation errors:", details);
  } else {
    // Generic error handling
    const message = getErrorMessage(error);
    console.error(message);
  }
}
```

### Retry Logic

```typescript
import { retryRequest } from "@/lib/api/client";

// Automatically retry failed requests (with exponential backoff)
const response = await retryRequest(
  () => AITutorAPI.sendMessage({...}),
  3,    // max retries
  1000  // initial delay (ms)
);
```

### Update Zustand Store

Update your existing store to use the new API:

```typescript
// stores/useAITutorStore.ts
import { AITutorAPI, retryRequest } from "@/lib/api/client";

export const useAITutorStore = create<AITutorStore>((set, get) => ({
  // ... existing state ...

  sendMessage: async (content: string) => {
    const { currentSession, mode } = get();
    if (!currentSession) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    set({
      currentSession: {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
      },
      isLoading: true,
      error: null,
    });

    try {
      // Use the new API client with retry logic
      const data = await retryRequest(() =>
        AITutorAPI.sendMessage({
          message: content,
          mode,
          context: {
            extractedProblem: currentSession.extractedProblem,
            messageHistory: currentSession.messages,
          },
        })
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content,
        timestamp: new Date().toISOString(),
        latex: data.latex,
        citations: data.citations,
      };

      const session = get().currentSession;
      if (session) {
        set({
          currentSession: {
            ...session,
            messages: [...session.messages, assistantMessage],
            lastUpdated: new Date().toISOString(),
          },
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  // ... rest of store ...
}));
```

## Troubleshooting

### Common Issues

#### 1. "Missing required environment variable: ANTHROPIC_API_KEY"

**Problem**: API key not set in environment

**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" >> .env.local

# Restart the dev server
npm run dev
```

#### 2. Rate Limit Exceeded

**Problem**: Too many requests too quickly

**Solution**:
```bash
# Option 1: Wait for rate limit to reset (shown in response)

# Option 2: Disable rate limiting in development
echo "DISABLE_RATE_LIMIT=true" >> .env.local
npm run dev

# Option 3: Increase rate limits
echo "RATE_LIMIT_AI_TUTOR=20" >> .env.local
```

#### 3. OCR Fails with "OCR processing failed"

**Problem**: No Mathpix credentials and Claude Vision not working

**Solution**:
```bash
# Option 1: Add Mathpix credentials
echo "MATHPIX_APP_ID=your-app-id" >> .env.local
echo "MATHPIX_APP_KEY=your-app-key" >> .env.local

# Option 2: Ensure image is valid
# - Format: JPEG, PNG, or WebP
# - Size: Under 5MB
# - Valid base64 encoding
```

#### 4. CORS Errors in Browser

**Problem**: Cross-origin requests blocked

**Solution**: The API includes CORS headers. If you're still seeing errors:
```typescript
// The API already includes these headers in OPTIONS responses:
"Access-Control-Allow-Origin": "*"
"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"
"Access-Control-Allow-Headers": "Content-Type, Authorization"
```

If issues persist, check your browser console for specific CORS errors.

#### 5. "Invalid LaTeX" Warnings

**Problem**: LaTeX validation failing

**Solution**: Check the LaTeX syntax:
```typescript
// Valid LaTeX examples:
"x^2 + 5x + 6"
"\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
"\\int_{0}^{\\pi} \\sin(x) dx"

// Invalid (security risks):
"\\href{javascript:alert('xss')}{click}"  // Forbidden command
"<script>alert('xss')</script>"           // HTML tags
```

### Debug Mode

Enable verbose logging to see what's happening:

```bash
# Add to .env.local
DEBUG_API=true

# Restart server
npm run dev

# Check terminal for detailed logs
```

### Testing Checklist

Before deploying to production:

- [ ] All environment variables set correctly
- [ ] API endpoints returning expected responses
- [ ] Rate limiting working (test with multiple requests)
- [ ] Error handling working (test with invalid data)
- [ ] LaTeX validation catching security issues
- [ ] OCR processing images correctly
- [ ] Sessions CRUD operations working
- [ ] Frontend integration complete

### Getting Help

1. **Check the logs**: Look at terminal output when running dev server
2. **Check request IDs**: Error responses include request IDs for tracking
3. **Use debug mode**: Set `DEBUG_API=true` for verbose logging
4. **Review documentation**: See `/app/api/README.md` for detailed API docs
5. **Check existing code**: Review `/app/api/API_IMPLEMENTATION_SUMMARY.md`

## Next Steps

1. **Set up your environment** following the Quick Start
2. **Run the test script** to verify everything works
3. **Integrate with frontend** using the TypeScript client
4. **Deploy to production** with proper environment variables

For detailed API documentation, see `/app/api/README.md`

For implementation details, see `/app/api/API_IMPLEMENTATION_SUMMARY.md`

---

**Questions or Issues?**

All API routes include comprehensive error handling and logging. Check the terminal output when running the dev server to see detailed error information including request IDs for debugging.
