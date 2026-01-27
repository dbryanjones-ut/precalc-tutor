# PreCalc Tutor

An AI-powered precalculus learning platform built with Next.js, featuring interactive lessons, practice problems, and personalized tutoring powered by Claude AI.

## Features

- **Interactive Lessons**: Comprehensive precalculus curriculum with step-by-step explanations
- **AI Tutor**: Personalized tutoring powered by Claude AI (Anthropic)
- **Practice Problems**: Adaptive practice with instant feedback
- **Progress Tracking**: Monitor learning progress and achievements
- **Dark Mode**: Full dark mode support
- **Offline Support**: Works offline with IndexedDB storage
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **AI**: Anthropic Claude API
- **Math Rendering**: KaTeX
- **State Management**: Zustand
- **Database**: IndexedDB (client-side)
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Anthropic API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/precalc-tutor.git
cd precalc-tutor
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for all available environment variables. Required variables:

- `ANTHROPIC_API_KEY`: Your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/))
- `NEXT_PUBLIC_APP_URL`: Your application URL

Optional variables:

- `MATHPIX_APP_ID`: Mathpix App ID (for OCR features)
- `MATHPIX_API_KEY`: Mathpix API key
- `RATE_LIMIT_MAX`: Maximum requests per minute (default: 60)
- `AI_RATE_LIMIT_MAX`: Maximum AI requests per hour (default: 30)
- `SENTRY_DSN`: Sentry DSN for error tracking

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Generate coverage report

# Analysis
npm run analyze          # Analyze bundle size

# Docker
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
npm run docker:up        # Start with docker-compose
npm run docker:down      # Stop docker-compose
```

### Project Structure

```
precalc-tutor/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard pages
│   ├── lessons/        # Lesson pages
│   ├── practice/       # Practice pages
│   └── layout.tsx      # Root layout
├── components/          # React components
│   ├── layout/         # Layout components
│   ├── math/           # Math-specific components
│   └── ui/             # UI components (Radix)
├── lib/                # Utilities
│   ├── env.ts          # Environment validation
│   ├── analytics.ts    # Analytics helpers
│   └── sentry.ts       # Error tracking
├── stores/             # Zustand stores
├── types/              # TypeScript types
├── public/             # Static assets
└── middleware.ts       # Rate limiting middleware
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
vercel --prod
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Docker

1. Build the image:

```bash
docker build -t precalc-tutor .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env.local precalc-tutor
```

Or use Docker Compose:

```bash
docker-compose up -d
```

## CI/CD

This project includes GitHub Actions workflows:

- **CI**: Runs on every push and PR (lint, type-check, build, tests)
- **Deploy**: Automatically deploys to Vercel on push to main
- **Performance**: Monitors bundle size and runs Lighthouse audits

### Required GitHub Secrets

Set these in your GitHub repository settings:

- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

## Security

### Rate Limiting

The application includes built-in rate limiting:

- General routes: 60 requests/minute per IP
- AI routes: 30 requests/minute per IP

### Security Headers

All security headers are configured in `next.config.ts`:

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security
- And more...

### Reporting Security Issues

Please report security vulnerabilities to security@precalc-tutor.com. See `public/.well-known/security.txt` for details.

## Performance

### Bundle Size

Current bundle size targets:

- First Load JS: < 200KB
- Total Size: < 2MB

Run `npm run analyze` to analyze the bundle.

### Lighthouse Scores

Target scores (all routes):

- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 95

## Monitoring

### Health Check

Check application health:

```bash
curl http://localhost:3000/api/health
```

### Metrics

View application metrics:

```bash
curl http://localhost:3000/api/metrics
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@precalc-tutor.com or open an issue on GitHub.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [KaTeX](https://katex.org/)
