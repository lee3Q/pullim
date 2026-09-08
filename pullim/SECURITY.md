# Security Policy

## Reporting Security Issues

**Do not report security vulnerabilities through public GitHub issues.**

If you discover a security issue, please report it privately to the maintainer.

## API Key Exposure

- **Never commit API keys, tokens, or secrets to the repository.** Use `.env.local` (gitignored) for all credentials.
- If you accidentally push a key, rotate it immediately and open an issue to request removal from git history.
- The `.env.example` file contains only placeholder values and documentation.

## Crisis Safety Vulnerabilities

If you find a way to bypass the crisis detection system (RED/YELLOW tier), please report it as a security issue. This includes:

- Input that should trigger RED or YELLOW but doesn't.
- Ways to suppress or circumvent the safety response.
- Prompts that could cause the LLM to ignore safety guards.

These reports will be prioritized.

## Secret Exposure in Code

If you discover hardcoded secrets, credentials, or personal data in the codebase:

1. Do not publish the finding publicly.
2. Report it privately so it can be removed.
3. If the secret was pushed to git history, it must be rotated regardless.

## Deployment Security

### Rate Limiting

**The current codebase does not include rate limiting on any API route.**

Before deploying a public instance with real API keys:

- Implement rate limiting (e.g., upstash/ratelimit, Vercel KV, or a reverse proxy).
- Priority routes: `ultimate/listen`, `ultimate/analyze`, `ultimate/debate` (multiple LLM calls per request).

### Request Body Size

- No body size limits are enforced on API routes.
- Add `Content-Length` checks before `JSON.parse()` in production.

### Authentication

- No authentication is implemented. All API routes are publicly accessible.
- For hosted deployments, add at minimum a simple auth layer.

### Supabase

- If using Supabase for session persistence, enable Row Level Security (RLS) policies.
- The `anon` key is designed for client-side use but requires RLS to be safe.
- Without RLS, any client can read or modify any row.

### Error Responses

- API error responses include `error.message` content but not stack traces.
- Review error messages to ensure they don't leak internal implementation details in production.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x | Yes |
| < 0.1 | No |
