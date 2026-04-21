/**
 * Decision Intel — Content Script
 * Handles text extraction + inline bias annotations on web pages.
 */

// ─── Text Extraction ──────────────────────────────────────────────────────────

function extractContent() {
  const article =
    document.querySelector('article') ||
    document.querySelector('main') ||
    document.querySelector('.content') ||
    document.body;
  if (!article) return '';

  const paragraphs = Array.from(article.querySelectorAll('p, h1, h2, h3, h4, li'));
  const textContent = paragraphs
    .map(p => p.innerText.trim())
    .filter(text => text.length > 20)
    .join('\n\n');

  return textContent.substring(0, 15000);
}

// ─── Inline Annotations ──────────────────────────────────────────────────────

let activeTooltip = null;
let summaryBadge = null;

function clearAnnotations() {
  document.querySelectorAll('.di-bias-highlight').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
  if (summaryBadge) {
    summaryBadge.remove();
    summaryBadge = null;
  }
}

function annotatePageWithBiases(biases, overallScore) {
  clearAnnotations();
  if (!biases || biases.length === 0) return;

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: node => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tag))
        return NodeFilter.FILTER_REJECT;
      if (parent.closest('.di-bias-tooltip, .di-summary-badge')) return NodeFilter.FILTER_REJECT;
      if (node.textContent.trim().length < 10) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  let annotatedCount = 0;

  biases.forEach(bias => {
    if (!bias.excerpt || bias.excerpt.length < 10) return;

    const excerptNormalized = bias.excerpt
      .replace(/[\u201C\u201D\u2018\u2019]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const searchText = excerptNormalized.substring(0, 60);

    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      if (!textNode.parentNode) continue;

      const nodeText = textNode.textContent.toLowerCase();
      const matchIdx = nodeText.indexOf(searchText);
      if (matchIdx === -1) continue;

      const matchEnd = Math.min(matchIdx + excerptNormalized.length, textNode.textContent.length);

      try {
        const range = document.createRange();
        range.setStart(textNode, matchIdx);
        range.setEnd(textNode, matchEnd);

        const highlight = document.createElement('span');
        highlight.className = 'di-bias-highlight';
        highlight.dataset.severity = bias.severity || 'medium';
        highlight.dataset.biasType = bias.biasType || 'Unknown';
        highlight.dataset.explanation = bias.explanation || '';
        highlight.dataset.suggestion = bias.suggestion || '';
        highlight.dataset.confidence = String(Math.round((bias.confidence || 0.7) * 100));

        range.surroundContents(highlight);

        highlight.addEventListener('mouseenter', showTooltip);
        highlight.addEventListener('mouseleave', hideTooltip);

        annotatedCount++;
      } catch {
        // Range may fail on complex DOM — skip silently
      }

      break;
    }
  });

  if (annotatedCount > 0 || overallScore != null) {
    showSummaryBadge(overallScore, annotatedCount);
  }
}

function showTooltip(e) {
  hideTooltip();

  const el = e.currentTarget;
  const tooltip = document.createElement('div');
  tooltip.className = 'di-bias-tooltip';

  const severity = el.dataset.severity;
  tooltip.innerHTML =
    '<div class="di-tooltip-type">' +
    el.dataset.biasType +
    ' <span class="di-tooltip-badge" data-severity="' +
    severity +
    '">' +
    severity +
    '</span>' +
    '<span style="margin-left:auto;font-size:11px;font-weight:400;color:#64748b">' +
    el.dataset.confidence +
    '% conf.</span>' +
    '</div>' +
    (el.dataset.explanation
      ? '<div class="di-tooltip-explanation">' + el.dataset.explanation + '</div>'
      : '') +
    (el.dataset.suggestion
      ? '<div class="di-tooltip-suggestion">' + el.dataset.suggestion + '</div>'
      : '');

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;

  const rect = el.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;

  if (top + tooltipRect.height > window.innerHeight) {
    top = rect.top - tooltipRect.height - 8;
  }
  if (left + tooltipRect.width > window.innerWidth) {
    left = window.innerWidth - tooltipRect.width - 12;
  }
  if (left < 12) left = 12;

  tooltip.style.top = top + 'px';
  tooltip.style.left = left + 'px';

  requestAnimationFrame(function () {
    tooltip.classList.add('visible');
  });
}

function hideTooltip() {
  if (activeTooltip) {
    activeTooltip.remove();
    activeTooltip = null;
  }
}

function showSummaryBadge(score, biasCount) {
  if (summaryBadge) summaryBadge.remove();

  const badge = document.createElement('div');
  badge.className = 'di-summary-badge';

  var scoreClass = score >= 70 ? 'good' : score >= 40 ? 'medium' : 'bad';

  badge.innerHTML =
    '<div class="di-summary-score ' +
    scoreClass +
    '">' +
    Math.round(score) +
    '</div>' +
    '<div class="di-summary-text">' +
    biasCount +
    ' bias' +
    (biasCount !== 1 ? 'es' : '') +
    ' found' +
    '<small>Decision Intel</small>' +
    '</div>' +
    '<button class="di-summary-close" title="Dismiss">&times;</button>';

  badge.querySelector('.di-summary-close').addEventListener('click', function (e) {
    e.stopPropagation();
    clearAnnotations();
  });

  badge.addEventListener('click', function () {
    chrome.runtime.sendMessage({ action: 'openSidePanel' });
  });

  document.body.appendChild(badge);
  summaryBadge = badge;
}

// ─── Message Listener ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContent') {
    const text = extractContent();
    sendResponse({
      text: text,
      title: document.title,
      url: window.location.href,
    });
  }

  if (request.action === 'annotate') {
    annotatePageWithBiases(request.biases, request.overallScore);
    sendResponse({ success: true });
  }

  if (request.action === 'clearAnnotations') {
    clearAnnotations();
    sendResponse({ success: true });
  }

  return true;
});
