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
