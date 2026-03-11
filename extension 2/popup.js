// CONFIGURATION
// Create a vercel deployment and update options page
// Removed hardcoded API_BASE_URL

document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const initialView = document.getElementById('initial-view');
    const loadingView = document.getElementById('loading-view');
    const resultsView = document.getElementById('results-view');
    const errorView = document.getElementById('error-view');
    const errorMsg = document.getElementById('error-msg');
    const retryBtn = document.getElementById('retry-btn');


    analyzeBtn.addEventListener('click', startAnalysis);
    retryBtn.addEventListener('click', () => {
        errorView.classList.add('hidden');
        initialView.classList.remove('hidden');
    });

    async function startAnalysis() {
        setView('loading');

        try {
            // 1. Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab?.id) throw new Error("No active tab found");

            let contentData;

            // 2. Check if it's a PDF
            if (tab.url && tab.url.toLowerCase().endsWith('.pdf')) {
                contentData = await extractPdfText(tab.url);
            } else {
                // Execute content script to get text from standard HTML
                const response = await chrome.tabs.sendMessage(tab.id, { action: "getContent" }).catch(() => null);

                // If content script fails (e.g. strict CSP or restricted page), inject it manually first
                contentData = response;
                if (!contentData) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    contentData = await chrome.tabs.sendMessage(tab.id, { action: "getContent" });
                }
            }

            if (!contentData || !contentData.text) {
                throw new Error("Could not extract text. For local PDFs (file://), ensure 'Allow access to file URLs' is enabled for this extension.");
            }

            // 3. Send to API
            const storage = await chrome.storage.local.get(['EXTENSION_API_KEY', 'API_BASE_URL']);
            const apiKey = storage.EXTENSION_API_KEY; // Managed via options page
            let apiBaseUrl = storage.API_BASE_URL || 'http://localhost:3000';
            
            // Sanitize the URL (e.g., if user types "decision-intel.vercel.app" without https://)
            apiBaseUrl = apiBaseUrl.trim();
            if (apiBaseUrl.endsWith('/')) {
                apiBaseUrl = apiBaseUrl.slice(0, -1);
            }
            if (apiBaseUrl && !apiBaseUrl.startsWith('http')) {
                apiBaseUrl = 'https://' + apiBaseUrl;
            }
            const API_URL = `${apiBaseUrl}/api/analyze`;

            if (!apiKey) throw new Error('Extension API Key not configured. Go to Options.');

            const apiResponse = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-extension-key': apiKey
                },
                body: JSON.stringify({
                    text: contentData.text,
                    filename: contentData.title || "Web Page",
                    fileType: "web"
                })
            });

            if (!apiResponse.ok) {
                throw new Error(`Analysis failed: ${apiResponse.statusText}`);
            }

            const result = await apiResponse.json();

            // 4. Show Results
            renderResults(result, apiBaseUrl);
            setView('results');

        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message || "Failed to analyze page.";
            setView('error');
        }
    }

    function renderResults(data, apiBaseUrl) {
        // Score
        document.getElementById('score-value').textContent = Math.round(data.overallScore) + "/100";

        // Biases
        const list = document.getElementById('bias-list-items');
        list.innerHTML = '';

        if (!data.biases || data.biases.length === 0) {
            list.innerHTML = '<li class="bias-item">No significant biases detected.</li>';
        } else {
            // Show top 3
            data.biases.slice(0, 3).forEach(bias => {
                const li = document.createElement('li');
                li.className = 'bias-item';
                li.innerHTML = `
          <span class="bias-name">${bias.biasType}</span>
          <span class="bias-severity">${bias.severity} Severity</span>
        `;
                list.appendChild(li);
            });
        }

        // Financial Fact Check
        const fcSection = document.getElementById('fact-check-section');
        if (data.factCheckResult) {
            fcSection.classList.remove('hidden');
            document.getElementById('fc-verified').textContent = data.factCheckResult.verifiedCount || 0;
            document.getElementById('fc-contradicted').textContent = data.factCheckResult.contradictedCount || 0;

            const stats = data.factCheckResult;
            const noteEl = document.getElementById('fc-note');

            if (stats.score >= 80) {
                noteEl.textContent = "Data verified against real-time market stats.";
                noteEl.style.color = "var(--success)";
            } else if (stats.score < 50) {
                noteEl.textContent = "Warning: Significant contradictions found.";
                noteEl.style.color = "var(--danger)";
            } else {
                noteEl.textContent = "Analyzed against real-time market data.";
                noteEl.style.color = "var(--text-secondary)";
            }
        }

        // Link to full report
        const reportBtn = document.getElementById('view-report-btn');
        reportBtn.href = `${apiBaseUrl}/documents/${data.documentId}`;
    }

    function setView(viewName) {
        [initialView, loadingView, resultsView, errorView].forEach(el => el.classList.add('hidden'));

        if (viewName === 'initial') initialView.classList.remove('hidden');
        if (viewName === 'loading') loadingView.classList.remove('hidden');
        if (viewName === 'results') resultsView.classList.remove('hidden');
        if (viewName === 'error') errorView.classList.remove('hidden');
    }

    async function extractPdfText(url) {
        try {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();

            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDocument = await loadingTask.promise;

            let fullText = "";
            for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
                const page = await pdfDocument.getPage(pageNum);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(" ") + "\\n\\n";
            }

            let filename = url.split('/').pop() || "Document.pdf";
            try { filename = decodeURIComponent(filename); } catch(e){}

            return { title: filename, text: fullText.trim(), fileType: "pdf" };
        } catch (e) {
            console.error("PDF Extract error:", e);
            throw new Error("PDF Parsing failed: Check if the extension has 'Allow access to file URLs' enabled.");
        }
    }
});
