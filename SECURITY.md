# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of PreCalc Tutor seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email: **security@precalc-tutor.com**

Include the following information:

1. **Description**: Detailed description of the vulnerability
2. **Impact**: What an attacker could achieve
3. **Steps to Reproduce**: Step-by-step instructions
4. **Proof of Concept**: Code or screenshots demonstrating the issue
5. **Suggested Fix**: If you have ideas for remediation
6. **Your Information**: Name and contact details (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Status Updates**: Every 7 days until resolution
- **Fix Timeline**: Critical issues within 30 days

### Disclosure Policy

- Please give us reasonable time to fix the issue before public disclosure
- We will credit you in our security advisories (if desired)
- We follow coordinated disclosure principles

## Security Measures

### Application Security

#### Authentication & Authorization
- No user authentication currently implemented
- Future: OAuth2/OpenID Connect planned
- API keys stored securely in environment variables

#### API Security
- Rate limiting on all routes (60 req/min)
- Stricter rate limiting on AI routes (30 req/min)
- Input validation using Zod schemas
- CORS configuration in place

#### Data Protection
- Client-side storage using IndexedDB
- No PII collected currently
- Future: Encryption at rest planned

#### Infrastructure Security
- HTTPS enforced in production
- Security headers configured (CSP, HSTS, etc.)
- Regular dependency updates
- Automated security scanning in CI/CD

### Network Security

#### Headers
```
Content-Security-Policy: Configured
Strict-Transport-Security: max-age=63072000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

#### Rate Limiting
- General routes: 60 requests/minute per IP
- AI routes: 30 requests/minute per IP
- Future: Redis-based distributed rate limiting

### Development Security

#### Code Security
- TypeScript for type safety
- ESLint security rules
- Dependency vulnerability scanning
- No secrets in code (env vars only)

#### CI/CD Security
- Automated security audits
- Secret scanning (TruffleHog)
- Dependency review on PRs
- SAST scanning planned

### Third-Party Services

#### Anthropic Claude API
- API keys stored in environment variables
- Never exposed to client
- Rate limited to prevent abuse
- Errors sanitized before logging

#### Vercel Deployment
- Environment variables encrypted
- Automatic HTTPS
- DDoS protection
- Edge caching

## Security Best Practices

### For Developers

1. **Never commit secrets**
   - Use `.env.local` for local development
   - Add to `.gitignore`
   - Use Vercel environment variables for production

2. **Validate all input**
   - Use Zod schemas for API inputs
   - Sanitize user-generated content
   - Validate on both client and server

3. **Handle errors safely**
   - Don't expose stack traces in production
   - Log errors securely (Sentry)
   - Return generic error messages to users

4. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update dependencies monthly
   - Review security advisories

5. **Follow secure coding practices**
   - Use parameterized queries (when DB added)
   - Avoid eval() and similar functions
   - Use Content Security Policy

### For Users

1. **Protect your API keys**
   - Never share your Anthropic API key
   - Rotate keys if compromised
   - Use read-only keys when possible

2. **Keep software updated**
   - Update to latest version
   - Apply security patches promptly

3. **Report suspicious activity**
   - Unusual behavior or errors
   - Potential security issues
   - Phishing attempts

## Known Security Considerations

### Current Limitations

1. **No User Authentication**
   - Impact: No user account protection
   - Mitigation: Planned for future release
   - Workaround: Use environment-based access control

2. **Client-Side Storage**
   - Impact: Data stored in browser
   - Mitigation: No sensitive data stored
   - Workaround: Clear browser data regularly

3. **In-Memory Rate Limiting**
   - Impact: Rate limits reset on restart
   - Mitigation: Works for single-instance deployments
   - Workaround: Use Redis for distributed systems

### Future Enhancements

- [ ] User authentication (OAuth2)
- [ ] Database with encryption at rest
- [ ] Redis-based rate limiting
- [ ] SAST/DAST scanning
- [ ] Penetration testing
- [ ] Bug bounty program

## Compliance

### GDPR Compliance
- No personal data collected currently
- Future: Privacy policy and data protection measures

### Accessibility
- WCAG 2.1 Level AA target
- Regular accessibility audits
- Screen reader support

## Security Contacts

- **Security Issues**: security@precalc-tutor.com
- **General Support**: support@precalc-tutor.com
- **Website**: https://precalc-tutor.vercel.app

## Security Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

*No vulnerabilities reported yet*

---

**Last Updated**: January 27, 2026

Thank you for helping keep PreCalc Tutor secure!
