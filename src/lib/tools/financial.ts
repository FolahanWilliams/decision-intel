// Helper to fetch data from Financial Modeling Prep
const BASE_URL = 'https://financialmodelingprep.com/api/v3';

interface StockProfile {
    symbol: string;
    price: number;
    companyName: string;
    description: string;
    sector: string;
    industry: string;
    isEtf: boolean;
}

export async function getFinancialContext(ticker: string): Promise<string> {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) return "Error: No FMP API Key configured.";

    try {
        // Fetch Profile (includes price, sector, description)
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
                description: profile.description.substring(0, 200) + "..." // Truncate for token efficiency
            });
        }
        return `No data found for ticker: ${ticker}`;
    } catch (e) {
        console.error("FMP Fetch Error", e);
        return `Failed to fetch data for ${ticker}`;
    }
}
