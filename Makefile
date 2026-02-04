# Makefile for Agentic Automation

.PHONY: setup automate audit

# Setup the environment and tools
setup:
	@echo "Initializing Gemini Command Center..."
	@./scripts/setup-gemini-tools.sh

# Run the full automated workflow
automate:
	@echo "Starting Autonomous Implementation Cycle..."
	@# 1. Setup Conductor context (Non-interactive)
	@npx gemini prompt "/conductor:setup --non-interactive"
	@# 2. Run Security Audit
	@echo "Running Security Scan..."
	@npm run jules:audit

# Manual Audit Alias
audit:
	npm run jules:audit
