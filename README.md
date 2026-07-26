# Marktone Website

Production RTL website for Marktone, built from the approved desktop and mobile art direction.

## Contact form

The contact form sends requests directly by email through the native Vercel API route at `api/contact.js`. It does not use n8n or a webhook.

Set these environment variables in Vercel:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` — defaults to `info@marktone.sa`
- `CONTACT_FROM_EMAIL` — verified sender on the Marktone domain

A matching `.env.example` file is included in the repository.
