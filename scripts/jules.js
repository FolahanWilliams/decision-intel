/**
 * Jules Automation Script - Production Ready
 * ============================================
 * Usage: npm run jules -- "Your instruction here"
 * Example: npm run jules -- "Refactor the risk scoring logic to be more strict"
 * 
 * Features:
 *   - Dynamic repo matching from package.json
 *   - Autonomous mode with requirePlanApproval: false
 *   - Graceful timeout handling with session links
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const JULES_API_KEY = process.env.JULES_API_KEY;
const JULES_API_BASE = 'https://jules.googleapis.com/v1alpha';

// ==============================================================================
// Configuration
// ==============================================================================

const CONFIG = {
    pollIntervalMs: 2000,
    maxPollAttempts: 60, // 2 minutes
    requirePlanApproval: false, // Autonomous mode for healing
    defaultBranch: 'main'
};

// ==============================================================================
// Validation
// ==============================================================================

if (!JULES_API_KEY) {
    console.error("❌ Error: JULES_API_KEY is missing in .env");
    process.exit(1);
}

const instruction = process.argv[2];
if (!instruction) {
    console.error('❌ Usage: npm run jules -- "<Your Instruction>"');
    console.log('Example: npm run jules -- "Fix all lint errors in src/app"');
    process.exit(1);
}

// ==============================================================================
// Dynamic Repo Name from package.json
// ==============================================================================

function getRepoName() {
    try {
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return packageJson.name || 'unknown-project';
    } catch {
        console.warn('⚠️  Could not read package.json, using directory name');
        return path.basename(process.cwd());
    }
}

const REPO_NAME = getRepoName();

// ==============================================================================
// API Client
// ==============================================================================

async function fetchAPI(endpoint, method = 'GET', body = null, retries = 2) {
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
                    if (res.statusCode >= 400) {
                        reject(json.error || json);
                    } else {
                        resolve(json);
                    }
                } catch {
                    reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
                }
            });
        });

        req.on('error', async (err) => {
            if (retries > 0) {
                console.warn(`⚠️  Request failed, retrying... (${retries} left)`);
                await new Promise(r => setTimeout(r, 1000));
                try {
                    const result = await fetchAPI(endpoint, method, body, retries - 1);
                    resolve(result);
                } catch (retryErr) {
                    reject(retryErr);
                }
            } else {
                reject(err);
            }
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ==============================================================================
// Main Execution
// ==============================================================================

async function run() {
    const startTime = Date.now();

    try {
        console.log("🤖 Asking Jules to:", instruction.slice(0, 100) + (instruction.length > 100 ? '...' : ''));
        console.log(`📦 Project: ${REPO_NAME}`);

        // 1. Get Source (Current Repo)
        process.stdout.write("📡 Locating repository... ");
        const sources = await fetchAPI('/sources');

        const source = sources.sources?.find(s =>
            // Match by package.json name first
            s.githubRepo?.repo === REPO_NAME ||
            s.name?.includes(REPO_NAME) ||
            // Fallback: try directory-style matching
            s.githubRepo?.repo === path.basename(process.cwd())
        ) || sources.sources?.[0];

        if (!source) {
            console.error("\n❌ No connected repository found. Install the Jules GitHub App.");
            console.log("   Visit: https://github.com/apps/jules-by-google");
            process.exit(1);
        }
        console.log(`✅ Found: ${source.githubRepo.owner}/${source.githubRepo.repo}`);

        // 2. Create Session
        process.stdout.write("🚀 Starting automation session... ");
        const session = await fetchAPI('/sessions', 'POST', {
            prompt: instruction,
            sourceContext: {
                source: source.name,
                githubRepoContext: { startingBranch: CONFIG.defaultBranch }
            },
            automationMode: "AUTO_CREATE_PR",
            requirePlanApproval: CONFIG.requirePlanApproval,
            title: `Jules: ${instruction.slice(0, 40)}...`
        });

        const sessionId = session.id || session.name?.split('/').pop();
        console.log(`✅ Session ID: ${sessionId}`);

        // 3. Poll for PR
        console.log("\n⏳ Jules is thinking and coding... (This may take a minute)");
        let prUrl = null;
        let attempts = 0;
        let lastState = '';

        const loader = ['|', '/', '-', '\\'];

        while (!prUrl && attempts < CONFIG.maxPollAttempts) {
            await new Promise(r => setTimeout(r, CONFIG.pollIntervalMs));

            const elapsed = Math.round((Date.now() - startTime) / 1000);
            process.stdout.write(`\r${loader[attempts % 4]} Checking status... (${elapsed}s)`);

            try {
                const updated = await fetchAPI(`/sessions/${sessionId}`);

                // Track state changes for debugging
                if (updated.state && updated.state !== lastState) {
                    lastState = updated.state;
                    process.stdout.write(`\r📊 State: ${lastState}                    \n`);
                }

                // Check outputs for PR
                if (updated.outputs && updated.outputs.length > 0) {
                    const prOutput = updated.outputs.find(o => o.pullRequest);
                    if (prOutput) {
                        prUrl = prOutput.pullRequest.url;
                    }
                }
            } catch (pollError) {
                // Don't fail on poll errors, just continue
                process.stdout.write(`\r⚠️  Poll error, retrying...           `);
            }

            attempts++;
        }

        // 4. Report Results
        console.log(''); // New line after loader

        if (prUrl) {
            console.log(`\n🎉 SUCCESS! Jules created a Pull Request:`);
            console.log(`👉 ${prUrl}`);
        } else {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n⚠️  Jules didn't create a PR within ${elapsed}s`);
            console.log(`📋 Check progress manually:`);
            console.log(`   https://jules.google.com/sessions/${sessionId}`);
            console.log(`\n💡 Tip: Jules may still be working. Check the link above for status.`);
        }

    } catch (error) {
        console.error("\n❌ Automation Failed:");
        if (error instanceof Error) {
            console.error(`   ${error.message}`);
        } else {
            console.error(`   ${JSON.stringify(error, null, 2)}`);
        }
        process.exit(1);
    }
}

run();
