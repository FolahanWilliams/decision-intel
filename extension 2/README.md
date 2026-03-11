# Decision Intelligence - Chrome Extension

This extension integrates your browser with the Decision Intelligence Platform, allowing you to analyze web pages for cognitive biases and decision noise in real-time.

## 📦 Installation

1.  **Download & Unzip**:
    - Locate the `extension.zip` file in your project root (or `extension/` folder).
    - Unzip it to a folder on your computer.

2.  **Load in Chrome**:
    - Open Chrome and navigate to `chrome://extensions`.
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked**.
    - Select the unzipped `extension` folder.

## ⚙️ Configuration

By default, the extension connects to your **Localhost** (`http://localhost:3000`).

### Switching to Production (Vercel)
To use the extension with your live deployment:

1.  Open `popup.js` in a text editor.
2.  Locate the configuration section at the top:
    ```javascript
    // CONFIGURATION
    const API_BASE_URL = 'http://localhost:3000'; 
    ```
3.  Replace the URL with your Vercel deployment URL:
    ```javascript
    const API_BASE_URL = 'https://your-app-name.vercel.app';
    ```
4.  Save the file.
5.  Go back to `chrome://extensions` and click the **Reload** (refresh) icon on the Decision Intel card.

## 🚀 Usage

1.  Navigate to any article, email, or text-heavy webpage.
2.  Click the **Decision Intel** icon in your browser toolbar.
3.  Click **"Analyze Page"**.
4.  View the **Decision Score**, **Noise Level**, and **Biases** directly in the popup.
5.  Click **"View Full Report"** to open detailed analysis in the main application.

## 🛠 Troubleshooting

-   **"Connection Failed"**: Ensure your application (Localhost or Vercel) is running and accessible.
-   **"No Content Found"**: The extension works best on pages with substantial text. Avoid empty tabs or image-only sites.
