// List available Gemini models
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    console.log("Listing available models for your API key...\n");

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        console.log("Available models:\n");
        data.models?.forEach(model => {
            if (model.supportedGenerationMethods?.includes("generateContent")) {
                console.log(`  ✅ ${model.name.replace("models/", "")} - ${model.displayName}`);
            }
        });

        console.log("\n\nRecommended model for JSON generation:");
        const jsonModels = data.models?.filter(m =>
            m.supportedGenerationMethods?.includes("generateContent") &&
            (m.name.includes("gemini") || m.name.includes("flash"))
        );
        if (jsonModels?.length > 0) {
            console.log(`  → ${jsonModels[0].name.replace("models/", "")}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

listModels();
