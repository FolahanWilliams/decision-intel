
import { getFinnhubProfile, getFinnhubQuote, getFinnhubMetrics, getFinnhubPeers } from './finnhub';

// Domain Types (matching original interface)
export interface StockProfile {
    symbol: string;
    price: number;
    companyName: string;
    description: string;
    sector: string;
    industry: string;
    mktCap: number;
    isEtf: boolean;
}

export interface StockQuote {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    dayLow: number;
    dayHigh: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    priceAvg50: number;
    priceAvg200: number;
    volume: number;
    avgVolume: number;
    pe: number;
    eps: number;
}

export interface IncomeStatement {
    date: string;
    symbol: string;
    revenue: number;
    costOfRevenue: number;
    grossProfit: number;
    grossProfitRatio: number;
    operatingIncome: number;
    operatingIncomeRatio: number;
    netIncome: number;
    netIncomeRatio: number;
    eps: number;
    epsdiluted: number;
}

export interface SectorPerformance {
    sector: string;
    changesPercentage: string;
}

// Claim type enum for categorization
export type ClaimType = 'revenue' | 'stock_price' | 'market_cap' | 'competitor' | 'industry' | 'general';

// Main enriched financial context function
export async function getEnrichedFinancialContext(
    ticker: string,
    claimTypes: ClaimType[]
): Promise<Record<string, unknown>> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return { error: "No FINNHUB API Key configured" };

    const context: Record<string, unknown> = {};

    try {
        const profile = await getCompanyProfile(ticker, apiKey);
        if (profile) {
            context.profile = profile;
        }

        const fetchPromises: Promise<void>[] = [];

        if (claimTypes.includes('stock_price') || claimTypes.includes('market_cap')) {
            fetchPromises.push(
                getStockQuote(ticker, apiKey).then(quote => {
                    if (quote) context.quote = quote;
                })
            );
        }

        if (claimTypes.includes('revenue')) {
            fetchPromises.push(
                getIncomeStatement(ticker, apiKey).then(income => {
                    if (income) context.financials = income;
                })
            );
        }

        if (claimTypes.includes('competitor')) {
            fetchPromises.push(
                getStockPeers(ticker, apiKey).then(peers => {
                    if (peers) context.peers = peers;
                })
            );
        }

        await Promise.all(fetchPromises);
        return context;

    } catch (e) {
        console.error("Finnhub Enriched Fetch Error", e);
        return { error: `Failed to fetch enriched data for ${ticker}` };
    }
}

// Individual endpoint functions (Adapters)
export async function getCompanyProfile(ticker: string, apiKey: string): Promise<StockProfile | null> {
    return await getFinnhubProfile(ticker, apiKey);
}

export async function getStockQuote(ticker: string, apiKey: string): Promise<StockQuote | null> {
    const quote = await getFinnhubQuote(ticker, apiKey);
    const metrics = await getFinnhubMetrics(ticker, apiKey);

    if (quote && metrics) {
        // Enrich quote with metrics
        quote.pe = metrics.peAnnual || 0;
        quote.eps = metrics.epsTTM || 0;
        quote.yearHigh = metrics['52WeekHigh'] || 0;
        quote.yearLow = metrics['52WeekLow'] || 0;
        quote.marketCap = metrics.marketCapitalization ? metrics.marketCapitalization * 1000000 : 0;
        quote.priceAvg50 = 0; // Not available simple
        quote.priceAvg200 = 0;
        quote.avgVolume = 0;
    }
    return quote;
}

export async function getIncomeStatement(ticker: string, apiKey: string): Promise<IncomeStatement | null> {
    // Map TTM metrics to pseud-IncomeStatement
    const metrics = await getFinnhubMetrics(ticker, apiKey);
    if (!metrics) return null;

    return {
        date: 'TTM (Trailing Twelve Months)',
        symbol: ticker,
        revenue: 0, // Finnhub metrics doesn't always have raw revenue TTM absolute
        costOfRevenue: 0,
        grossProfit: 0,
        grossProfitRatio: 0,
        operatingIncome: 0,
        operatingIncomeRatio: 0,
        netIncome: 0,
        netIncomeRatio: 0,
        eps: metrics.epsTTM || 0,
        epsdiluted: metrics.epsTTM || 0
    };
}

export async function getQuarterlyIncomeStatement(ticker: string, _: string): Promise<object | null> {
    // Finnhub Free does not support historical quarterly data via simple API.
    // Returning null to indicate unavailablity (Fact Checker will define as UNVERIFIABLE)
    console.warn(`Quarterly history not supported on Finnhub Free Tier for ${ticker}`);
    return null;
}

export async function getKeyMetrics(ticker: string, apiKey: string): Promise<object | null> {
    return await getFinnhubMetrics(ticker, apiKey);
}

export async function getHistoricalPrice(_: string, __: string): Promise<object | null> {
    // Basic metrics doesn't support generic history without 'candle'
    // For now returning null
    return null;
}

export async function getStockPeers(ticker: string, apiKey: string): Promise<string[] | null> {
    return await getFinnhubPeers(ticker, apiKey);
}

export async function getSectorPerformance(_: string): Promise<object[] | null> {
    // Not available on Finnhub
    return null;
}



// Legacy function
export async function getFinancialContext(ticker: string): Promise<string> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return "Error: No FINNHUB API Key configured.";

    const profile = await getFinnhubProfile(ticker, apiKey);
    if (!profile) return `No data found for ticker: ${ticker}`;

    return JSON.stringify({
        symbol: profile.symbol,
        company: profile.companyName,
        sector: profile.sector,
        industry: profile.industry
    });
}

// ============================================================
// Data Request Types (kept for consistency with nodes.ts)
// ============================================================
export type DataRequestType =
    | 'profile'
    | 'quote'
    | 'income_annual'
    | 'income_quarterly'
    | 'key_metrics'
    | 'historical_price'
    | 'peers'
    | 'sector_performance';

export interface DataRequest {
    ticker: string;
    dataType: DataRequestType;
    reason: string;
    claimToVerify?: string;
}

// Execute a single data request
export async function executeDataRequest(request: DataRequest): Promise<{ request: DataRequest; data: unknown; error?: string }> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: FINNHUB_API_KEY is missing in environment variables");
        return { request, data: null, error: "Configuration Error: Missing FINNHUB_API_KEY" };
    }

    try {
        let data: unknown = null;

        switch (request.dataType) {
            case 'profile':
                data = await getCompanyProfile(request.ticker, apiKey);
                break;
            case 'quote':
                data = await getStockQuote(request.ticker, apiKey);
                break;
            case 'income_annual':
                data = await getIncomeStatement(request.ticker, apiKey);
                break;
            case 'income_quarterly':
                data = await getQuarterlyIncomeStatement(request.ticker, apiKey);
                break;
            case 'key_metrics':
                data = await getKeyMetrics(request.ticker, apiKey);
                break;
            case 'historical_price':
                data = await getHistoricalPrice(request.ticker, apiKey);
                break;
            case 'peers':
                data = await getStockPeers(request.ticker, apiKey);
                break;
            case 'sector_performance':
                data = await getSectorPerformance(apiKey);
                break;
            default:
                return { request, data: null, error: `Unknown data type: ${request.dataType}` };
        }

        return { request, data };
    } catch (e) {
        console.error(`Data request failed for ${request.ticker}:${request.dataType}`, e);
        return { request, data: null, error: String(e) };
    }
}

// Execute multiple data requests in parallel
export async function executeDataRequests(requests: DataRequest[]): Promise<Record<string, unknown>> {
    console.log(`Executing ${requests.length} data requests...`);

    const results = await Promise.all(requests.map(executeDataRequest));

    // Organize results by ticker and data type
    const organized: Record<string, Record<string, unknown>> = {};

    for (const result of results) {
        const { ticker, dataType } = result.request;
        if (!organized[ticker]) {
            organized[ticker] = {};
        }

        if (result.error) {
            organized[ticker][dataType] = { error: result.error };
        } else {
            organized[ticker][dataType] = result.data;
        }
    }

    return organized;
}
