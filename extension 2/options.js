const saveOptions = () => {
    const apiKey = document.getElementById('apiKey').value;
    const apiUrl = document.getElementById('apiUrl').value;

    chrome.storage.local.set(
        { EXTENSION_API_KEY: apiKey, API_BASE_URL: apiUrl },
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.classList.add('visible');
            setTimeout(() => {
                status.classList.remove('visible');
            }, 2000);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.local.get(
        { EXTENSION_API_KEY: '', API_BASE_URL: 'http://localhost:3000' },
        (items) => {
            document.getElementById('apiKey').value = items.EXTENSION_API_KEY;
            document.getElementById('apiUrl').value = items.API_BASE_URL;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
