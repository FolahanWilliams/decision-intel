#!/bin/bash

# Usage: ./scripts/debug-to-jules.sh <log_file>

LOG_FILE="$1"

if [ -z "$LOG_FILE" ]; then
  echo "Usage: ./scripts/debug-to-jules.sh <log_file>"
  exit 1
fi

echo "🔍 Filtering logs with Gemini..."

# 1. Use Gemini CLI to filter relevant errors
# We pipe the log file content to the prompt
FILTERED_ANALYSIS=$(npx gemini prompt "Read the following log data. Identifiy any 'JSON Parse Errors' or 'Timeout' errors. For the most critical one, output a summary in the format: 'Found [ErrorType] in [Component]'. Log Data: $(cat $LOG_FILE | tail -n 100)")

if [ -z "$FILTERED_ANALYSIS" ]; then
  echo "✅ No critical errors found in the last 100 lines."
  exit 0
fi

echo "⚠️  Detected: $FILTERED_ANALYSIS"
echo "🤝 Handing off to Jules for structural optimization..."

# 2. Handoff to Jules
# We modify the prompt as requested: "identify the document structure causing this timeout..."
INSTRUCTION="Based on the finding '$FILTERED_ANALYSIS', identify the document structure causing this in src/lib/agents/graph.ts and optimize it."

echo "🚀 Triggering: npm run jules -- \"$INSTRUCTION\""
npm run jules -- "$INSTRUCTION"
