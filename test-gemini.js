// Test script to verify Gemini API connectivity
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testGemini() {
    console.log("=== Gemini API Diagnostic Test ===\n");

    // Check if API key is set
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("❌ GOOGLE_API_KEY is NOT set in .env file!");
        console.log("Please add: GOOGLE_API_KEY=your_key_here to your .env file");
        process.exit(1);
    }
    console.log("✅ GOOGLE_API_KEY is set (length:", apiKey.length, "chars)");

    // Check if key looks valid (starts with expected prefix)
    if (!apiKey.startsWith("AI")) {
        console.warn("⚠️  Warning: API key doesn't start with 'AI' - might be invalid format");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-pro-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        console.log("\n📡 Testing API connection...");

        const result = await model.generateContent([
            "Return valid JSON only: { \"test\": \"success\", \"timestamp\": \"now\" }"
        ]);

        const response = result.response.text();
        console.log("\n📥 Raw API Response:");
        console.log(response);
        console.log("\n📥 Response length:", response.length, "bytes");

        if (!response || response.length === 0) {
            console.error("\n❌ PROBLEM: Gemini returned an EMPTY response!");
            console.log("This is the cause of your 'Unexpected end of JSON input' error.");
            console.log("\nPossible causes:");
            console.log("1. API key is invalid or expired");
            console.log("2. API quota exceeded");
            console.log("3. The model is rate-limited");
            process.exit(1);
        }

        // Try to parse it
        try {
            const parsed = JSON.parse(response);
            console.log("\n✅ JSON parsed successfully:", parsed);
            console.log("\n🎉 Gemini API is working correctly!");
        } catch (parseError) {
            console.error("\n⚠️  Response received but not valid JSON:");
            console.log(response);
        }

    } catch (error) {
        console.error("\n❌ Gemini API Error:", error.message);
        if (error.message.includes("API_KEY")) {
            console.log("\n💡 Your API key appears to be invalid. Get a new one from:");
            console.log("   https://aistudio.google.com/app/apikey");
        }
        if (error.message.includes("quota")) {
            console.log("\n💡 You may have exceeded your API quota.");
        }
        process.exit(1);
    }
}

testGemini();
