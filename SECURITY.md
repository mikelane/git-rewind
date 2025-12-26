# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do NOT open a public issue for security vulnerabilities.**

Instead, please email **mike@mikelane.io** with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment** within 48 hours
- **Status update** within 7 days
- **Resolution timeline** based on severity

### Scope

Security issues we're interested in:

- Authentication/authorization bypasses
- Data exposure vulnerabilities
- XSS, CSRF, or injection attacks
- Session management issues
- Sensitive data in logs or errors

### Out of Scope

- Vulnerabilities in dependencies (report to the dependency maintainer)
- Social engineering attacks
- Physical security issues
- Issues requiring unlikely user interaction

## Security Measures

Git Rewind implements several security measures:

- **Encrypted sessions** - Access tokens are encrypted with HS256 JWT
- **CSRF protection** - OAuth state parameter validation
- **Secure cookies** - httpOnly, secure, sameSite flags
- **Input validation** - All API inputs are validated
- **XSS prevention** - HTML escaping in exports
- **Read-only access** - GitHub App has no write permissions
- **No data storage** - Tokens exist only in session, stats generated on-demand

## Security Headers

The application sets the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

Thank you for helping keep Git Rewind secure!
