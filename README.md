# Text Stats

A lightweight Chrome extension that analyzes selected text or full-page content and displays detailed statistics: character count (with and without spaces), word count, sentence count, paragraph count, estimated reading time, unique word count, and the longest word.

## Chrome Web Store Description

**One-line summary:** Instantly analyze any text on the web — character counts, word counts, reading time, and more — right from your toolbar.

**Detailed description:**

Text Stats gives you instant insight into any text you find on the web. Select a passage on any page, click the extension icon, and see a clean breakdown of:

- Characters (with and without spaces)
- Word count
- Sentence count
- Paragraph count
- Estimated reading time (based on 200 words per minute)
- Unique word count
- Longest word

Two analysis modes let you choose: analyze only the text you've selected, or scan the entire visible page. Results are displayed in a polished, compact popup that respects your system's dark mode preference and works with right-to-left languages (Arabic, Hebrew, Farsi, Urdu).

Copy the entire stats summary to your clipboard with one click — perfect for writers, editors, students, translators, and anyone who works with text.

**What makes Text Stats different?**
- Privacy-first: everything runs locally on your device. No data is ever sent anywhere.
- Clean, modern UI with dark mode support and RTL language compatibility.
- Smart full-page analysis that intelligently extracts meaningful content while skipping code blocks, scripts, and hidden elements.
- Stays out of your way — no permissions beyond the active tab, no background processes, no account needed.

## Permission Justifications

### `activeTab`

This permission allows the extension to temporarily access the currently active tab when you click the extension icon. It is required so the extension can read the text on the page you are viewing. The access is narrow and temporary — it only applies to the current tab in the current window, and only when the extension is actively invoked. The extension cannot read tabs in the background or collect browsing history.

### `scripting`

This permission allows the extension to inject a small JavaScript function into the current tab to extract visible text. The function runs once, returns the text content to the popup, and is immediately discarded. No persistent scripts are loaded into any page. This is the standard, recommended approach for MV3 extensions that need to interact with page content on demand.

## Development

```
# No build step required — this is a vanilla extension.
# Load it in Chrome via chrome://extensions → Load unpacked.
```

### Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `popup.html` | Popup UI markup |
| `popup.css` | Popup styles (light/dark theme) |
| `popup.js` | Popup logic: text extraction, stats computation, UI management |
| `content.js` | Placeholder content script (unused — injection is inline) |
| `_locales/en/messages.json` | English locale strings |
| `privacy.html` | Standalone privacy policy page |

## Privacy

Text Stats is fully offline. No data is collected, stored, or transmitted. See [privacy.html](privacy.html) for the full policy.
