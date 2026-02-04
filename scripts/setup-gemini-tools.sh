#!/bin/bash

# Setup Gemini CLI Tools & Extensions
echo "🛠️  Setting up Gemini Command Center..."

# Ensure gemini CLI is installed (locally or globally)
if ! command -v gemini &> /dev/null; then
    echo "📦 Installing Gemini CLI..."
    npm install -g @google/gemini-cli
fi

# Install Conductor (Orchestration)
echo "conductor: Installing..."
gemini extensions install https://github.com/gemini-cli-extensions/conductor --auto-update

# Install Security (Guardrails)
echo "security: Installing..."
gemini extensions install https://github.com/gemini-cli-extensions/security

# Install Code Review (QA)
echo "code-review: Installing..."
gemini extensions install https://github.com/gemini-cli-extensions/code-review

# Install Jules (Autonomous Coding)
echo "jules: Installing..."
gemini extensions install https://github.com/gemini-cli-extensions/jules

echo "✅ Agentic Command Center Ready."
