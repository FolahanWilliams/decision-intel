
import { BigQuery } from '@google-cloud/bigquery';
import { AuditState } from './types';

// Lazy singleton for BigQuery client
let bqInstance: BigQuery | null = null;

function getBQ() {
    if (!bqInstance) {
        // Project ID is usually required, using default or env
        bqInstance = new BigQuery();
    }
    return bqInstance;
}

export interface MarketIndicator {
    name: string;
    value: number;
    date: string;
    description: string;
}

/**
 * Fetches macroeconomic indicators from BigQuery Public Datasets (FRED).
 * This provides high-fidelity, free data for grounding financial decisions.
 */
export async function getMacroIndicators(): Promise<MarketIndicator[]> {
    const bq = getBQ();

    // Querying FRED (Federal Reserve Economic Data) from BigQuery Public
    const query = `
        SELECT 
            series_id as name,
            value,
            date
        FROM \`bigquery-public-data.fred.fred_series_data\`
        WHERE series_id IN ('FEDFUNDS', 'CPIAUCSL', 'GDP')
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
        ORDER BY date DESC
        LIMIT 10
    `;

    try {
        const [rows] = await bq.query({ query });
        return rows.map((row: any) => ({
            name: row.name,
            value: row.value,
            date: row.date.value,
            description: getIndicatorDescription(row.name)
        }));
    } catch (error) {
        console.error('BigQuery Error:', error);
        return [];
    }
}

function getIndicatorDescription(id: string): string {
    const descriptions: Record<string, string> = {
        'FEDFUNDS': 'Effective Federal Funds Rate',
        'CPIAUCSL': 'Consumer Price Index (Inflation)',
        'GDP': 'Gross Domestic Product'
    };
    return descriptions[id] || 'Economic Indicator';
}

/**
 * Node to inject macroeconomic context into the analysis state.
 */
export async function marketDataNode(state: AuditState): Promise<Partial<AuditState>> {
    console.log("Fetching Macroeconomic context from BigQuery...");

    try {
        const indicators = await getMacroIndicators();

        // This context will be used by the riskScorer and strategicAnalysis nodes
        return {
            institutionalMemory: {
                ...state.institutionalMemory,
                macroContext: indicators
            } as any
        };
    } catch (e) {
        console.warn("Market Data Node failed (non-critical):", e);
        return {};
    }
}
