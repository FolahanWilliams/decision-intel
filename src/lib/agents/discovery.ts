
import { SearchServiceClient } from '@google-cloud/discoveryengine';
import { AuditState } from './types';

// Configuration from environment
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
const LOCATION = process.env.DISCOVERY_ENGINE_LOCATION || 'global';
const DATA_STORE_ID = process.env.DISCOVERY_ENGINE_DATA_STORE_ID || 'news-reports-store';
const SERVING_CONFIG_ID = 'default_config';

// Lazy singleton client
let searchClient: SearchServiceClient | null = null;

function getSearchClient() {
    if (!searchClient) {
        searchClient = new SearchServiceClient();
    }
    return searchClient;
}

export interface DiscoveryResult {
    title: string;
    link: string;
    snippet: string;
}

/**
 * Performs a deep search using Vertex AI Search (Discovery Engine)
 */
export async function searchDiscoveryEngine(query: string): Promise<DiscoveryResult[]> {
    const client = getSearchClient();

    const servingConfig = client.projectLocationCollectionDataStoreServingConfigPath(
        PROJECT_ID,
        LOCATION,
        'default_collection',
        DATA_STORE_ID,
        SERVING_CONFIG_ID
    );

    try {
        const [response] = await client.search({
            servingConfig,
            query,
            pageSize: 5,
        });

        // The response might be the SearchResponse or a list of results depending on gRPC/REST mapping
        const results = (response as any).results || (Array.isArray(response) ? response : []);

        return results.map((result: any) => {
            const document = result.document;
            const structData = document?.structData || {};
            return {
                title: structData.title || document?.name || 'Deep Search Result',
                link: structData.link || structData.url || '',
                snippet: result.snippet || structData.summary || '',
            };
        });
    } catch (error) {
        console.error('Discovery Engine Search Error:', error);
        return [];
    }
}

/**
 * Node to perform high-fidelity search for news and reports
 */
export async function discoverySearchNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("Performing Deep Search using Discovery Engine...");

    // Extract key topics for search from state or content
    const query = state.factCheckResult?.primaryTopic || state.originalContent.slice(0, 100);

    try {
        const results = await searchDiscoveryEngine(query);

        // Inject results into state for use by factChecker and riskScorer
        return {
            institutionalMemory: {
                ...state.institutionalMemory,
                discoveryResults: results
            } as any
        };
    } catch (e) {
        console.warn("Discovery Search Node failed (non-critical):", e);
        return {};
    }
}
