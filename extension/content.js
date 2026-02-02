// Simple readability heuristic to extract main text
function extractContent() {
    // Try to find main article content first
    const article = document.querySelector('article') || document.querySelector('main') || document.querySelector('.content') || document.body;

    if (!article) return "";

    // Get all paragraphs
    const paragraphs = Array.from(article.querySelectorAll('p, h1, h2, h3, h4, li'));

    // Filter out short/empty nodes and navigation
    const textContent = paragraphs
        .map(p => p.innerText.trim())
        .filter(text => text.length > 20) // Skip very short lines
        .join('\n\n');

    // Limit to reasonable size for API
    return textContent.substring(0, 15000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        const text = extractContent();
        sendResponse({
            text: text,
            title: document.title,
            url: window.location.href
        });
    }
    return true;
});
