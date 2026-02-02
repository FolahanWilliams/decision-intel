document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyze-btn');
    const initialView = document.getElementById('initial-view');
    const loadingView = document.getElementById('loading-view');
    const resultsView = document.getElementById('results-view');
    const errorView = document.getElementById('error-view');
    const errorMsg = document.getElementById('error-msg');
    const retryBtn = document.getElementById('retry-btn');

    // API Endpoint (Localhost for dev)
    const API_URL = 'http://localhost:3000/api/analyze';

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

            // 2. Execute content script to get text
            const response = await chrome.tabs.sendMessage(tab.id, { action: "getContent" }).catch(() => null);

            // If content script fails (e.g. strict CSP or restricted page), inject it manually first
            let contentData = response;
            if (!contentData) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                contentData = await chrome.tabs.sendMessage(tab.id, { action: "getContent" });
            }

            if (!contentData || !contentData.text) {
                throw new Error("Could not extract text from this page.");
            }

            // 3. Send to API
            const apiResponse = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
            renderResults(result);
            setView('results');

        } catch (err) {
            console.error(err);
            errorMsg.textContent = err.message || "Failed to analyze page.";
            setView('error');
        }
    }

    function renderResults(data) {
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

        // Link to full report
        const reportBtn = document.getElementById('view-report-btn');
        reportBtn.href = `http://localhost:3000/documents/${data.documentId}`;
    }

    function setView(viewName) {
        [initialView, loadingView, resultsView, errorView].forEach(el => el.classList.add('hidden'));

        if (viewName === 'initial') initialView.classList.remove('hidden');
        if (viewName === 'loading') loadingView.classList.remove('hidden');
        if (viewName === 'results') resultsView.classList.remove('hidden');
        if (viewName === 'error') errorView.classList.remove('hidden');
    }
});
