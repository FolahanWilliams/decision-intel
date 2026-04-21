# Decision Intel Browser Extension

Chrome extension for real-time cognitive bias detection on any web page.

## Installation (Developer Mode)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Select the `extension/` directory from this repository
5. The Decision Intel icon will appear in your browser toolbar

## Configuration

1. Right-click the extension icon and select **Options** (or click the gear icon)
2. Enter your **Extension API Key** -- this is the `EXTENSION_API_KEY` value from your server's environment variables
3. Enter your **Extension User ID** -- a unique identifier for your account (alphanumeric, hyphens, and underscores only, max 128 characters)
4. Set the **API Base URL** to your Decision Intel server (defaults to `http://localhost:3000` for local development)
5. Click **Save Settings**

### Server-Side Setup

Make sure your Decision Intel server has the `EXTENSION_API_KEY` environment variable set. This shared secret authenticates the extension's API requests.

```bash
# In your .env file
EXTENSION_API_KEY=your-secure-random-key-here
```

## Features

### Popup Quick Scan

Click the extension icon to open the popup. Hit **Analyze** to run a fast bias-only scan of the current page via `/api/extension/quick-score`. Results include:

- Overall bias score (0-100) and letter grade
- Top detected cognitive biases with severity levels
- Relevant text excerpts for each bias

The quick scan is optimized for speed (under 15 seconds) and is rate-limited to 30 scans per hour.

### Side Panel Full Analysis

Click the side panel button in the popup (or use Chrome's side panel menu) to open the full analysis view. This runs the complete Decision Intel analysis pipeline via `/api/extension/analyze`, which includes:

- Overall decision quality score and noise score
- Detailed bias detection with excerpts, explanations, and suggestions
- Fact-checking against real-time data sources
- Full summary and recommendations

Full analyses are rate-limited to 10 per hour.

### Page Annotations

After analysis, biases are automatically highlighted on the page with inline annotations. You can also re-trigger annotations using the **Annotate Page** button.

### Context Menu

Right-click selected text and choose **Audit this text for biases** to analyze a specific passage.

### PDF Support

The extension can analyze PDF files opened in Chrome. For local PDFs (`file://` URLs), ensure **Allow access to file URLs** is enabled in the extension settings on `chrome://extensions/`.

## API Endpoints

| Endpoint                     | Method | Rate Limit | Description                       |
| ---------------------------- | ------ | ---------- | --------------------------------- |
| `/api/extension/quick-score` | POST   | 30/hour    | Fast bias-only scan               |
| `/api/extension/analyze`     | POST   | 10/hour    | Full analysis pipeline            |
| `/api/analyze/stream`        | POST   | 5/hour     | SSE streaming analysis (fallback) |
| `/api/analyze`               | POST   | 5/hour     | Standard analysis (fallback)      |

All endpoints require `x-extension-key` and `x-extension-user-id` headers.

## Troubleshooting

- **"Extension API Key not configured"** -- Open the extension options and enter your API key
- **"Unauthorized"** -- Verify the API key matches the server's `EXTENSION_API_KEY` environment variable and that you have set an Extension User ID
- **Rate limit exceeded** -- Wait for the rate limit window to reset (1 hour)
- **PDF parsing failed** -- Enable "Allow access to file URLs" in `chrome://extensions/` for this extension
- **Cannot extract text** -- Some pages block content scripts; try copying the text manually
