/**
 * Jules Automation Script
 * Usage: npm run jules -- "Your instruction here"
 * Example: npm run jules -- "Refactor the risk scoring logic to be more strict"
 */

const https = require('https');
require('dotenv').config();

const JULES_API_KEY = process.env.JULES_API_KEY;
const JULES_API_BASE = 'https://jules.googleapis.com/v1alpha';

if (!JULES_API_KEY) {
    console.error("❌ Error: JULES_API_KEY is missing in .env");
    process.exit(1);
}

const instruction = process.argv[2];
if (!instruction) {
    console.error("❌ Usage: npm run jules -- \"<Your Instruction>\"");
    console.log("Example: npm run jules -- \"Fix all lint errors in src/app\"");
    process.exit(1);
}

// Minimal Fetch Wrapper for Node
async function fetchAPI(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            method,
            headers: {
                'x-goog-api-key': JULES_API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(`${JULES_API_BASE}${endpoint}`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (res.statusCode >= 400) reject(json.error || json);
                    else resolve(json);
                } catch (e) {
                    reject(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log("🤖 Asking Jules to:", instruction);

        // 1. Get Source (Current Repo)
        // We assume the first connected source matches this repo environment. 
        // In a real setup, we might filter by the git remote origin.
        process.stdout.write("📡 Locating repository... ");
        const sources = await fetchAPI('/sources');
        const source = sources.sources?.find(s =>
            // Simple heuristic: Try to match the folder name or use the first one
            s.githubRepo.repo === 'decision-intel' ||
            s.name.includes('decision-intel')
        ) || sources.sources?.[0];

        if (!source) {
            console.error("\n❌ No connected repository found. Install the Jules GitHub App.");
            process.exit(1);
        }
        console.log(`✅ Found: ${source.githubRepo.owner}/${source.githubRepo.repo}`);

        // 2. Create Session
        process.stdout.write("🚀 Starting automation session... ");
        const session = await fetchAPI('/sessions', 'POST', {
            prompt: instruction,
            sourceContext: {
                source: source.name,
                githubRepoContext: { startingBranch: 'main' } // Default to main
            },
            automationMode: "AUTO_CREATE_PR", // The magic flag
            title: `Jules: ${instruction.slice(0, 40)}...`
        });
        console.log(`✅ Session ID: ${session.id}`);

        // 3. Poll for PR
        console.log("\n⏳ Jules is thinking and coding... (This may take a minute)");
        let prUrl = null;
        let attempts = 0;

        const loader = ['|', '/', '-', '\\'];

        while (!prUrl && attempts < 60) { // Poll for ~2 minutes
            await new Promise(r => setTimeout(r, 2000));
            process.stdout.write(`\r${loader[attempts % 4]} Checking status...`);

            const updated = await fetchAPI(`/sessions/${session.id}`);

            // Check outputs for PR
            if (updated.outputs && updated.outputs.length > 0) {
                const prOutput = updated.outputs.find(o => o.pullRequest);
                if (prOutput) {
                    prUrl = prOutput.pullRequest.url;
                }
            }
            attempts++;
        }

        if (prUrl) {
            console.log(`\n\n🎉 SUCCESS! Jules created a Pull Request:\n👉 ${prUrl}`);
        } else {
            console.log(`\n\n⚠️  Jules started the work, but didn't open a PR yet.`);
            console.log(`Check progress manually: https://jules.google.com/sessions/${session.id}`);
        }

    } catch (error) {
        console.error("\n❌ Automation Failed:", error);
    }
}

run();
