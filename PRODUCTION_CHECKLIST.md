# Production Deployment Checklist

Quick reference for deploying PreCalc Tutor to production.

## Pre-Flight Checks

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Required variables (edit .env.local)
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. Local Testing
```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Start production server locally
npm start

# Test health check
npm run health
```

### 3. GitHub Secrets Configuration

Go to: `Settings → Secrets and variables → Actions → New repository secret`

Add these secrets:
```
ANTHROPIC_API_KEY         = Your production API key
VERCEL_TOKEN             = Get from vercel.com/account/tokens
VERCEL_ORG_ID            = Run: vercel link (shows in .vercel/project.json)
VERCEL_PROJECT_ID        = Run: vercel link (shows in .vercel/project.json)
```

Optional secrets:
```
SENTRY_DSN               = Sentry project DSN
CODECOV_TOKEN            = Codecov upload token
```

## Vercel Deployment (5 minutes)

### Option A: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project (first time only)
vercel link

# Deploy to production
vercel --prod
```

### Option B: GitHub Integration (Recommended)

1. Go to [vercel.com](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Configure environment variables:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-key
   NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
   RATE_LIMIT_MAX=60
   AI_RATE_LIMIT_MAX=30
   ```
5. Click "Deploy"
6. Done! Pushes to main will auto-deploy

## Verification Steps

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": { ... },
  "envChecks": { "anthropicApiKey": true }
}
```

### 2. Test Rate Limiting
```bash
# Should get 429 after 60 requests
for i in {1..65}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.vercel.app/
done
```

### 3. Test Security Headers
```bash
curl -I https://your-domain.vercel.app/
```

Look for:
- `strict-transport-security`
- `x-frame-options`
- `x-content-type-options`
- `content-security-policy`

### 4. Lighthouse Audit
```bash
npx lighthouse https://your-domain.vercel.app --view
```

Target scores:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 95

### 5. Test Application Features

Visit these URLs:
- `/` - Home page
- `/dashboard` - Dashboard
- `/lessons` - Lessons list
- `/practice` - Practice problems
- `/tools` - Math tools
- `/settings` - Settings page

## Docker Deployment (Alternative)

### Quick Start
```bash
# Build image
docker build -t precalc-tutor .

# Run container
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=your-key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  precalc-tutor

# Or use docker-compose
docker-compose up -d
```

### Production Deploy
```bash
# AWS ECR example
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin {account}.dkr.ecr.us-east-1.amazonaws.com

docker tag precalc-tutor:latest {account}.dkr.ecr.us-east-1.amazonaws.com/precalc-tutor:latest
docker push {account}.dkr.ecr.us-east-1.amazonaws.com/precalc-tutor:latest

# Deploy via ECS, EKS, or your orchestration platform
```

## Monitoring Setup

### 1. Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) (free):
1. Create HTTP(S) monitor
2. URL: `https://your-domain.vercel.app/api/health`
3. Interval: 5 minutes
4. Alert via email/Slack

### 2. Error Tracking (Optional)

```bash
# Install Sentry
npm install @sentry/nextjs

# Add to environment
SENTRY_DSN=https://your-sentry-dsn
SENTRY_ENVIRONMENT=production

# Uncomment Sentry code in lib/sentry.ts
```

### 3. Analytics (Optional)

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Enable in Vercel dashboard
# Or set environment variable
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

## CI/CD Status

After pushing to GitHub, verify these workflows pass:

- ✅ CI (Lint, Type Check, Build, Tests)
- ✅ Deploy (Deployment to Vercel)
- ✅ Performance (Lighthouse, Bundle Size)

Check: `https://github.com/{user}/{repo}/actions`

## Rollback Procedure

If something goes wrong:

### Vercel
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel rollback {previous-deployment-url}
```

Or in Vercel Dashboard:
1. Go to "Deployments"
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Docker
```bash
# Pull previous version
docker pull precalc-tutor:{previous-tag}

# Update and restart
docker-compose down
docker-compose up -d
```

## Post-Deployment

### Immediate (First Hour)
- [ ] Verify health check responds
- [ ] Test all main features
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Verify rate limiting works

### First Day
- [ ] Monitor uptime
- [ ] Check for error spikes
- [ ] Review performance metrics
- [ ] Validate analytics tracking
- [ ] User acceptance testing

### First Week
- [ ] Review all metrics
- [ ] Optimize as needed
- [ ] Document issues
- [ ] Plan improvements

## Common Issues

### Build Fails
**Problem**: TypeScript or ESLint errors
**Solution**: Run `npm run type-check` and `npm run lint` locally first

### Environment Variables Missing
**Problem**: Build fails with env validation errors
**Solution**: Verify all required vars in Vercel dashboard

### Rate Limiting Not Working
**Problem**: Rate limit headers not present
**Solution**: Verify middleware.ts is running, check Edge runtime compatibility

### Slow Performance
**Problem**: Lighthouse scores below targets
**Solution**: Run `npm run analyze` to check bundle size, optimize images

### 429 Errors in Production
**Problem**: Rate limit too strict
**Solution**: Increase `RATE_LIMIT_MAX` environment variable

## Support Contacts

- **Deployment Issues**: Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Security Issues**: See [SECURITY.md](./SECURITY.md)
- **Contributing**: Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- **General Help**: Check [README.md](./README.md)

## Performance Benchmarks

Expected performance (Vercel deployment):

| Metric | Target | Typical |
|--------|--------|---------|
| Health Check | < 50ms | 20-30ms |
| Home Page Load | < 2s | 1-1.5s |
| Dashboard Load | < 2s | 1-1.5s |
| API Response | < 500ms | 100-300ms |
| Lighthouse Score | ≥ 90 | 92-98 |

## Security Verification

```bash
# Check security headers
curl -I https://your-domain.vercel.app/ | grep -i security

# Verify CSP
curl -I https://your-domain.vercel.app/ | grep -i content-security

# Check TLS
echo | openssl s_client -connect your-domain.vercel.app:443 2>/dev/null | \
  openssl x509 -noout -text | grep "Signature Algorithm"
```

## Quick Commands

```bash
# Local development
npm run dev

# Production build
npm run build && npm start

# Run all checks
npm run lint && npm run type-check && npm run test

# Deploy to Vercel
vercel --prod

# Check health
curl https://your-domain.vercel.app/api/health

# View logs
vercel logs --follow

# Bundle analysis
npm run analyze
```

## Status Dashboard Template

Create a status page tracking:

- ✅ Application Status (from health check)
- ✅ Response Time (< 500ms)
- ✅ Error Rate (< 1%)
- ✅ Uptime (≥ 99.9%)
- ✅ Build Status (GitHub Actions)
- ✅ Security Audit (passing)

---

**Quick Start**: Copy `.env.example` → `.env.local`, add API key, run `npm install && npm run build`, deploy to Vercel.

**Full Documentation**: See [INFRASTRUCTURE_SUMMARY.md](./INFRASTRUCTURE_SUMMARY.md)

**Last Updated**: January 27, 2026
