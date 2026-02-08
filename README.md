# Decision Intelligence Platform

[![CI/CD](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/FolahanWilliams/decision-intel/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)

A sophisticated AI-powered document auditing system designed to help executives, investors, and boards minimize "Decision Noise" and cognitive bias.

## 🚀 Key Features

### 1. **Bias Detection & Education**
- **Cognitive Bias Scanning**: Detects 15+ psychological biases (e.g., Confirmation Bias, Sunk Cost Fallacy).
- **Scientific Insights**: Fetches real-world psychological studies (e.g., HBR, Kaggle) to explain *why* a bias is occurring.
- **"Coaching Mode"**: Moves beyond criticism to provide constructive, scientifically-backed advice.

### 2. **Noise Benchmarking (Market Reality Check)**
- **Internal Consistency**: Checks if the document contradicts itself.
- **External Benchmarking**: Uses Google Search Grounding to compare internal claims (e.g., "15% Growth") against live market data (e.g., "Industry Avg 12%").
- **Variance Visualization**: Side-by-side table showing "Document vs. Market" deltas.

### 3. **Red Team (Cognitive Diversity)**
- **Devil's Advocate**: Simulates an opposing viewpoint to challenge core assumptions.
- **Blind Spot Detection**: Identifies risks that the authors may have missed due to "Groupthink" or "Tunnel Vision".
- **Verified Counter-Arguments**: Every counter-point is backed by a live URL source.

### 4. **Financial Fact-Checking**
- **Deep Integration**: Cross-references claims against financial APIs (Finnhub) and Google Search.
- **Truth Score**: Assigns a "Veracity Score" (0-100%) based on data alignment.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **AI**: Gemini 2.0 Flash (with Google Search Grounding)
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: Clerk (Enterprise-ready)
- **Styling**: TailwindCSS + Shadcn/UI (Dark Mode Optimized)

## 🏁 Getting Started

1. **Clone & Install**
   ```bash
   git clone [repo]
   npm install
   ```

2. **Environment Setup**
   Create `.env` with:
   ```bash
   DATABASE_URL="..."
   GOOGLE_API_KEY="..." # Specific to Gemini 2.0
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="..."
   CLERK_SECRET_KEY="..."
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## 📊 Deployment
The platform is "Vercel-Ready". 
- **Stateless API**: Optimized for serverless functions (verified in Audit Phase 8).
- **Secure**: Strict API key validation and input sanitization.

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

### Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
   - Runs on every push and pull request
   - Performs code quality checks (TypeScript, ESLint, Prettier)
   - Security audits and dependency checks
   - Automated testing
   - Production deployments to Vercel
   - Preview deployments for pull requests

2. **Database Migrations** (`.github/workflows/database-migration.yml`)
   - Automatically runs on schema changes
   - Applies migrations to production database
   - Runs only on main branch

3. **Dependency Updates** (`.github/workflows/dependency-check.yml`)
   - Weekly check for outdated dependencies
   - Creates GitHub issues for manual review

4. **Release Management** (`.github/workflows/release.yml`)
   - Creates GitHub releases on version tags
   - Generates changelogs automatically

### Required Secrets

Configure these in your GitHub repository settings:

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `DATABASE_URL` - Production database connection string
- `DIRECT_URL` - Direct database connection (for migrations)
- `SLACK_WEBHOOK_URL` - (Optional) Slack notifications

### Branch Protection

The main branch is protected with:
- Required status checks (TypeScript compilation, tests)
- Required reviews before merging
- No direct pushes to main

## 🔮 Future Roadmap (Backlog)
- **Multi-Speaker Diarization**: Analyzing meeting transcripts for speaker-specific biases.
- **Enterprise SSO**: SAML integration for large orgs.
