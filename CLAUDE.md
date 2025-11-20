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
├── index.html              # Main SPA file (HTML + embedded CSS)
├── js/
│   ├── main.js             # Navigation, section switching, event delegation
│   ├── blog-loader.js      # Substack RSS fetching and display
│   └── contact-form.js     # Contact form validation and submission
├── functions/
│   ├── contact.js          # Cloudflare Pages Function for contact form
│   └── api/
│       └── blog.js         # Cloudflare Worker for RSS feed caching
├── images/                 # Optimized service images
├── downloads/              # PDF downloads (e.g., astrology guide)
├── _headers.txt            # Cloudflare HTTP headers config
├── _redirects.txt          # Cloudflare redirect rules
├── CLAUDE.md               # This file - guidance for Claude Code
└── DEV_JOURNEY.md          # Development journey and project history
```

## Architecture

### Frontend (`index.html` + `js/` directory)

**Single-Page Architecture:**
- All content sections (Home, Astrology, Craft, Blog, About, Contact) are pre-rendered in HTML
- Navigation uses hash-based routing (`#astrology`, `#contact`, etc.)
- Event delegation for all interactive elements (no inline `onclick` attributes)
- No build process, no external dependencies
- Mobile-responsive design with CSS media queries

**JavaScript Modules:**
1. **`js/main.js`** - Core navigation and DOM management
   - `showSection(sectionName)` - Display section and update URL hash
   - `setupNavigationDelegation()` - Event delegation for nav links
   - `setupMobileMenuToggle()` - Mobile hamburger menu handler
   - Browser history support via `popstate` event
   - Real-time URL syncing with browser history

2. **`js/blog-loader.js`** - Substack RSS integration
   - `loadSubstackPosts()` - Fetch from `/api/blog` endpoint with 8s timeout
   - `displayBlogPosts(posts)` - Render blog posts as service cards
   - `showBlogError(message)` - Error handling with retry button
   - Skeleton loading animation during fetch
   - XSS prevention via `escapeHtml()`

3. **`js/contact-form.js`** - Contact form handling
   - Form validation with field-specific error messages
   - Real-time error clearing on focus/input
   - Cloudflare Turnstile CAPTCHA integration
   - 10-second fetch timeout with AbortController
   - Contextual error messages for network/timeout issues

**Key Features:**
- Event delegation throughout - no inline event handlers
- Hash-based navigation with browser back/forward support
- Responsive mobile menu with click-outside closing
- Substack RSS feed integration with caching
- Field-level form validation with inline error display
- CAPTCHA protection on contact form
- Automatic timeout handling for all async operations

**Styling:**
- Embedded CSS with earthy/mystical theme (browns, golds, earth tones)
- 50+ semantic CSS classes for consistency and maintainability
- CSS Grid for service cards layout
- Backdrop filters with Firefox fallback (solid background)
- Responsive breakpoints at 768px for mobile
- Explicit image dimensions to prevent layout shift

### Backend (`functions/` directory)

**Two Cloudflare Pages Functions:**

#### 1. Contact Form Handler (`functions/contact.js`)
Handles POST requests to `/contact`:

**Core Responsibilities:**
1. Parse and validate form data (name, email, service, message)
2. Email format validation with regex
3. Spam filtering (crypto, casino, lottery keywords)
4. HTML escaping to prevent XSS attacks
5. Send emails via Resend API
6. Store submissions in Cloudflare KV with automatic 90-day expiration
7. CORS handling for cross-origin requests
8. Turnstile CAPTCHA token validation (frontend-based)

**Environment Variables:**
- `RESEND_API_KEY` - API key for Resend email service (required)
- `CONTACT_EMAIL` - Recipient email (defaults to `hello@dreamthewilderness.com`)
- `FROM_EMAIL` - Sender email (defaults to `noreply@dreamthewilderness.com`)
- `CONTACTS_KV` - Optional Cloudflare KV namespace for submissions (with 90-day TTL)

**Security Measures:**
- CORS restricted to `https://dreamthewilderness.com`
- HTML escaping for all user input in email
- Email validation regex
- Spam keyword filtering
- CORS preflight support (OPTIONS)
- Cloudflare Turnstile CAPTCHA verification
- KV data auto-expiration for privacy

#### 2. Blog RSS Feed Handler (`functions/api/blog.js`)
Handles GET requests to `/api/blog`:

**Core Responsibilities:**
1. Fetch Substack RSS feed from `https://dreamthewilderness.substack.com/feed`
2. Parse XML with regex-based extraction
3. Cache results in Cloudflare KV (10-minute TTL)
4. Extract featured images from CDATA descriptions
5. Clean and truncate descriptions (200 chars)
6. Return JSON with latest posts
7. CORS support for frontend access

**Features:**
- Automatic caching to reduce external API calls
- Cache hit detection - returns cached data when available
- Fresh fetch on cache miss with automatic re-caching
- Featured image extraction from HTML in RSS descriptions
- Sort by publish date (newest first)
- Response includes cache metadata (cached boolean, updatedAt timestamp)

**Security:**
- CORS headers allow cross-origin requests
- No sensitive data exposed

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

## Image Optimization

**Current Images:** Located in `/images/` directory
- `astrology-landing.jpg` (83KB) - Hero image for astrology section
- `fiber-arts-landing.jpg` (158KB) - Hero image for fiber arts section
- `business-card.jpg` (11KB) - Currently unused, available for future content

**Optimization Already Applied:**
- Lazy loading enabled (`loading="lazy"`)
- Explicit dimensions set (prevents layout shift)
- Responsive design with CSS `object-fit: cover`

**Further Optimization Options:**
1. **Format Conversion:**
   - Convert JPG to WebP for 25-35% size reduction
   - Keep JPG as fallback for older browsers
   - Use `<picture>` element with `srcset`

2. **Compression Tools:**
   - TinyJPG/TinyPNG for lossy compression (online)
   - ImageMagick for batch processing: `mogrify -quality 80 *.jpg`
   - Cloudflare Image Optimization can handle this automatically

3. **Responsive Images:**
   - Add `srcset` for different screen sizes
   - Serve smaller images on mobile (e.g., 400px instead of 600px)
   - Use `sizes` attribute for better optimization

4. **Cloudflare Integration:**
   - Enable Cloudflare Image Optimization in dashboard
   - Automatic format selection (WebP for modern browsers)
   - Automatic responsive image serving
   - No code changes needed

**Current Size Impact:**
- Total local images: ~252KB
- Page load: ~1-2 seconds (with Cloudflare caching)
- First paint improvement: Lazy loading defers off-screen images

## Recent Improvements (Latest Session)

### Code Quality & Maintainability
- **Event Delegation Refactoring**: Removed all inline `onclick` handlers; now uses centralized event delegation for better maintainability
- **JavaScript Modularization**: Separated concerns into three focused modules (main.js, blog-loader.js, contact-form.js)
- **CSS Class System**: 50+ semantic classes for consistency and future dark mode support

### User Experience & Validation
- **Field-Specific Error Messages**: Form validation shows errors directly under relevant fields, not in a global message
- **Real-Time Error Clearing**: Errors disappear when user focuses/types in field, improving user experience
- **Contextual Error Messages**: Network, timeout, and validation errors now provide helpful guidance and actionable steps
- **Try Again Button**: Blog loading errors include retry button and fallback to Substack link

### Performance & Caching
- **RSS Feed Caching**: Blog posts cached for 10 minutes in Cloudflare KV to reduce external API calls
- **Image Optimization**: Lazy loading and explicit dimensions (width/height) to prevent layout shift
- **Resource Preconnect Hints**: DNS prefetch and preconnect for external domains (Unsplash, Resend, Substack)

### Browser Compatibility & Accessibility
- **CSS Fallbacks**: Backdrop-filter effects fallback to darker backgrounds for Firefox and older browsers
- **Improved ARIA Roles**: Removed misused `role="menubar"` from navigation; now uses semantic HTML with proper labeling
- **Enhanced Alt Text**: All images have descriptive, contextual alt text for screen reader users
- **Keyboard Navigation**: All interactive elements accessible via keyboard with proper focus indicators

### Security & Privacy
- **Cloudflare Turnstile CAPTCHA**: Integrated on contact form to prevent automated spam submissions
- **Timeout Handling**: All async operations have timeouts (8s blog fetch, 10s contact form) to prevent hanging requests
- **KV Data Expiration**: Contact submissions automatically deleted after 90 days for privacy compliance
- **Enhanced Input Validation**: Separate validation for empty vs. invalid format errors

### Code Organization Improvements
- **Blog Endpoint Correct Path**: API endpoint moved to `functions/api/blog.js` for proper routing structure
- **Skeleton Loader Cleanup**: Skeleton animation clears on timeout with error message instead of lingering indefinitely
- **Error Handling Pipeline**: Specific error detection for timeouts, network issues, HTTP errors, and CAPTCHA failures

## Common Modification Tasks

**Adding a New Service:**
1. Add new section in `index.html` with id matching service name
2. Add nav link in header with `data-section` attribute
3. Use existing CSS classes (.service-card, .hero, etc.)
4. Event delegation automatically handles navigation

**Updating Contact Form:**
1. Add new form fields in `index.html` fieldset
2. Update validation in `js/contact-form.js` - add new validation function
3. Update email template in `functions/contact.js` - modify HTML template
4. Add field-specific error span with id `{fieldname}-error`
5. Optional: Add new environment variables for field-specific handling

**Adding Blog Posts:**
- Blog section automatically fetches latest posts from Substack RSS via `/api/blog` endpoint
- No manual updates needed - all posts pulled and cached automatically
- Update Substack feed URL in `functions/api/blog.js` if needed

**Changing Email Service:**
1. Replace `sendEmail()` function in `functions/contact.js`
2. Update environment variables (RESEND_API_KEY → alternative service key)
3. Update error handling and response messages
4. Test with form submission
5. Update CLAUDE.md documentation

**Adding Event Handlers:**
- Use centralized event delegation in `js/main.js` or relevant module
- Add `data-` attributes to HTML elements to identify interactive elements
- Never add inline `onclick` handlers - use event delegation instead
- Example: `<button data-action="submit">` handled in setup function with `addEventListener`

**Modifying Blog Display:**
- Customize in `js/blog-loader.js` `displayBlogPosts()` function
- Adjust post limit in `loadSubstackPosts()` - currently shows 3 latest
- Modify error display in `showBlogError()` - including Try Again button logic

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
