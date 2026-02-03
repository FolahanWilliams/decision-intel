# 🧩 How to Install the Decision Intelligence Extension

**Prerequisite**: You need the `production-extension.zip` file.
- **Source A (GitHub)**: Download it from your `decision-intel` repository.
- **Source B (Local)**: It is located at `/Users/folahan/.gemini/antigravity/scratch/decision-intel/production-extension.zip`.

---

### 1. 📂 Unzip the File (Critical!)
The plugin **cannot** be installed while inside a `.zip` file.
1.  Find `production-extension.zip` in your file explorer (Finder).
2.  **Double-click** it to extract it.
3.  You should now see a **folder** (likely named `production-extension` or just `extension`).

### 2. ⚡️ Enable Developer Mode
1.  Open Google Chrome.
2.  In the address bar, type: `chrome://extensions` and press Enter.
3.  In the top-right corner, make sure the **"Developer mode"** switch is toggled **ON**.

### 3. 📥 Load the Extension
1.  Click the button that says **"Load unpacked"** (top left).
2.  A file chooser will appear. Select the **folder** you created in Step 1.
    -   *Note*: Do not select the zip file. Select the **folder** containing `manifest.json`, `popup.html`, etc.

### 4. ✅ Verify
1.  You should see "Decision Intel Audit" appear in your list of extensions.
2.  Pin it to your toolbar for easy access.
3.  Navigate to a news article (e.g., CNN, BBC, TechCrunch).
4.  Click the extension icon and hit **"Analyze Page"**.
5.  It should connect to your live Vercel app (`https://decision-intel-ppj3.vercel.app`) and return a score.

---

### ❓ Troubleshooting

**"Manifest file is missing or unreadable"**
-   **Cause**: You likely selected the wrong folder level.
-   **Fix**: Go into the folder you selected. Does it contain `manifest.json`? If not, the actual extension might be one folder deeper (e.g., `production-extension/extension/`). Select that inner folder.

**"Connection Failed"**
-   **Cause**: The extension can't reach your Vercel URL.
-   **Fix**: Visit `https://decision-intel-ppj3.vercel.app` in your browser to make sure the site is up. If the site works, the extension should work.
