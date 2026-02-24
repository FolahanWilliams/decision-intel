
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('Finnhub');
const BASE_URL = 'https://finnhub.io/api/v1';

// Finnhub Response Types
interface FinnhubProfile {
    country: string;
    currency: string;
    exchange: string;
    name: string;
    ticker: string;
    ipo: string;
    marketCapitalization: number;
    shareOutstanding: number;
    logo: string;
    phone: string;
    weburl: string;
    finnhubIndustry: string;
}

interface FinnhubQuote {
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High price of the day
    l: number; // Low price of the day
    o: number; // Open price of the day
    pc: number; // Previous close price
}

interface FinnhubMetric {
    series: Record<string, unknown>;
    metric: {
        "52WeekHigh": number;
        "52WeekLow": number;
        "marketCapitalization": number;
        "peAnnual": number; // P/E TTM?
        "epsTTM": number;
        "roiTTM": number;
        "revenueGrowth3Year": number;
        "revenueGrowthQuarterlyYoy": number;
        "dividendYieldIndicatedAnnual": number;
    };
    metricType: string;
    symbol: string;
}

// Domain Types (matching financial.ts)
export interface StockProfile {
    symbol: string;
    price: number; // Will mock or fetch via quote
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
    marketCap: number; // Metric or Profile
    priceAvg50: number; // Metric
    priceAvg200: number; // Metric
    volume: number; // Not in Basic Quote
    avgVolume: number; // Metric
    pe: number;
    eps: number;
}

// Fetch Helper
async function fetchFinnhub<T>(endpoint: string, apiKey: string, params: Record<string, string> = {}): Promise<T | null> {
    try {
        const query = new URLSearchParams({ token: apiKey, ...params }).toString();
        const res = await fetch(`${BASE_URL}${endpoint}?${query}`);

        if (!res.ok) {
            log.error(`API Error ${res.status}: ${res.statusText}`);
            return null;
        }

        return await res.json() as T;
    } catch (e) {
        log.error('Fetch Error:', e);
        return null;
    }
}

// Public Methods
export async function getFinnhubProfile(ticker: string, apiKey: string): Promise<StockProfile | null> {
    const data = await fetchFinnhub<FinnhubProfile>('/stock/profile2', apiKey, { symbol: ticker });
    if (!data || !data.ticker) return null;

    return {
        symbol: data.ticker,
        price: 0, // Profile2 doesn't have price, handle upstream
        companyName: data.name,
        description: `Industry: ${data.finnhubIndustry}, Exchange: ${data.exchange}, IPO Date: ${data.ipo}, Phone: ${data.phone}, Website: ${data.weburl}`,
        sector: data.finnhubIndustry, // Finnhub uses industry broadly
        industry: data.finnhubIndustry,
        mktCap: data.marketCapitalization * 1000000, // Finnhub is in millions
        isEtf: false // Assumption
    };
}

export async function getFinnhubQuote(ticker: string, apiKey: string): Promise<StockQuote | null> {
    const data = await fetchFinnhub<FinnhubQuote>('/quote', apiKey, { symbol: ticker });
    if (!data || data.c === 0) return null; // c=0 usually means bad symbol

    return {
        symbol: ticker,
        price: data.c,
        changesPercentage: data.dp,
        change: data.d,
        dayLow: data.l,
        dayHigh: data.h,
        yearHigh: 0, // Basic quote lacks these, needs metric
        yearLow: 0,
        marketCap: 0,
        priceAvg50: 0,
        priceAvg200: 0,
        volume: 0,
        avgVolume: 0,
        pe: 0,
        eps: 0
    };
}

export async function getFinnhubMetrics(ticker: string, apiKey: string): Promise<FinnhubMetric['metric'] | null> {
    const data = await fetchFinnhub<FinnhubMetric>('/stock/metric', apiKey, { symbol: ticker, metric: 'all' });
    if (!data || !data.metric) return null;
    return data.metric;
}

export async function getFinnhubPeers(ticker: string, apiKey: string): Promise<string[] | null> {
    const data = await fetchFinnhub<string[]>('/stock/peers', apiKey, { symbol: ticker });
    if (!Array.isArray(data)) return null;
    return data;
}
