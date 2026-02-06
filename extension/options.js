// Saves options to chrome.storage
const saveOptions = () => {
    const apiKey = document.getElementById('apiKey').value;

    chrome.storage.local.set(
        { EXTENSION_API_KEY: apiKey },
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
        { EXTENSION_API_KEY: '' },
        (items) => {
            document.getElementById('apiKey').value = items.EXTENSION_API_KEY;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
