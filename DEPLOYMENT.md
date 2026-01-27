# Deployment Guide

This guide walks you through deploying PreCalc Tutor to production.

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Bundle size within limits (`npm run analyze`)

### Configuration

- [ ] Environment variables configured
- [ ] Security headers configured in `next.config.ts`
- [ ] Rate limiting tested
- [ ] Error tracking set up (Sentry)
- [ ] Analytics configured (Vercel Analytics)

### Security

- [ ] API keys rotated for production
- [ ] Security.txt file updated
- [ ] CSP headers tested
- [ ] Rate limits appropriate for production load
- [ ] No secrets in code

### Performance

- [ ] Lighthouse scores meet targets (≥90)
- [ ] Images optimized
- [ ] Fonts optimized
- [ ] Bundle size analyzed
- [ ] Critical routes tested

### Monitoring

- [ ] Health check endpoint working
- [ ] Metrics endpoint configured
- [ ] Error tracking tested
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured

## Deployment Options

### Option 1: Vercel (Recommended)

#### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Anthropic API key

#### Steps

1. **Connect Repository to Vercel**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

2. **Configure Environment Variables**

In Vercel Dashboard:
- Go to Settings → Environment Variables
- Add production variables:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-production-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
RATE_LIMIT_MAX=60
AI_RATE_LIMIT_MAX=30
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

3. **Configure GitHub Integration**

In Vercel Dashboard:
- Settings → Git
- Enable automatic deployments
- Configure preview deployments for PRs

4. **Deploy**

```bash
# Deploy to production
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

5. **Verify Deployment**

```bash
# Check health
curl https://your-domain.vercel.app/api/health

# Check metrics
curl https://your-domain.vercel.app/api/metrics

# Run Lighthouse audit
npx lighthouse https://your-domain.vercel.app --view
```

#### Vercel Configuration

The project includes `vercel.json` with:
- Region configuration (us-east-1)
- Custom headers
- Function timeouts (30s)
- Memory limits (1024MB)

#### Production Optimizations

Vercel automatically provides:
- Edge caching
- Image optimization
- Automatic HTTPS
- DDoS protection
- Analytics

### Option 2: Docker + Cloud Provider

#### Prerequisites
- Docker installed
- Cloud provider account (AWS, GCP, Azure, DigitalOcean)
- Container registry access

#### Build Docker Image

```bash
# Build image
docker build -t precalc-tutor:latest .

# Test locally
docker run -p 3000:3000 --env-file .env.local precalc-tutor:latest

# Verify
curl http://localhost:3000/api/health
```

#### Deploy to Cloud Provider

**AWS ECS**

```bash
# Tag image
docker tag precalc-tutor:latest {aws-account}.dkr.ecr.{region}.amazonaws.com/precalc-tutor:latest

# Push to ECR
docker push {aws-account}.dkr.ecr.{region}.amazonaws.com/precalc-tutor:latest

# Deploy with ECS CLI or console
```

**Google Cloud Run**

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/{project-id}/precalc-tutor
gcloud run deploy precalc-tutor --image gcr.io/{project-id}/precalc-tutor --platform managed
```

**DigitalOcean App Platform**

```bash
# Use doctl or web interface
doctl apps create --spec .do/app.yaml
```

#### Docker Compose (Self-Hosted)

```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: Traditional VPS

#### Prerequisites
- VPS with Ubuntu 22.04 or similar
- Node.js 20.x
- nginx
- SSL certificate (Let's Encrypt)

#### Setup Steps

1. **Install Dependencies**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

2. **Deploy Application**

```bash
# Clone repository
git clone https://github.com/yourusername/precalc-tutor.git
cd precalc-tutor

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Configure environment
cp .env.example .env.local
nano .env.local  # Edit with production values

# Start with PM2
npm install -g pm2
pm2 start npm --name precalc-tutor -- start
pm2 save
pm2 startup
```

3. **Configure nginx**

```nginx
# /etc/nginx/sites-available/precalc-tutor
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/precalc-tutor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d your-domain.com
```

4. **Configure Firewall**

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Health check
curl https://your-domain.com/api/health

# Metrics
curl https://your-domain.com/api/metrics

# Test rate limiting
for i in {1..70}; do curl https://your-domain.com/ -s -o /dev/null -w "%{http_code}\n"; done
```

### 2. Monitor Application

- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error alerts (Sentry)
- Monitor performance (Vercel Analytics, New Relic)
- Track costs (cloud provider dashboards)

### 3. Set Up Backups

If using database:
```bash
# Daily backups
0 2 * * * /usr/local/bin/backup-db.sh
```

### 4. Document Access

- Production URLs
- Environment variables location
- Deployment credentials
- Monitoring dashboards
- On-call procedures

## CI/CD Setup

### GitHub Secrets

Add to repository settings:

```
ANTHROPIC_API_KEY         # Production API key
VERCEL_TOKEN             # Vercel deployment token
VERCEL_ORG_ID            # Vercel organization ID
VERCEL_PROJECT_ID        # Vercel project ID
SENTRY_AUTH_TOKEN        # Sentry authentication (optional)
CODECOV_TOKEN            # Codecov token (optional)
```

### Workflow Triggers

- **CI**: All pushes and PRs
- **Deploy**: Push to main branch
- **Performance**: PRs and daily
- **Dependencies**: Weekly on Monday

### Branch Protection

Enable on main branch:
- Require PR reviews
- Require status checks
- Require up-to-date branches
- No force pushes

## Rollback Procedures

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback {deployment-url}

# Or use dashboard
# Go to Deployments → Select deployment → Promote to Production
```

### Docker

```bash
# Tag and rollback
docker tag precalc-tutor:latest precalc-tutor:backup
docker pull precalc-tutor:{previous-version}
docker tag precalc-tutor:{previous-version} precalc-tutor:latest
docker-compose up -d
```

### Traditional VPS

```bash
# Git rollback
git log --oneline
git checkout {previous-commit}
npm ci
npm run build
pm2 restart precalc-tutor
```

## Troubleshooting

### Build Fails

```bash
# Check logs
vercel logs {deployment-url}

# Common issues
- Missing environment variables
- TypeScript errors
- ESLint errors
- Out of memory (increase memory limit)
```

### Runtime Errors

```bash
# Check health
curl https://your-domain.com/api/health

# Check metrics
curl https://your-domain.com/api/metrics

# View logs (Vercel)
vercel logs --follow

# View logs (Docker)
docker-compose logs -f

# View logs (PM2)
pm2 logs precalc-tutor
```

### Performance Issues

```bash
# Check bundle size
npm run analyze

# Run Lighthouse
npx lighthouse https://your-domain.com --view

# Monitor with DevTools
# Open Chrome DevTools → Performance → Record
```

### Rate Limiting Issues

```bash
# Check rate limit headers
curl -I https://your-domain.com/

# Adjust limits in environment
RATE_LIMIT_MAX=100
AI_RATE_LIMIT_MAX=50

# Or implement Redis for distributed rate limiting
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] API keys rotated
- [ ] Rate limiting active
- [ ] Error messages sanitized
- [ ] Dependencies updated
- [ ] Security audit passed
- [ ] Secrets not in logs
- [ ] CORS configured properly
- [ ] CSP headers tested

## Performance Checklist

- [ ] Lighthouse score ≥ 90
- [ ] Bundle size < 200KB first load
- [ ] Images optimized (AVIF/WebP)
- [ ] Fonts optimized
- [ ] Critical CSS inlined
- [ ] Code splitting implemented
- [ ] Caching configured
- [ ] CDN enabled (Vercel Edge)

## Maintenance

### Weekly
- Review error logs
- Check uptime metrics
- Review security alerts
- Monitor costs

### Monthly
- Update dependencies
- Review performance metrics
- Update documentation
- Backup review

### Quarterly
- Security audit
- Performance optimization
- Capacity planning
- User feedback review

## Support

- **Deployment Issues**: deployment@precalc-tutor.com
- **Security Issues**: security@precalc-tutor.com
- **General Support**: support@precalc-tutor.com

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [nginx Configuration](https://nginx.org/en/docs/)

---

**Last Updated**: January 27, 2026
