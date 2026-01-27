# API Quick Reference

Fast reference for PreCalc Tutor API endpoints.

## Setup (30 seconds)

```bash
cp .env.example .env.local
echo "ANTHROPIC_API_KEY=sk-ant-api03-YOUR-KEY" >> .env.local
npm run dev
./scripts/test-api.sh
```

## Endpoints

### 1. AI Tutor - `/api/ai/tutor`

**POST** - Get AI tutoring response

```bash
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I solve x^2 + 5x + 6 = 0?",
    "mode": "socratic"
  }'
```

**TypeScript:**
```typescript
import { AITutorAPI } from "@/lib/api/client";

const response = await AITutorAPI.sendMessage({
  message: "How do I solve this?",
  mode: "socratic",
  context: {
    extractedProblem: "x^2 + 5x + 6 = 0",
  },
});
```

**Rate Limit:** 10 req/min

---

### 2. OCR - `/api/ocr`

**POST** - Extract LaTeX from image

```bash
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "options": { "validateLatex": true }
  }'
```

**TypeScript:**
```typescript
import { OCRAPI } from "@/lib/api/client";

const base64 = await OCRAPI.fileToBase64(imageFile);
const result = await OCRAPI.processImage({ image: base64 });
```

**Rate Limit:** 5 req/min
**Max Size:** 5MB

---

### 3. Sessions - `/api/sessions`

**GET** - List sessions

```bash
curl "http://localhost:3000/api/sessions?page=1&limit=10&mode=socratic"
```

**POST** - Create session

```bash
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
```

**DELETE** - Remove session

```bash
curl -X DELETE "http://localhost:3000/api/sessions?id=session-1234567890"
```

**TypeScript:**
```typescript
import { SessionsAPI } from "@/lib/api/client";

// List
const { sessions, pagination } = await SessionsAPI.getSessions({
  page: 1,
  limit: 20,
  completed: true,
});

// Create
const session = await SessionsAPI.createSession({
  extractedProblem: "x^2 + 5x + 6 = 0",
  mode: "socratic",
  messages: [],
  duration: 0,
  questionsAsked: 0,
  hintsGiven: 0,
  completed: false,
});

// Delete
await SessionsAPI.deleteSession(session.id);
```

**Rate Limit:** 30 req/min

---

## Response Format

**Success (200/201):**
```json
{
  "data": { /* your data */ },
  "timestamp": "2024-01-27T12:00:00.000Z"
}
```

**Error (4xx/5xx):**
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-27T12:00:00.000Z",
  "requestId": "req_123456_abc"
}
```

---

## Error Handling

```typescript
import { getErrorMessage, isRateLimitError } from "@/lib/api/client";

try {
  const response = await AITutorAPI.sendMessage({...});
} catch (error) {
  if (isRateLimitError(error)) {
    // Show countdown timer
  }
  const message = getErrorMessage(error);
  console.error(message);
}
```

---

## Environment Variables

**Required:**
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key
```

**Optional:**
```bash
MATHPIX_APP_ID=your-app-id
MATHPIX_APP_KEY=your-app-key
RATE_LIMIT_AI_TUTOR=10
DISABLE_RATE_LIMIT=false  # Dev only
DEBUG_API=false
```

---

## Testing

```bash
# Run all tests
./scripts/test-api.sh

# Test specific endpoint
curl -X POST http://localhost:3000/api/ai/tutor \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","mode":"socratic"}'
```

---

## File Locations

```
app/api/ai/tutor/route.ts      # AI Tutor endpoint
app/api/ocr/route.ts           # OCR endpoint
app/api/sessions/route.ts      # Sessions endpoint
lib/api/client.ts              # Frontend client
lib/api/validation.ts          # Zod schemas
lib/api/errors.ts              # Error handling
lib/api/rate-limiter.ts        # Rate limiting
.env.example                   # Environment template
```

---

## Common Issues

**"Missing API key"**
```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local
```

**Rate limit exceeded**
```bash
# Wait or disable in dev:
echo "DISABLE_RATE_LIMIT=true" >> .env.local
```

**OCR fails**
```bash
# Check image:
# - Format: JPEG/PNG/WebP
# - Size: < 5MB
# - Valid base64
```

---

## Full Docs

- **Setup Guide:** `/API_SETUP_GUIDE.md`
- **API Docs:** `/app/api/README.md`
- **Implementation:** `/app/api/API_IMPLEMENTATION_SUMMARY.md`
