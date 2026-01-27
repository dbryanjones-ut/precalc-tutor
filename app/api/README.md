# PreCalc Tutor API Documentation

Production-ready API routes for the PreCalc Tutor application with comprehensive validation, error handling, and security features.

## Table of Contents

- [Overview](#overview)
- [API Routes](#api-routes)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Environment Setup](#environment-setup)
- [Usage Examples](#usage-examples)

## Overview

All API routes follow RESTful conventions and return consistent JSON responses with proper HTTP status codes. Each endpoint implements:

- **Input validation** using Zod schemas
- **Rate limiting** to prevent abuse
- **Error handling** with standardized error responses
- **CORS support** for cross-origin requests
- **Security measures** including XSS prevention and input sanitization

### Standard Response Format

**Success Response:**
```json
{
  "data": { /* response data */ },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": { /* optional error details */ }
  },
  "timestamp": "2024-01-27T12:00:00.000Z",
  "requestId": "req_123456_abc"
}
```

## API Routes

### 1. AI Tutor (`/api/ai/tutor`)

Provides AI-powered tutoring using Claude API with Socratic or explanation modes.

#### POST `/api/ai/tutor`

**Request Body:**
```json
{
  "message": "How do I solve this equation?",
  "mode": "socratic",
  "context": {
    "extractedProblem": "x^2 + 5x + 6 = 0",
    "messageHistory": [
      {
        "role": "user",
        "content": "Previous message",
        "timestamp": "2024-01-27T12:00:00.000Z"
      }
    ],
    "referenceMaterials": ["Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$"]
  }
}
```

**Response:**
```json
{
  "data": {
    "content": "Let's think about this step by step...",
    "latex": ["x^2 + 5x + 6 = 0", "(x+2)(x+3) = 0"],
    "citations": [
      {
        "type": "formula",
        "title": "Quadratic Formula",
        "content": "For ax^2 + bx + c = 0..."
      }
    ],
    "validation": {
      "confidence": 0.95,
      "riskLevel": "low",
      "warnings": []
    }
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Validation:**
- `message`: 1-5000 characters, required
- `mode`: Must be "socratic" or "explanation"
- `context.messageHistory`: Max 50 messages
- `context.extractedProblem`: Optional LaTeX string

**Rate Limit:** 10 requests per minute

**Error Codes:**
- `VALIDATION_ERROR` (400): Invalid request data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): AI service error

---

### 2. OCR (`/api/ocr`)

Processes images to extract LaTeX mathematical expressions using Mathpix OCR with Claude Vision fallback.

#### POST `/api/ocr`

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "options": {
    "validateLatex": true,
    "extractPlainText": true,
    "confidenceThreshold": 0.7
  }
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "latex": "\\int_{0}^{\\pi} \\sin(x) dx",
    "confidence": 0.92,
    "plainText": "integral from 0 to pi of sin(x) dx",
    "processingTime": 1234,
    "validationPassed": true
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Validation:**
- `image`: Valid base64 or data URI
- Max file size: 5MB
- Supported formats: JPEG, PNG, WebP
- `options.confidenceThreshold`: 0-1 range

**Rate Limit:** 5 requests per minute

**Error Codes:**
- `VALIDATION_ERROR` (400): Invalid image data
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): OCR processing failed

**Notes:**
- Requires `MATHPIX_APP_ID` and `MATHPIX_APP_KEY` environment variables
- Falls back to Claude Vision if Mathpix is unavailable
- LaTeX output is automatically validated for security

---

### 3. Sessions (`/api/sessions`)

Manages tutoring sessions with CRUD operations, filtering, and statistics.

#### GET `/api/sessions`

Fetch sessions with filtering and pagination.

**Query Parameters:**
```
?page=1
&limit=20
&startDate=2024-01-01T00:00:00.000Z
&endDate=2024-01-31T23:59:59.999Z
&mode=socratic
&completed=true
&tags=quadratic,algebra
&unit=Unit 2
&sortBy=lastUpdated
&sortOrder=desc
&includeStats=true
```

**Response:**
```json
{
  "data": {
    "sessions": [
      {
        "id": "session-1234567890",
        "timestamp": "2024-01-27T12:00:00.000Z",
        "extractedProblem": "x^2 + 5x + 6 = 0",
        "mode": "socratic",
        "messages": [...],
        "completed": true,
        "duration": 420,
        "questionsAsked": 8,
        "hintsGiven": 3,
        "tags": ["quadratic", "factoring"],
        "unit": "Unit 2",
        "lastUpdated": "2024-01-27T12:07:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "stats": {
      "totalSessions": 45,
      "completedSessions": 42,
      "totalDuration": 18900,
      "averageDuration": 420,
      "totalQuestionsAsked": 360,
      "averageQuestionsPerSession": 8,
      "modeBreakdown": {
        "socratic": 30,
        "explanation": 15
      },
      "unitBreakdown": {
        "Unit 1": 10,
        "Unit 2": 20,
        "Unit 3": 15
      }
    }
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Validation:**
- `page`: Positive integer (default: 1)
- `limit`: 1-100 (default: 20)
- `startDate`, `endDate`: ISO 8601 datetime
- `sortBy`: timestamp | duration | questionsAsked | lastUpdated
- `sortOrder`: asc | desc

#### POST `/api/sessions`

Create a new session.

**Request Body:**
```json
{
  "extractedProblem": "Solve: x^2 + 5x + 6 = 0",
  "originalProblemText": "Solve the quadratic equation",
  "uploadedImage": "data:image/jpeg;base64,...",
  "mode": "socratic",
  "messages": [
    {
      "role": "user",
      "content": "I need help solving this",
      "timestamp": "2024-01-27T12:00:00.000Z"
    }
  ],
  "duration": 420,
  "questionsAsked": 8,
  "hintsGiven": 3,
  "completed": true,
  "tags": ["quadratic", "factoring"],
  "unit": "Unit 2"
}
```

**Response:**
```json
{
  "data": {
    "id": "session-1234567890-abc",
    "timestamp": "2024-01-27T12:00:00.000Z",
    "lastUpdated": "2024-01-27T12:00:00.000Z",
    /* ...rest of session data */
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Status:** 201 Created

#### DELETE `/api/sessions?id=session-123`

Delete a session by ID.

**Query Parameters:**
- `id`: Session ID (required, format: `session-*`)

**Response:**
```json
{
  "data": {
    "message": "Session deleted successfully",
    "sessionId": "session-1234567890"
  },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Rate Limit:** 30 requests per minute (applies to all session endpoints)

---

## Authentication

Currently, the API does not require authentication. For production deployment with multiple users, implement:

1. **JWT Authentication**: Add JWT tokens to secure endpoints
2. **API Keys**: For service-to-service communication
3. **User Sessions**: Track sessions per user

Future implementation will use the `SESSION_SECRET` environment variable.

---

## Rate Limiting

All endpoints implement rate limiting to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/ai/tutor` | 10 requests | 1 minute |
| `/api/ocr` | 5 requests | 1 minute |
| `/api/sessions` | 30 requests | 1 minute |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 45
```

**Bypass in Development:**
Set `DISABLE_RATE_LIMIT=true` in `.env.local`

---

## Error Handling

### HTTP Status Codes

- **200**: Success
- **201**: Created (POST)
- **400**: Bad Request (validation error)
- **401**: Unauthorized
- **404**: Not Found
- **429**: Rate Limit Exceeded
- **500**: Internal Server Error

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `AUTHENTICATION_ERROR` | Authentication required |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_SERVER_ERROR` | Server error |

### Example Error Response

```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "errors": [
        {
          "field": "message",
          "message": "Message cannot be empty"
        }
      ]
    }
  },
  "timestamp": "2024-01-27T12:00:00.000Z",
  "requestId": "req_1234567_abc"
}
```

---

## Environment Setup

### Required Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Required
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional (for OCR)
MATHPIX_APP_ID=your-app-id
MATHPIX_APP_KEY=your-app-key
```

### Optional Variables

See `.env.example` for complete list including:
- Rate limit overrides
- Database configuration
- Error tracking (Sentry)
- Analytics (PostHog)
- Feature flags

---

## Usage Examples

### TypeScript/React

```typescript
// Using the AI Tutor API
async function askTutor(question: string) {
  const response = await fetch('/api/ai/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: question,
      mode: 'socratic',
      context: {
        extractedProblem: currentProblem,
        messageHistory: conversationHistory,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  const data = await response.json();
  return data.data;
}

// Using the OCR API
async function processImage(file: File) {
  const base64 = await fileToBase64(file);

  const response = await fetch('/api/ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      options: {
        validateLatex: true,
        confidenceThreshold: 0.7,
      },
    }),
  });

  const data = await response.json();
  return data.data;
}

// Fetching sessions
async function getSessions(filters: SessionFilters) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/sessions?${params}`);
  const data = await response.json();
  return data.data;
}
```

### cURL Examples

```bash
# AI Tutor
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I factor x^2 + 5x + 6?",
    "mode": "socratic"
  }'

# OCR
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ..."
  }'

# Get Sessions
curl "http://localhost:3000/api/sessions?page=1&limit=10&completed=true"

# Delete Session
curl -X DELETE "http://localhost:3000/api/sessions?id=session-1234567890"
```

---

## Security Considerations

### Implemented Protections

1. **Input Validation**: All inputs validated with Zod schemas
2. **XSS Prevention**: HTML tags stripped, dangerous patterns blocked
3. **LaTeX Sanitization**: Forbidden commands removed, malicious code blocked
4. **Rate Limiting**: Prevents abuse and DoS attacks
5. **Error Masking**: Sensitive errors not exposed to clients
6. **CORS**: Configured for cross-origin requests

### Best Practices

- Never commit `.env.local` with real credentials
- Use environment-specific API keys
- Monitor rate limit violations
- Implement authentication for production
- Enable error tracking (Sentry) in production
- Use HTTPS in production

---

## Monitoring & Debugging

### Logging

All API routes log errors with request IDs for tracking:
```
[req_1234567_abc] Internal Server Error: ...
```

### Development Mode

Set `DEBUG_API=true` to enable verbose logging:
```bash
# .env.local
DEBUG_API=true
```

### Production Monitoring

Configure error tracking:
```bash
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ENVIRONMENT=production
```

---

## Future Enhancements

- [ ] Streaming responses for AI Tutor
- [ ] WebSocket support for real-time tutoring
- [ ] Database persistence (PostgreSQL)
- [ ] Redis-based distributed rate limiting
- [ ] User authentication with JWT
- [ ] Session analytics and insights
- [ ] Collaborative tutoring sessions
- [ ] Voice input/output support

---

## Support

For issues or questions about the API:
1. Check error response `requestId` for debugging
2. Review logs for detailed error information
3. Verify environment variables are set correctly
4. Ensure rate limits are not exceeded

## License

Part of the PreCalc Tutor application.
