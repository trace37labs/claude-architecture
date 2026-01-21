# Security Rules

## Authentication

- All API endpoints require authentication
- Use JWT tokens with 1-hour expiration
- Refresh tokens valid for 7 days maximum
- Implement rate limiting: 100 requests per minute per user

## Authorization

- Follow principle of least privilege
- Use role-based access control (RBAC)
- Validate permissions on every request
- Never trust client-side authorization checks

## Data Protection

- Encrypt all sensitive data at rest using AES-256
- Use TLS 1.3 for all network communication
- Never log passwords, tokens, or PII
- Implement data retention policies (30-day default)

## Secrets Management

- Store secrets in environment variables or vault
- Never commit secrets to version control
- Rotate API keys quarterly
- Use different credentials for dev/staging/prod

## Input Validation

- Validate all user input on server side
- Use parameterized queries to prevent SQL injection
- Sanitize HTML to prevent XSS attacks
- Limit file upload sizes to 10MB

## Dependency Security

- Run `npm audit` before every release
- Auto-update patch versions weekly
- Review major version updates manually
- Maintain Software Bill of Materials (SBOM)

## Incident Response

- Security incidents escalated within 1 hour
- Incident response team: security@example.com
- Post-mortem required for all security incidents
- Vulnerability disclosure policy published
