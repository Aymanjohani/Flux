# Export LinkedIn Cookies

Since LinkedIn is blocking the API library, we can use session cookies from your browser.

## Method 1: Browser Extension (Easiest)

1. Install "Cookie-Editor" extension in your browser
2. Go to linkedin.com (while logged in)
3. Click Cookie-Editor icon
4. Click "Export" → "JSON"
5. Save the output to `config/cookies.json`

## Method 2: Manual Export

In browser console (F12), run:
```javascript
copy(document.cookie)
```

Then paste into `config/cookies.txt`

## Method 3: Python Script with Browser

We can also switch to using Playwright/Selenium to control your actual browser session.

---

**Once we have cookies, I'll update the scripts to use them instead of direct API login.**
