#!/bin/bash
# ==============================================================================
# Gemini AI Audit - Local Code Quality Checker
# ==============================================================================
# Usage: ./scripts/gemini-audit.sh [file-or-staged]
#
# Examples:
#   ./scripts/gemini-audit.sh                    # Audit staged changes
#   ./scripts/gemini-audit.sh src/lib/agents/nodes.ts  # Audit specific file
#
# Features:
#   - Context Injection: Uses AGENTS.md and Prisma schema
#   - State Consistency: Validates AnalysisState schema compatibility
#   - Privacy Compliance: Checks for PII exposure in logging
#   - Error Handling: Validates parseJSON usage and fallbacks
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Configuration
# ==============================================================================

TARGET="${1:-staged}"
AUDIT_RESULTS=""
ISSUES_FOUND=0

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           🔍 Gemini AI Contextual Audit                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================================================
# Step 1: Gather Code to Audit
# ==============================================================================

get_code_to_audit() {
    if [ "$TARGET" = "staged" ]; then
        echo -e "${YELLOW}📂 Analyzing staged changes...${NC}"
        git diff --cached --name-only 2>/dev/null | head -10
        CODE=$(git diff --cached 2>/dev/null | head -500)
        if [ -z "$CODE" ]; then
            echo -e "${YELLOW}⚠️  No staged changes found. Checking last commit...${NC}"
            CODE=$(git diff HEAD~1 --name-only 2>/dev/null | head -10)
            CODE=$(git diff HEAD~1 2>/dev/null | head -500)
        fi
    elif [ -f "$TARGET" ]; then
        echo -e "${YELLOW}📄 Analyzing file: $TARGET${NC}"
        CODE=$(cat "$TARGET" | head -300)
    else
        echo -e "${RED}❌ Target not found: $TARGET${NC}"
        exit 1
    fi
    
    if [ -z "$CODE" ]; then
        echo -e "${GREEN}✅ No code changes to audit.${NC}"
        exit 0
    fi
    
    echo "$CODE"
}

CODE_TO_AUDIT=$(get_code_to_audit)
echo ""

# ==============================================================================
# Step 2: Load Context Files
# ==============================================================================

echo -e "${BLUE}📚 Loading architecture context...${NC}"

AGENTS_CONTEXT=""
SCHEMA_CONTEXT=""

if [ -f "$PROJECT_ROOT/AGENTS.md" ]; then
    # Extract key sections (State Management and Agent Definitions)
    AGENTS_CONTEXT=$(sed -n '/## 2\. State Management/,/## 4\./p' "$PROJECT_ROOT/AGENTS.md" | head -60)
    echo -e "   ✓ AGENTS.md (State Management section)"
fi

if [ -f "$PROJECT_ROOT/prisma/schema.prisma" ]; then
    SCHEMA_CONTEXT=$(cat "$PROJECT_ROOT/prisma/schema.prisma")
    echo -e "   ✓ prisma/schema.prisma"
fi

echo ""

# ==============================================================================
# Step 3: Run Contextual Audit with Gemini
# ==============================================================================

# When the Gemini CLI is unavailable, the audit cannot run — but the
# script historically returned 0 and printed "All audits passed!" which
# created a SILENT SAFETY-GATE BYPASS. Locked 2026-05-25 (security audit):
# any contributor or CI runner without GOOGLE_API_KEY shipped with the
# architectural audit silently disabled. The fix below makes
# tool-unavailable a hard failure UNLESS the operator opts in via
# SKIP_GEMINI_AUDIT=1 (escape hatch for environments where Gemini is
# legitimately unavailable, e.g. air-gapped CI).
run_audit() {
    local audit_type="$1"
    local prompt="$2"

    echo -e "${YELLOW}🔍 Running: $audit_type${NC}"

    RESULT=$(npx gemini prompt "$prompt" 2>/dev/null || echo "AUDIT_FAILED")

    if [[ "$RESULT" == *"PASS"* ]] || [[ "$RESULT" == *"pass"* ]] || [[ "$RESULT" == *"No issues"* ]]; then
        echo -e "   ${GREEN}✓ $audit_type: PASS${NC}"
        return 0
    elif [[ "$RESULT" == "AUDIT_FAILED" ]]; then
        if [[ "${SKIP_GEMINI_AUDIT:-0}" == "1" ]]; then
            echo -e "   ${YELLOW}⚠ $audit_type: Gemini CLI unavailable (skipped via SKIP_GEMINI_AUDIT=1)${NC}"
            return 0
        fi
        echo -e "   ${RED}✗ $audit_type: Gemini CLI unavailable — gate cannot run${NC}"
        echo -e "   ${RED}   To run the gate: install gemini-cli + set GOOGLE_API_KEY${NC}"
        echo -e "   ${RED}   To skip explicitly: SKIP_GEMINI_AUDIT=1 git commit ...${NC}"
        AUDIT_RESULTS="${AUDIT_RESULTS}\n[${audit_type}] Gemini CLI unavailable"
        ((ISSUES_FOUND++))
        return 1
    else
        echo -e "   ${RED}✗ $audit_type: ISSUES FOUND${NC}"
        echo -e "   ${RED}   $RESULT${NC}"
        AUDIT_RESULTS="${AUDIT_RESULTS}\n[${audit_type}] ${RESULT}"
        ((ISSUES_FOUND++))
        return 1
    fi
}

# ------------------------------------------------------------------------------
# Audit 1: State Consistency
# ------------------------------------------------------------------------------

STATE_PROMPT="You are a LangGraph state validator.

=== LANGGRAPH STATE SCHEMA ===
$AGENTS_CONTEXT

=== PRISMA SCHEMA ===
$SCHEMA_CONTEXT

=== CODE CHANGE ===
$CODE_TO_AUDIT

=== TASK ===
Check if the code change breaks the AnalysisState schema or introduces incompatible types.
Look for:
1. Missing required state fields in node returns
2. Type mismatches with Prisma schema (e.g., String vs Json)
3. Breaking the Append reducer by returning non-array values

Respond with ONLY:
- 'PASS' if no issues found
- 'FAIL: [One-line description of issue]' if problems found"

run_audit "State Consistency" "$STATE_PROMPT" || true

# ------------------------------------------------------------------------------
# Audit 2: Privacy Compliance
# ------------------------------------------------------------------------------

PRIVACY_PROMPT="You are a GDPR/Privacy compliance auditor.

=== CODE CHANGE ===
$CODE_TO_AUDIT

=== TASK ===
Check if any new logging or error handling inadvertently exposes PII.
Look for:
1. console.log/console.error that includes 'originalContent', 'content', or 'text' fields
2. Error messages that include user document excerpts
3. Missing redaction of [PERSON_X] or [COMPANY_X] tokens before logging

Respond with ONLY:
- 'PASS' if no privacy issues found
- 'FAIL: [One-line description of exposure risk]' if problems found"

run_audit "Privacy Compliance" "$PRIVACY_PROMPT" || true

# ------------------------------------------------------------------------------
# Audit 3: Error Handling
# ------------------------------------------------------------------------------

ERROR_PROMPT="You are a resilience engineer for AI/LLM systems.

=== CODE CHANGE ===
$CODE_TO_AUDIT

=== TASK ===
Check if new code that calls LLMs includes proper error handling.
Look for:
1. Direct JSON.parse() calls without try/catch (should use parseJSON helper)
2. Missing fallback values for undefined LLM responses
3. Unhandled promise rejections in async LLM calls

Respond with ONLY:
- 'PASS' if error handling is adequate
- 'FAIL: [One-line description of missing error handling]' if problems found"

run_audit "Error Handling" "$ERROR_PROMPT" || true

# ==============================================================================
# Step 4: Report Results
# ==============================================================================

echo ""
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ All audits passed! Code is ready for commit.${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s):${NC}"
    echo -e "$AUDIT_RESULTS"
    echo ""
    echo -e "${YELLOW}💡 Tip: Fix these issues locally before committing, or let Jules handle them:${NC}"
    echo -e "   npm run jules -- \"Fix: \$(echo -e \"$AUDIT_RESULTS\" | head -1)\""
    exit 1
fi
