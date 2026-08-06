# Auth.js / NextAuth Configuration Guide

## Overview
DÜŞÜNCE İZİ uses Auth.js (NextAuth v5) for teacher and admin authentication with Prisma Adapter for session and user persistence.

## Required Variables
```env
AUTH_SECRET="your_generated_32_byte_secret"
AUTH_URL="https://your-domain.com"
GOOGLE_CLIENT_ID="<your-google-oauth-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-oauth-client-secret>"
```

## Security Controls
- HttpOnly, SameSite=Lax, Secure cookies in production
- Role-based server guard helpers (`requireTeacher`, `requireAdmin`)
- Explicit removal of client-side role switching or open email simulation
