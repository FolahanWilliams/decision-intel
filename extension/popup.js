/**
 * Decision Intel Extension — Popup Controller
 * Liquid glass UI with SSE streaming progress + inline annotation trigger.
 */

document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const errorView = document.getElementById('error-view');
  const errorMsg = document.getElementById('error-msg');
  const retryBtn = document.getElementById('retry-btn');
  const sidepanelBtn = document.getElementById('sidepanel-btn');
  const annotateBtn = document.getElementById('annotate-btn');
  const pipelineSteps = document.getElementById('pipeline-steps');
  const progressBar = document.getElementById('progress-bar');

  let lastResult = null;
  let lastApiBaseUrl = '';

  analyzeBtn.addEventListener('click', startAnalysis);
  retryBtn.addEventListener('click', () => {
    errorView.classList.add('hidden');
    initialView.classList.remove('hidden');
  });

  // Side panel button
  sidepanelBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });

  // Annotate page button — sends biases to content script
  annotateBtn?.addEventListener('click', async () => {
    if (!lastResult) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'annotate',
        biases: lastResult.biases || [],
        overallScore: lastResult.overallScore,
      });
    }
  });

  async function startAnalysis() {
    setView('loading');
    pipelineSteps.innerHTML = '';
    progressBar.style.width = '0%';

    try {
      // 1. Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      addStep('Extracting content', 'Reading page text...', 'running');

      let contentData;

      // 2. Check if it's a PDF
      if (tab.url && tab.url.toLowerCase().endsWith('.pdf')) {
        contentData = await extractPdfText(tab.url);
      } else {
        const response = await chrome.tabs
          .sendMessage(tab.id, { action: 'getContent' })
          .catch(() => null);

        contentData = response;
        if (!contentData) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
          contentData = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
        }
      }

      if (!contentData || !contentData.text) {
        throw new Error(
          "Could not extract text. For local PDFs (file://), ensure 'Allow access to file URLs' is enabled."
        );
      }

      completeStep(0);
      progressBar.style.width = '10%';

      // 3. Get API config
      const storage = await chrome.storage.local.get(['EXTENSION_API_KEY', 'API_BASE_URL']);
      const apiKey = storage.EXTENSION_API_KEY;
      let apiBaseUrl = storage.API_BASE_URL || 'http://localhost:3000';
      apiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
      if (apiBaseUrl && !apiBaseUrl.startsWith('http')) {
        apiBaseUrl = 'https://' + apiBaseUrl;
      }
      lastApiBaseUrl = apiBaseUrl;

      if (!apiKey) throw new Error('Extension API Key not configured. Go to Options.');

      // 4. Get extension user ID
      const userIdStorage = await chrome.storage.local.get(['EXTENSION_USER_ID']);
      const extensionUserId = userIdStorage.EXTENSION_USER_ID || 'anonymous';

      // 5. Try quick-score endpoint first, fall back to streaming, then standard
      addStep('Connecting', 'Running quick bias scan...', 'running');

      let result;
      try {
        result = await quickScore(apiBaseUrl, apiKey, extensionUserId, contentData, tab);
        completeStep(1);
      } catch {
        // Fall back to streaming endpoint
        completeStep(1);
        addStep('Analyzing', 'Running full analysis...', 'running');
        try {
          result = await analyzeWithStreaming(apiBaseUrl, apiKey, extensionUserId, contentData);
        } catch {
          // Fall back to non-streaming endpoint
          completeStep(pipelineSteps.querySelectorAll('.pipeline-step').length - 1);
          addStep('Analyzing', 'Using standard analysis...', 'running');
          result = await analyzeStandard(apiBaseUrl, apiKey, extensionUserId, contentData);
          completeStep(pipelineSteps.querySelectorAll('.pipeline-step').length - 1);
        }
      }

      lastResult = result;

      // 5. Show Results
      renderResults(result, apiBaseUrl);
      setView('results');

      // 6. Auto-annotate the page
      chrome.tabs
        .sendMessage(tab.id, {
          action: 'annotate',
          biases: result.biases || [],
          overallScore: result.overallScore,
        })
        .catch(() => {});
    } catch (err) {
      console.error(err);
      errorMsg.textContent = err.message || 'Failed to analyze page.';
      setView('error');
    }
  }

  // ─── Quick Score (Extension API) ──────────────────────────────────────────

  async function quickScore(apiBaseUrl, apiKey, extensionUserId, contentData, tab) {
    const QUICK_SCORE_URL = apiBaseUrl + '/api/extension/quick-score';

    const response = await fetch(QUICK_SCORE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-key': apiKey,
        'x-extension-user-id': extensionUserId,
      },
      body: JSON.stringify({
        content: contentData.text,
        url: tab.url || undefined,
        title: contentData.title || tab.title || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Quick score endpoint unavailable: ' + response.statusText);
    }

    const data = await response.json();

    // Map quick-score response to the result format expected by renderResults
    return {
      overallScore: data.score,
      noiseScore: null,
      biases: (data.biases || []).map(b => ({
        biasType: b.type,
        severity: b.severity,
        excerpt: b.excerpt,
        found: true,
      })),
      summary: 'Quick scan completed. Grade: ' + data.grade,
      processedAt: data.processedAt,
    };
  }

  // ─── Streaming Analysis (SSE) ────────────────────────────────────────────

  async function analyzeWithStreaming(apiBaseUrl, apiKey, extensionUserId, contentData) {
    const STREAM_URL = apiBaseUrl + '/api/analyze/stream';

    const response = await fetch(STREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-key': apiKey,
        'x-extension-user-id': extensionUserId,
      },
      body: JSON.stringify({
        text: contentData.text,
        filename: contentData.title || 'Web Page',
        fileType: contentData.fileType || 'web',
      }),
    });

    if (!response.ok) {
      throw new Error('Stream endpoint unavailable');
    }

    completeStep(1);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        const line = part.trim();
        if (!line) continue;

        let data;
        if (line.startsWith('data: ')) {
          try {
            data = JSON.parse(line.slice(6));
          } catch {
            continue;
          }
        } else if (line.startsWith('{')) {
          try {
            data = JSON.parse(line);
          } catch {
            continue;
          }
        }

        if (!data) continue;

        if (data.type === 'step') {
          handleStreamStep(data);
        } else if (data.type === 'result' || data.overallScore !== undefined) {
          finalResult = data.result || data;
        }
      }
    }

    if (!finalResult) {
      throw new Error('No result received from stream');
    }

    return finalResult;
  }

  function handleStreamStep(data) {
    const existingSteps = pipelineSteps.querySelectorAll('.pipeline-step');

    // Mark all previous running steps as complete
    existingSteps.forEach(el => {
      if (el.classList.contains('running')) {
        el.classList.remove('running');
        el.classList.add('complete');
        const icon = el.querySelector('.step-icon');
        if (icon) {
          icon.classList.remove('running');
          icon.classList.add('complete');
          icon.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
        }
      }
    });

    if (data.status === 'running') {
      addStep(data.step, data.description || '', 'running');
    }

    if (data.progress) {
      progressBar.style.width = Math.min(95, data.progress) + '%';
    }
  }

  // ─── Standard (non-streaming) Analysis ───────────────────────────────────

  async function analyzeStandard(apiBaseUrl, apiKey, extensionUserId, contentData) {
    const API_URL = apiBaseUrl + '/api/analyze';

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-key': apiKey,
        'x-extension-user-id': extensionUserId,
      },
      body: JSON.stringify({
        text: contentData.text,
        filename: contentData.title || 'Web Page',
        fileType: contentData.fileType || 'web',
      }),
    });

    if (!response.ok) {
      throw new Error('Analysis failed: ' + response.statusText);
    }

    return response.json();
  }

  // ─── Pipeline Step UI ────────────────────────────────────────────────────

  function addStep(label, description, status) {
    const step = document.createElement('div');
    step.className = 'pipeline-step ' + status;

    const iconClass = status === 'running' ? 'running' : 'complete';
    const iconSvg =
      status === 'running'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';

    step.innerHTML =
      '<div class="step-icon ' +
      iconClass +
      '">' +
      iconSvg +
      '</div>' +
      '<div class="step-label">' +
      label +
      (description ? '<span class="step-desc">' + description + '</span>' : '') +
      '</div>';

    pipelineSteps.appendChild(step);

    // Keep only last 5 visible to avoid overflow
    const allSteps = pipelineSteps.querySelectorAll('.pipeline-step');
    if (allSteps.length > 5) {
      allSteps[0].remove();
    }
  }

  function completeStep(index) {
    const steps = pipelineSteps.querySelectorAll('.pipeline-step');
    if (steps[index]) {
      steps[index].classList.remove('running');
      steps[index].classList.add('complete');
      const icon = steps[index].querySelector('.step-icon');
      if (icon) {
        icon.classList.remove('running');
        icon.classList.add('complete');
        icon.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      }
    }
  }

  // ─── Render Results ──────────────────────────────────────────────────────

  function renderResults(data, apiBaseUrl) {
    const score = Math.round(data.overallScore || 0);
    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#F59E0B' : '#ef4444';

    // Score ring animation
    const scoreCircle = document.getElementById('score-circle');
    const circumference = 2 * Math.PI * 34; // r=34
    const offset = circumference - (score / 100) * circumference;
    scoreCircle.style.stroke = scoreColor;
    scoreCircle.style.strokeDashoffset = String(offset);

    document.getElementById('score-value').textContent = score;

    // Verdict
    const verdict = score >= 70 ? 'Good Decision' : score >= 40 ? 'Needs Review' : 'High Risk';
    const verdictEl = document.getElementById('score-verdict');
    verdictEl.textContent = verdict;
    verdictEl.style.color = scoreColor;

    // Noise
    const noiseEl = document.getElementById('noise-value');
    noiseEl.textContent = data.noiseScore != null ? Math.round(data.noiseScore) : '--';

    // Biases
    const list = document.getElementById('bias-list-items');
    list.innerHTML = '';

    if (!data.biases || data.biases.length === 0) {
      list.innerHTML = '<li class="bias-empty">No significant biases detected.</li>';
    } else {
      data.biases.slice(0, 5).forEach(bias => {
        const sev = (bias.severity || 'medium').toLowerCase();
        const li = document.createElement('li');
        li.className = 'bias-item';
        li.innerHTML =
          '<div class="bias-severity-dot ' +
          sev +
          '"></div>' +
          '<div class="bias-info"><span class="bias-name">' +
          escapeHtml(bias.biasType) +
          '</span></div>' +
          '<span class="bias-severity-label ' +
          sev +
          '">' +
          sev +
          '</span>';
        list.appendChild(li);
      });
    }

    // Fact Check
    const fcSection = document.getElementById('fact-check-section');
    if (data.factCheckResult) {
      fcSection.classList.remove('hidden');
      document.getElementById('fc-verified').textContent = data.factCheckResult.verifiedCount || 0;
      document.getElementById('fc-contradicted').textContent =
        data.factCheckResult.contradictedCount || 0;

      const noteEl = document.getElementById('fc-note');
      if (data.factCheckResult.score >= 80) {
        noteEl.textContent = 'Data verified against real-time market stats.';
        noteEl.style.color = 'var(--success)';
      } else if (data.factCheckResult.score < 50) {
        noteEl.textContent = 'Warning: Significant contradictions found.';
        noteEl.style.color = 'var(--error)';
      } else {
        noteEl.textContent = 'Analyzed against real-time market data.';
        noteEl.style.color = 'var(--text-muted)';
      }
    } else {
      fcSection.classList.add('hidden');
    }

    // Report link
    const reportBtn = document.getElementById('view-report-btn');
    if (data.documentId) {
      reportBtn.href = apiBaseUrl + '/documents/' + data.documentId;
    }

    // Progress bar to 100%
    progressBar.style.width = '100%';
  }

  // ─── View Management ─────────────────────────────────────────────────────

  function setView(viewName) {
    [initialView, loadingView, resultsView, errorView].forEach(el => el.classList.add('hidden'));
    if (viewName === 'initial') initialView.classList.remove('hidden');
    if (viewName === 'loading') loadingView.classList.remove('hidden');
    if (viewName === 'results') resultsView.classList.remove('hidden');
    if (viewName === 'error') errorView.classList.remove('hidden');
  }

  // ─── PDF Extraction ──────────────────────────────────────────────────────

  async function extractPdfText(url) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDocument = await loadingTask.promise;

      let fullText = '';
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
      }

      let filename = url.split('/').pop() || 'Document.pdf';
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        void e;
      }

      return { title: filename, text: fullText.trim(), fileType: 'pdf' };
    } catch (e) {
      console.error('PDF Extract error:', e);
      throw new Error(
        "PDF Parsing failed: Check if the extension has 'Allow access to file URLs' enabled."
      );
    }
  }

  // ─── Utils ───────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
