#!/bin/bash

# Usage: ./scripts/jules-healing.sh "Error log content..."

ERROR_LOG="$1"

if [ -z "$ERROR_LOG" ]; then
  echo "Usage: ./scripts/jules-healing.sh \"<Error Log>\""
  exit 1
fi

echo "🔍 Analyzing error with Gemini CLI..."

# Use Gemini to summarize the error and locate the file
# We assume 'gemini' CLI is available (via npm install -g or alias)
# We use npx to ensure we use the local version if global isn't there
SUMMARY=$(npx gemini prompt "Analyze this error log and provide a one-line summary describing the root cause and the file responsible. Format: 'Fix [Issue] in [File]'. Error Log: $ERROR_LOG")

if [ -z "$SUMMARY" ]; then
  echo "❌ Failed to analyze error with Gemini."
  exit 1
fi

echo "💡 Diagnosis: $SUMMARY"
echo "🚑 Dispatching Jules..."

# Trigger Jules
npm run jules -- "$SUMMARY"
