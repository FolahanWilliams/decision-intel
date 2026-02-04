#!/bin/bash
# ==============================================================================
# Jules Healing Automation - Production Ready
# ==============================================================================
# Usage: ./scripts/jules-healing.sh "<Error Log>"
#
# Features:
#   - PII Sanitization: Strips sensitive content before sending to AI
#   - Local Audit First: Runs gemini-audit.sh to catch simple issues
#   - Context Injection: Uses AGENTS.md and GEMINI.md for architecture awareness
#   - Task Specification: Generates detailed fix instructions for Jules
# ==============================================================================

set -euo pipefail

ERROR_LOG="$1"

if [ -z "${ERROR_LOG:-}" ]; then
  echo "❌ Usage: ./scripts/jules-healing.sh \"<Error Log>\""
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ==============================================================================
# Step 0: Run Local Gemini Audit First
# ==============================================================================
# Try to identify simple issues locally before dispatching Jules
# Critical issues that can be fixed locally will halt the pipeline.
# ==============================================================================

echo "🔬 Running local Gemini audit first..."

if [ -f "$SCRIPT_DIR/gemini-audit.sh" ]; then
    # Run the audit on staged changes or recent files
    AUDIT_RESULT=$("$SCRIPT_DIR/gemini-audit.sh" 2>&1 || true)
    
    # Check for critical issues that should halt the pipeline
    if echo "$AUDIT_RESULT" | grep -qE "(Privacy Compliance.*FAIL|State Consistency.*FAIL)"; then
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║  🛑 CRITICAL ISSUE DETECTED - Halting Jules Dispatch         ║"
        echo "╠══════════════════════════════════════════════════════════════╣"
        echo "║  The following issue(s) can be fixed locally:               ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""
        echo "$AUDIT_RESULT" | grep -E "FAIL:" | head -3
        echo ""
        echo "💡 Fix these issues manually, then re-run the healing script."
        echo "   Or bypass with: FORCE_JULES=1 ./scripts/jules-healing.sh \"...\""
        
        # Allow bypass with FORCE_JULES=1
        if [ "${FORCE_JULES:-0}" != "1" ]; then
            exit 1
        else
            echo ""
            echo "⚠️  FORCE_JULES=1 detected. Proceeding despite critical issues..."
        fi
    elif echo "$AUDIT_RESULT" | grep -q "FAIL:"; then
        echo ""
        echo "💡 Local audit found non-critical issues:"
        echo "$AUDIT_RESULT" | grep "FAIL:" | head -3
        echo ""
        echo "📝 Including findings in Jules prompt for context..."
        LOCAL_ISSUE=$(echo "$AUDIT_RESULT" | grep "FAIL:" | head -1)
    else
        echo "   ✓ Local audit passed, proceeding with error analysis..."
        LOCAL_ISSUE=""
    fi
else
    echo "   ⚠ gemini-audit.sh not found, skipping local audit"
    LOCAL_ISSUE=""
fi

echo ""

# ==============================================================================
# Step 1: PII Sanitization
# ==============================================================================
# Remove:
#   - Content between <input_text> tags
#   - GDPR anonymized tokens like [PERSON_1], [COMPANY_2]
#   - Email addresses
#   - Long text excerpts (anything > 200 chars in quotes)
# ==============================================================================

sanitize_log() {
    local input="$1"
    echo "$input" | \
        sed 's/<input_text>.*<\/input_text>/[CONTENT_REDACTED]/g' | \
        sed 's/\[PERSON_[0-9]*\]/[PII]/g' | \
        sed 's/\[COMPANY_[0-9]*\]/[ORG]/g' | \
        sed 's/\[EMAIL_[0-9]*\]/[EMAIL]/g' | \
        sed 's/"[^"]\{200,\}"/[LONG_TEXT_REDACTED]/g' | \
        sed 's/[a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]*\.[a-zA-Z]\{2,\}/[EMAIL_REDACTED]/g' | \
        head -c 2000  # Limit total size
}

SAFE_LOG=$(sanitize_log "$ERROR_LOG")

echo "🔐 Log sanitized (${#SAFE_LOG} chars)"

# ==============================================================================
# Step 2: Load Architecture Context
# ==============================================================================

AGENTS_CONTEXT=""
GEMINI_CONTEXT=""

if [ -f "$PROJECT_ROOT/AGENTS.md" ]; then
    # Extract key sections only (first 100 lines to avoid token limits)
    AGENTS_CONTEXT=$(head -n 100 "$PROJECT_ROOT/AGENTS.md")
    echo "📚 Loaded AGENTS.md context"
fi

if [ -f "$PROJECT_ROOT/GEMINI.md" ]; then
    GEMINI_CONTEXT=$(cat "$PROJECT_ROOT/GEMINI.md")
    echo "📚 Loaded GEMINI.md context"
fi

# ==============================================================================
# Step 3: High-Reasoning Diagnosis with Gemini
# ==============================================================================

# Include local audit findings if any
ADDITIONAL_CONTEXT=""
if [ -n "$LOCAL_ISSUE" ]; then
    ADDITIONAL_CONTEXT="
=== LOCAL AUDIT FINDINGS ===
$LOCAL_ISSUE
"
fi

PROMPT="You are a Senior AI Operations Engineer debugging a LangGraph multi-agent system.

=== ARCHITECTURE CONTEXT ===
$AGENTS_CONTEXT

=== DATABASE SCHEMA ===
$GEMINI_CONTEXT
$ADDITIONAL_CONTEXT
=== ERROR LOG (SANITIZED) ===
$SAFE_LOG

=== TASK ===
Analyze the error within our multi-agent architecture context.
Identify:
1. The failing LangGraph node (e.g., biasDetectiveNode, noiseJudgeNode)
2. The specific file path responsible
3. The root cause (JSON parse failure, API timeout, schema mismatch, etc.)

=== OUTPUT FORMAT ===
Generate a single Task Specification for Jules in this exact format:
FIX: [Specific Issue Description] in [File Path] affecting [Agent/Node Name]. [Suggested Solution in 1 sentence.]

Example: FIX: JSON parse failure on malformed LLM response in src/lib/agents/nodes.ts affecting biasDetectiveNode. Add fallback extraction using regex for incomplete JSON."

echo "🔍 Analyzing error with Gemini..."

SPEC=$(npx gemini prompt "$PROMPT" 2>/dev/null || echo "")

if [ -z "$SPEC" ]; then
    echo "❌ Failed to get diagnosis from Gemini CLI."
    echo "   Falling back to generic instruction..."
    SPEC="FIX: Production API error in src/lib/agents/nodes.ts. Review error handling and JSON parsing resilience."
fi

# Clean up the spec (remove markdown formatting if present)
SPEC=$(echo "$SPEC" | grep -E "^FIX:" | head -1 || echo "$SPEC" | head -1)

echo ""
echo "💡 Diagnosis:"
echo "   $SPEC"
echo ""
echo "🚑 Dispatching to Jules..."

# ==============================================================================
# Step 4: Trigger Jules
# ==============================================================================

npm run jules -- "$SPEC"
