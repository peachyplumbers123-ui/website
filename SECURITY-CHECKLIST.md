# Vercel Deployment Security Checklist

## Before Deploy
- Replace `REPLACE_WITH_REAL_FORM_ACCESS_KEY` in `src/pages/index.astro`.
- In Web3Forms dashboard, restrict submissions to your exact domain(s).
- Ensure form email notifications go to a monitored mailbox.
- Confirm no secrets are stored in frontend code.

## Vercel Project Settings
- Enforce HTTPS (default on Vercel).
- Set Production, Preview, and Development domains explicitly.
- Enable deployment protection for Preview branches.
- Limit team/member access by least privilege.

## Header / Browser Hardening
- Keep these headers active in `vercel.json`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `X-Frame-Options`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`

## Form Abuse Protection
- Keep honeypot fields enabled (`website`, `botcheck`).
- Keep minimum fill-time check and 30s submit cooldown.
- Review suspicious submission patterns weekly.
- If spam increases, add CAPTCHA (Cloudflare Turnstile).

## Ongoing Maintenance
- Run `npm audit --omit=dev` before each production deploy.
- Re-run Lighthouse + security headers check after major changes.
- Keep dependencies updated monthly.
