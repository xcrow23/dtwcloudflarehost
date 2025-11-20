# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dream the Wilderness** is a Cloudflare Pages-hosted website for astrology readings and fiber arts services. It's a single-page application (SPA) with integrated contact form handling via Cloudflare Pages Functions.

**Tech Stack:**
- Frontend: HTML/CSS/Vanilla JavaScript (no build process)
- Backend: Cloudflare Pages Functions (serverless)
- Hosting: Cloudflare Pages
- Email: Resend API (for contact form)
- Email Harvesting: Substack RSS feed integration

## Project Structure

```
DTWCloudflarehost/
├── index.html              # Main SPA file (all content and styling embedded)
├── functions/
│   └── contact.js          # Cloudflare Pages Function for contact form
├── images/                 # Service images
├── downloads/              # PDF downloads (e.g., astrology guide)
├── _headers.txt            # Cloudflare HTTP headers config
├── _redirects.txt          # Cloudflare redirect rules
```

## Architecture

### Frontend (`index.html`)

**Single-Page Architecture:**
- All content sections (Home, Astrology, Craft, Blog, About, Contact) are pre-rendered in HTML with CSS `display: none`
- Navigation uses `showSection()` function to toggle sections via DOM manipulation
- No build process, no external dependencies
- Mobile-responsive design with CSS media queries

**Key Features:**
- Responsive navigation with mobile hamburger menu
- Section-based navigation (not route-based, though `_redirects.txt` provides SPA-friendly URLs like `/#astrology`)
- Substack RSS feed integration for blog posts (via `/api/blog` endpoint)
- Contact form with client-side form submission via `/contact` endpoint

**Styling:**
- Embedded CSS with earthy/mystical theme (browns, golds, earth tones)
- Uses CSS Grid for service cards layout
- Backdrop filters for glass-morphism effects
- Responsive breakpoints at 768px

### Backend (`functions/contact.js`)

**Cloudflare Pages Function** handling POST requests to `/contact`:

**Core Responsibilities:**
1. Parse and validate form data (name, email, service, message)
2. Basic email validation
3. Spam filtering (checks for crypto/casino keywords)
4. HTML escaping to prevent XSS
5. Send emails via Resend API
6. Store submissions in Cloudflare KV (if configured)
7. CORS handling for cross-origin requests

**Environment Variables Required:**
- `RESEND_API_KEY` - API key for Resend email service (required)
- `CONTACT_EMAIL` - Recipient email (defaults to `hello@dreamthewilderness.com`)
- `FROM_EMAIL` - Sender email (defaults to `noreply@dreamthewilderness.com`)
- `CONTACTS_KV` - Optional Cloudflare KV namespace for storing submissions

**Security:**
- CORS restricted to `https://dreamthewilderness.com`
- HTML escaping for all user input in email content
- Email validation regex
- Spam keyword filtering
- CORS preflight request support (OPTIONS)

## Development Commands

Since this uses Cloudflare Pages (no npm/build process), development happens directly on the source files:

**Local Testing:**
```bash
# Test HTML file locally (open in browser)
open index.html

# Or use a simple HTTP server
python -m http.server 8000
```

**Deploy to Cloudflare Pages:**
- Push changes to your Git repository (connected to Cloudflare Pages)
- Cloudflare automatically deploys from your repo
- No build step needed

**Test Contact Form Locally:**
- Use the local server above
- Form submission will attempt to call `/contact` endpoint
- Without Resend API key configured, the function will throw an error (see `contact.js` line 181)

## Key Implementation Details

### Contact Form Flow (`index.html:398-502`)

1. Form submission calls `handleFormSubmit()` (line 450)
2. JavaScript serializes form data and POSTs to `/contact`
3. Function returns JSON response with `success` boolean and message/error
4. Success shows green message, clears form; Error shows red message
5. Button shows "Sending..." state during submission

### Blog Integration

- Loads Substack RSS feed from `/api/blog` endpoint (not yet documented - likely another Cloudflare Worker)
- `loadSubstackPosts()` function (line 571) fetches latest 3 posts
- Displays posts as service cards with truncated description, date, and link to full post

### Redirects Configuration (`_redirects.txt`)

**Important Routes:**
- SEO-friendly paths map to hash routes (e.g., `/astrology` → `/#astrology`)
- Legacy WordPress paths redirect to home
- Social media shortcuts (e.g., `/instagram` → Instagram profile)
- Security: blocks common attack vectors (`/.env`, `/.git/*`, `/admin`)

### Headers Configuration (`_headers.txt`)

**Security Headers:**
- X-Frame-Options: DENY (no clickjacking)
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS enabled (31536000 seconds)

**Caching Strategy:**
- HTML: No cache (must-revalidate)
- Static assets (CSS/JS/images): 1 year immutable cache
- API endpoints: No cache (no-store)

## Common Modification Tasks

**Adding a New Service:**
1. Add section in `index.html` (duplicate service-card structure)
2. Add nav link in header
3. Update `showSection()` navigation logic if needed

**Updating Contact Form:**
1. Modify form fields in HTML (line 398-434)
2. Update FormData parsing in `contact.js` if adding new fields
3. Update email template in `contact.js` (line 51-62)

**Adding Blog Posts:**
- The blog section pulls from Substack RSS automatically
- No manual updates needed if RSS integration is working

**Changing Email Service:**
- Replace `sendEmail()` function in `contact.js` (line 143)
- Update environment variables documentation
- Update error handling for new service

## Important Constraints

- **No dependencies:** Vanilla JavaScript only, no npm packages
- **Single HTML file:** All content is in `index.html`, making it portable and cacheable
- **Client-side routing:** Navigation doesn't use hash routing library; custom `showSection()` implementation
- **Form security:** Input is escaped server-side in `contact.js`; browser form validation also present

## Cloudflare Pages Function Patterns

When modifying or adding functions:
- Export `onRequestPost()`, `onRequestGet()`, `onRequestOptions()` as needed
- Use `context` parameter for `{ request, env }` access
- Return `Response` objects directly
- Resend API integration pattern (lines 145-174) can be adapted for other integrations
