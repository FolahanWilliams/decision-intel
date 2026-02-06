// Helper to fetch data from Financial Modeling Prep
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Type definitions for FMP responses
interface StockProfile {
    symbol: string;
    price: number;
    companyName: string;
    description: string;
    sector: string;
    industry: string;
    mktCap: number;
    isEtf: boolean;
}

interface StockQuote {
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

interface IncomeStatement {
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

interface SectorPerformance {
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
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return { error: "No FMP API Key configured" };

    const context: Record<string, unknown> = {};

    try {
        // Always fetch profile for basic info
        const profile = await getCompanyProfile(ticker, apiKey);
        if (profile) {
            context.profile = profile;
        }

        // Fetch based on claim types
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

        if (claimTypes.includes('industry')) {
            fetchPromises.push(
                getSectorPerformance(apiKey).then(sectors => {
                    if (sectors) context.sectorPerformance = sectors;
                })
            );
        }

        await Promise.all(fetchPromises);
        return context;

    } catch (e) {
        console.error("FMP Enriched Fetch Error", e);
        return { error: `Failed to fetch enriched data for ${ticker}` };
    }
}

// Individual endpoint functions
export async function getCompanyProfile(ticker: string, apiKey: string): Promise<object | null> {
    try {
        const response = await fetch(`${BASE_URL}/profile/${ticker}?apikey=${apiKey}`);
        const data = await response.json() as StockProfile[];

        if (Array.isArray(data) && data.length > 0) {
            const profile = data[0];
            return {
                symbol: profile.symbol,
                company: profile.companyName,
                sector: profile.sector,
                industry: profile.industry,
                marketCap: formatMarketCap(profile.mktCap),
                marketCapRaw: profile.mktCap,
                description: profile.description?.substring(0, 300) + "..."
            };
        }
        return null;
    } catch (e) {
        console.error("FMP Profile Error", e);
        return null;
    }
}

export async function getStockQuote(ticker: string, apiKey: string): Promise<object | null> {
    try {
        const response = await fetch(`${BASE_URL}/quote/${ticker}?apikey=${apiKey}`);
        const data = await response.json() as StockQuote[];

        if (Array.isArray(data) && data.length > 0) {
            const quote = data[0];
            return {
                symbol: quote.symbol,
                currentPrice: quote.price,
                change: quote.change,
                changePercent: quote.changesPercentage,
                dayRange: `$${quote.dayLow} - $${quote.dayHigh}`,
                yearRange: `$${quote.yearLow} - $${quote.yearHigh}`,
                marketCap: formatMarketCap(quote.marketCap),
                pe: quote.pe?.toFixed(2) || 'N/A',
                eps: quote.eps?.toFixed(2) || 'N/A',
                avg50Day: quote.priceAvg50,
                avg200Day: quote.priceAvg200,
                volume: formatVolume(quote.volume),
                avgVolume: formatVolume(quote.avgVolume)
            };
        }
        return null;
    } catch (e) {
        console.error("FMP Quote Error", e);
        return null;
    }
}

export async function getIncomeStatement(ticker: string, apiKey: string): Promise<object | null> {
    try {
        // Get last 4 quarters for YoY comparison
        const response = await fetch(`${BASE_URL}/income-statement/${ticker}?period=annual&limit=2&apikey=${apiKey}`);
        const data = await response.json() as IncomeStatement[];

        if (Array.isArray(data) && data.length > 0) {
            const latest = data[0];
            const previous = data[1];

            // Calculate YoY growth if we have previous year
            let revenueGrowth = null;
            let netIncomeGrowth = null;
            if (previous) {
                revenueGrowth = ((latest.revenue - previous.revenue) / previous.revenue * 100).toFixed(1);
                netIncomeGrowth = ((latest.netIncome - previous.netIncome) / previous.netIncome * 100).toFixed(1);
            }

            return {
                fiscalYear: latest.date,
                revenue: formatCurrency(latest.revenue),
                revenueRaw: latest.revenue,
                revenueGrowthYoY: revenueGrowth ? `${revenueGrowth}%` : 'N/A',
                grossProfit: formatCurrency(latest.grossProfit),
                grossMargin: (latest.grossProfitRatio * 100).toFixed(1) + '%',
                operatingIncome: formatCurrency(latest.operatingIncome),
                operatingMargin: (latest.operatingIncomeRatio * 100).toFixed(1) + '%',
                netIncome: formatCurrency(latest.netIncome),
                netMargin: (latest.netIncomeRatio * 100).toFixed(1) + '%',
                netIncomeGrowthYoY: netIncomeGrowth ? `${netIncomeGrowth}%` : 'N/A',
                eps: latest.eps?.toFixed(2),
                epsDiluted: latest.epsdiluted?.toFixed(2)
            };
        }
        return null;
    } catch (e) {
        console.error("FMP Income Statement Error", e);
        return null;
    }
}

export async function getStockPeers(ticker: string, apiKey: string): Promise<string[] | null> {
    try {
        const response = await fetch(`${BASE_URL}/stock_peers?symbol=${ticker}&apikey=${apiKey}`);
        const data = await response.json() as { symbol: string; peersList: string[] }[];

        if (Array.isArray(data) && data.length > 0 && data[0].peersList) {
            return data[0].peersList.slice(0, 10); // Limit to 10 peers
        }
        return null;
    } catch (e) {
        console.error("FMP Peers Error", e);
        return null;
    }
}

export async function getSectorPerformance(apiKey: string): Promise<object[] | null> {
    try {
        const response = await fetch(`${BASE_URL}/sector-performance?apikey=${apiKey}`);
        const data = await response.json() as SectorPerformance[];

        if (Array.isArray(data) && data.length > 0) {
            return data.map(s => ({
                sector: s.sector,
                performance: s.changesPercentage
            }));
        }
        return null;
    } catch (e) {
        console.error("FMP Sector Performance Error", e);
        return null;
    }
}

// Helper: Format market cap to readable string
function formatMarketCap(value: number): string {
    if (!value) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

// Helper: Format currency
function formatCurrency(value: number): string {
    if (!value) return 'N/A';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
}

// Helper: Format volume
function formatVolume(value: number): string {
    if (!value) return 'N/A';
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
}

// Legacy function for backward compatibility
export async function getFinancialContext(ticker: string): Promise<string> {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return "Error: No FMP API Key configured.";

    try {
        const response = await fetch(`${BASE_URL}/profile/${ticker}?apikey=${apiKey}`);
        const data = await response.json() as StockProfile[];

        if (Array.isArray(data) && data.length > 0) {
            const profile = data[0];
            return JSON.stringify({
                symbol: profile.symbol,
                price: profile.price,
                company: profile.companyName,
                sector: profile.sector,
                industry: profile.industry,
                description: profile.description?.substring(0, 200) + "..."
            });
        }
        return `No data found for ticker: ${ticker}`;
    } catch (e) {
        console.error("FMP Fetch Error", e);
        return `Failed to fetch data for ${ticker}`;
    }
}

// ============================================================
// NEW: Two-Pass Architecture - AI-Driven Data Requests
// ============================================================

// Data request types that AI can ask for
export type DataRequestType =
    | 'profile'           // Company info, sector, industry
    | 'quote'             // Current stock price, change, P/E
    | 'income_annual'     // Annual income statement
    | 'income_quarterly'  // Quarterly income statement (for YoY comparison)
    | 'key_metrics'       // P/E, EPS, margins, ratios
    | 'historical_price'  // Historical stock prices
    | 'peers'             // Competitor tickers
    | 'sector_performance'; // Industry/sector performance

// Structure for AI data requests
export interface DataRequest {
    ticker: string;
    dataType: DataRequestType;
    reason: string;  // Why the AI needs this data
    claimToVerify?: string;  // The specific claim this data will verify
}

// Execute a single data request
export async function executeDataRequest(request: DataRequest): Promise<{ request: DataRequest; data: unknown; error?: string }> {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return { request, data: null, error: "No FMP API Key configured" };

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

// NEW: Quarterly income statement for more granular YoY comparison
export async function getQuarterlyIncomeStatement(ticker: string, apiKey: string): Promise<object | null> {
    try {
        // Get last 8 quarters (2 years) for proper YoY comparison
        const response = await fetch(`${BASE_URL}/income-statement/${ticker}?period=quarter&limit=8&apikey=${apiKey}`);
        const data = await response.json() as IncomeStatement[];

        if (Array.isArray(data) && data.length > 0) {
            // Return the most recent quarters with YoY comparison
            const quarters = data.slice(0, 4).map((q, idx) => {
                const yoyQuarter = data[idx + 4]; // Same quarter last year

                let revenueYoY = null;
                if (yoyQuarter) {
                    revenueYoY = ((q.revenue - yoyQuarter.revenue) / yoyQuarter.revenue * 100).toFixed(1);
                }

                return {
                    quarter: q.date,
                    revenue: formatCurrency(q.revenue),
                    revenueRaw: q.revenue,
                    revenueYoY: revenueYoY ? `${revenueYoY}%` : 'N/A',
                    netIncome: formatCurrency(q.netIncome),
                    netMargin: (q.netIncomeRatio * 100).toFixed(1) + '%',
                    eps: q.epsdiluted?.toFixed(2)
                };
            });

            return { quarters };
        }
        return null;
    } catch (e) {
        console.error("FMP Quarterly Income Error", e);
        return null;
    }
}

// NEW: Key metrics for ratios and valuation
interface KeyMetricsResponse {
    date: string;
    peRatio: number;
    priceToSalesRatio: number;
    pbRatio: number;
    evToEbitda: number;
    evToSales: number;
    revenuePerShare: number;
    netIncomePerShare: number;
    operatingCashFlowPerShare: number;
    freeCashFlowPerShare: number;
    currentRatio: number;
    debtToEquity: number;
    roe: number;
    roa: number;
}

export async function getKeyMetrics(ticker: string, apiKey: string): Promise<object | null> {
    try {
        const response = await fetch(`${BASE_URL}/key-metrics/${ticker}?limit=1&apikey=${apiKey}`);
        const data = await response.json() as KeyMetricsResponse[];

        if (Array.isArray(data) && data.length > 0) {
            const m = data[0];
            return {
                asOf: m.date,
                valuation: {
                    peRatio: m.peRatio?.toFixed(2) || 'N/A',
                    priceToSales: m.priceToSalesRatio?.toFixed(2) || 'N/A',
                    priceToBook: m.pbRatio?.toFixed(2) || 'N/A',
                    evToEbitda: m.evToEbitda?.toFixed(2) || 'N/A',
                    evToSales: m.evToSales?.toFixed(2) || 'N/A'
                },
                perShare: {
                    revenue: m.revenuePerShare?.toFixed(2) || 'N/A',
                    netIncome: m.netIncomePerShare?.toFixed(2) || 'N/A',
                    freeCashFlow: m.freeCashFlowPerShare?.toFixed(2) || 'N/A'
                },
                ratios: {
                    currentRatio: m.currentRatio?.toFixed(2) || 'N/A',
                    debtToEquity: m.debtToEquity?.toFixed(2) || 'N/A',
                    returnOnEquity: (m.roe ? (m.roe * 100).toFixed(1) + '%' : 'N/A'),
                    returnOnAssets: (m.roa ? (m.roa * 100).toFixed(1) + '%' : 'N/A')
                }
            };
        }
        return null;
    } catch (e) {
        console.error("FMP Key Metrics Error", e);
        return null;
    }
}

// NEW: Historical price for stock price claims
interface HistoricalPrice {
    date: string;
    close: number;
    changePercent: number;
}

export async function getHistoricalPrice(ticker: string, apiKey: string): Promise<object | null> {
    try {
        // Get last 30 trading days
        const response = await fetch(`${BASE_URL}/historical-price-full/${ticker}?timeseries=30&apikey=${apiKey}`);
        const data = await response.json() as { symbol: string; historical: HistoricalPrice[] };

        if (data.historical && data.historical.length > 0) {
            const historical = data.historical;
            const latest = historical[0];
            const weekAgo = historical[4] || historical[historical.length - 1];
            const monthAgo = historical[historical.length - 1];

            return {
                currentPrice: latest.close,
                currentDate: latest.date,
                priceWeekAgo: weekAgo.close,
                weekChange: ((latest.close - weekAgo.close) / weekAgo.close * 100).toFixed(2) + '%',
                priceMonthAgo: monthAgo.close,
                monthChange: ((latest.close - monthAgo.close) / monthAgo.close * 100).toFixed(2) + '%',
                recentPrices: historical.slice(0, 5).map(h => ({
                    date: h.date,
                    price: h.close
                }))
            };
        }
        return null;
    } catch (e) {
        console.error("FMP Historical Price Error", e);
        return null;
    }
}

// List of available data types for the AI prompt
export const AVAILABLE_DATA_TYPES: { type: DataRequestType; description: string }[] = [
    { type: 'profile', description: 'Company info: name, sector, industry, market cap, description' },
    { type: 'quote', description: 'Current stock data: price, change%, P/E, EPS, 52-week range' },
    { type: 'income_annual', description: 'Annual financials: revenue, profit, margins, YoY growth' },
    { type: 'income_quarterly', description: 'Quarterly financials with YoY comparison (last 4 quarters)' },
    { type: 'key_metrics', description: 'Valuation ratios: P/E, P/S, EV/EBITDA, ROE, ROA, debt/equity' },
    { type: 'historical_price', description: 'Price history: current, week ago, month ago, with % changes' },
    { type: 'peers', description: 'List of competitor stock tickers' },
    { type: 'sector_performance', description: 'Performance of all market sectors' }
];

