/**
 * Decision Intel — Side Panel Controller
 * Extended version of popup.js with detailed bias cards (excerpt, explanation, suggestion).
 * Reuses the same streaming + annotation logic.
 */

document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyze-btn');
  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');
  const errorView = document.getElementById('error-view');
  const errorMsg = document.getElementById('error-msg');
  const retryBtn = document.getElementById('retry-btn');
  const annotateBtn = document.getElementById('annotate-btn');
  const pipelineSteps = document.getElementById('pipeline-steps');
  const progressBar = document.getElementById('progress-bar');
  const summarySection = document.getElementById('summary-section');

  let lastResult = null;

  analyzeBtn.addEventListener('click', startAnalysis);
  retryBtn.addEventListener('click', () => {
    errorView.classList.add('hidden');
    initialView.classList.remove('hidden');
  });

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
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');

      addStep('Extracting content', 'Reading page text...', 'running');

      let contentData;

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
        throw new Error('Could not extract text.');
      }

      completeStep(0);
      progressBar.style.width = '10%';

      const storage = await chrome.storage.local.get(['EXTENSION_API_KEY', 'API_BASE_URL']);
      const apiKey = storage.EXTENSION_API_KEY;
      let apiBaseUrl = storage.API_BASE_URL || 'http://localhost:3000';
      apiBaseUrl = apiBaseUrl.trim().replace(/\/$/, '');
      if (apiBaseUrl && !apiBaseUrl.startsWith('http')) apiBaseUrl = 'https://' + apiBaseUrl;

      if (!apiKey) throw new Error('Extension API Key not configured. Go to Options.');

      const userIdStorage = await chrome.storage.local.get(['EXTENSION_USER_ID']);
      const extensionUserId = userIdStorage.EXTENSION_USER_ID || 'anonymous';

      addStep('Connecting', 'Initiating full analysis...', 'running');

      let result;
      try {
        result = await analyzeWithExtensionApi(
          apiBaseUrl,
          apiKey,
          extensionUserId,
          contentData,
          tab
        );
        completeStep(1);
      } catch {
        // Fall back to streaming endpoint
        completeStep(1);
        addStep('Analyzing', 'Trying streaming analysis...', 'running');
        try {
          result = await analyzeWithStreaming(apiBaseUrl, apiKey, extensionUserId, contentData);
        } catch {
          completeStep(pipelineSteps.querySelectorAll('.pipeline-step').length - 1);
          addStep('Analyzing', 'Using standard analysis...', 'running');
          result = await analyzeStandard(apiBaseUrl, apiKey, extensionUserId, contentData);
          completeStep(pipelineSteps.querySelectorAll('.pipeline-step').length - 1);
        }
      }

      lastResult = result;
      renderResults(result, apiBaseUrl);
      setView('results');

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

  // ─── Extension Analyze API ───────────────────────────────────────────────

  async function analyzeWithExtensionApi(apiBaseUrl, apiKey, extensionUserId, contentData, tab) {
    const response = await fetch(apiBaseUrl + '/api/extension/analyze', {
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
      throw new Error('Extension analyze endpoint unavailable: ' + response.statusText);
    }

    return response.json();
  }

  // ─── Streaming ───────────────────────────────────────────────────────────

  async function analyzeWithStreaming(apiBaseUrl, apiKey, extensionUserId, contentData) {
    const response = await fetch(apiBaseUrl + '/api/analyze/stream', {
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

    if (!response.ok) throw new Error('Stream unavailable');
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
        if (data.type === 'step') handleStreamStep(data);
        else if (data.type === 'result' || data.overallScore !== undefined) {
          finalResult = data.result || data;
        }
      }
    }

    if (!finalResult) throw new Error('No result from stream');
    return finalResult;
  }

  function handleStreamStep(data) {
    pipelineSteps.querySelectorAll('.pipeline-step.running').forEach(el => {
      el.classList.remove('running');
      el.classList.add('complete');
      const icon = el.querySelector('.step-icon');
      if (icon) {
        icon.classList.remove('running');
        icon.classList.add('complete');
        icon.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      }
    });
    if (data.status === 'running') addStep(data.step, data.description || '', 'running');
    if (data.progress) progressBar.style.width = Math.min(95, data.progress) + '%';
  }

  async function analyzeStandard(apiBaseUrl, apiKey, extensionUserId, contentData) {
    const response = await fetch(apiBaseUrl + '/api/analyze', {
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
    if (!response.ok) throw new Error('Analysis failed: ' + response.statusText);
    return response.json();
  }

  // ─── Pipeline Steps ──────────────────────────────────────────────────────

  function addStep(label, description, status) {
    const step = document.createElement('div');
    step.className = 'pipeline-step ' + status;
    const iconSvg =
      status === 'running'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    step.innerHTML =
      '<div class="step-icon ' +
      status +
      '">' +
      iconSvg +
      '</div>' +
      '<div class="step-label">' +
      label +
      (description ? '<span class="step-desc">' + description + '</span>' : '') +
      '</div>';
    pipelineSteps.appendChild(step);
    const allSteps = pipelineSteps.querySelectorAll('.pipeline-step');
    if (allSteps.length > 8) allSteps[0].remove();
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

  // ─── Render Results (Extended for Side Panel) ────────────────────────────

  function renderResults(data, apiBaseUrl) {
    const score = Math.round(data.overallScore || 0);
    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#F59E0B' : '#ef4444';

    const scoreCircle = document.getElementById('score-circle');
    const circumference = 2 * Math.PI * 34;
    scoreCircle.style.stroke = scoreColor;
    scoreCircle.style.strokeDashoffset = String(circumference - (score / 100) * circumference);

    document.getElementById('score-value').textContent = score;

    const verdict = score >= 70 ? 'Good Decision' : score >= 40 ? 'Needs Review' : 'High Risk';
    const verdictEl = document.getElementById('score-verdict');
    verdictEl.textContent = verdict;
    verdictEl.style.color = scoreColor;

    document.getElementById('noise-value').textContent =
      data.noiseScore != null ? Math.round(data.noiseScore) : '--';

    // Summary
    if (data.summary) {
      summarySection.innerHTML = '<strong>Summary:</strong> ' + escapeHtml(data.summary);
      summarySection.classList.remove('hidden');
    } else {
      summarySection.classList.add('hidden');
    }

    // Biases — extended detail cards
    const list = document.getElementById('bias-list-items');
    list.innerHTML = '';

    if (!data.biases || data.biases.length === 0) {
      list.innerHTML = '<li class="bias-empty">No significant biases detected.</li>';
    } else {
      data.biases.forEach(bias => {
        const sev = (bias.severity || 'medium').toLowerCase();
        const li = document.createElement('li');
        li.className = 'bias-item';

        let html =
          '<div class="bias-item-header">' +
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
          '</span>' +
          '</div>';

        if (bias.excerpt) {
          html += '<div class="bias-excerpt">"' + escapeHtml(bias.excerpt) + '"</div>';
        }
        if (bias.explanation) {
          html += '<div class="bias-explanation">' + escapeHtml(bias.explanation) + '</div>';
        }
        if (bias.suggestion) {
          html += '<div class="bias-suggestion">' + escapeHtml(bias.suggestion) + '</div>';
        }

        li.innerHTML = html;
        list.appendChild(li);
      });
    }

    // Fact check
    const fcSection = document.getElementById('fact-check-section');
    if (data.factCheckResult) {
      fcSection.classList.remove('hidden');
      document.getElementById('fc-verified').textContent = data.factCheckResult.verifiedCount || 0;
      document.getElementById('fc-contradicted').textContent =
        data.factCheckResult.contradictedCount || 0;
    } else {
      fcSection.classList.add('hidden');
    }

    const reportBtn = document.getElementById('view-report-btn');
    if (data.documentId) reportBtn.href = apiBaseUrl + '/documents/' + data.documentId;

    progressBar.style.width = '100%';
  }

  // ─── Utils ───────────────────────────────────────────────────────────────

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
      const pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
      throw new Error('PDF Parsing failed.');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
