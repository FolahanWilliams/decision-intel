
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_API_KEY not found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    console.log('🔍 Diagnosing Gemini Embedding API...');

    try {
        // 1. List Models (if supported by SDK directly, otherwise relies on known models)
        // The node SDK doesn't have a direct "listModels" on the instance easily exposed in all versions,
        // but usually it's on the client. Let's try to just test the specific models.

        const modelsToTest = ['models/gemini-embedding-001', 'gemini-embedding-001', 'text-embedding-004'];

        console.log('\n🧪 Testing Model Availability:');

        for (const modelName of modelsToTest) {
            console.log(`\nChecking model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.embedContent("Hello world");
                const vector = result.embedding.values;
                console.log(`✅ SUCCESS: ${modelName} returned vector of length ${vector.length}`);
            } catch (error: any) {
                console.error(`❌ FAILED: ${modelName}`);
                console.error(`   Error: ${error.message?.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error('Test script failed:', error);
    }
}

main();
