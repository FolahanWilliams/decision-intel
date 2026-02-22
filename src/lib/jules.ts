// Jules API Client

const JULES_API_BASE = 'https://jules.googleapis.com/v1alpha';
function getJulesApiKey(): string {
    const key = process.env.JULES_API_KEY;
    if (!key) {
        throw new Error('Missing required environment variable: JULES_API_KEY');
    }
    return key;
}

/**
 * Jules API Client
 * Wraps the REST API for Google's Jules Coding Assistant.
 */
export const jules = {
    /**
     * List available sources (e.g., GitHub repos)
     */
    async listSources() {
        return fetch(`${JULES_API_BASE}/sources`, {
            headers: { 'x-goog-api-key': getJulesApiKey() }
        }).then(r => r.json());
    },

    /**
     * Create a new coding session
     */
    async createSession(prompt: string, sourceIdx: number = 0, startingBranch: string = 'main') {
        // First get the source name
        const sources = await this.listSources();
        if (!sources.sources || sources.sources.length === 0) {
            throw new Error("No Jules sources found. Install the Jules GitHub app first.");
        }
        const sourceName = sources.sources[sourceIdx]?.name;

        return fetch(`${JULES_API_BASE}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': getJulesApiKey()
            },
            body: JSON.stringify({
                prompt,
                sourceContext: {
                    source: sourceName,
                    githubRepoContext: { startingBranch }
                },
                automationMode: "AUTO_CREATE_PR",
                title: prompt.slice(0, 50)
            })
        }).then(r => r.json());
    },

    /**
     * List activities in a session (chat history/status)
     */
    async listActivities(sessionId: string) {
        return fetch(`${JULES_API_BASE}/sessions/${sessionId}/activities?pageSize=30`, {
            headers: { 'x-goog-api-key': getJulesApiKey() }
        }).then(r => r.json());
    },

    /**
     * Send a follow-up message to Jules
     */
    async sendMessage(sessionId: string, message: string) {
        return fetch(`${JULES_API_BASE}/sessions/${sessionId}:sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': getJulesApiKey()
            },
            body: JSON.stringify({ prompt: message })
        }).then(r => r.json());
    }
};
