# Setup Gemini CLI Tools & Extensions
echo "🛠️  Setting up Gemini Command Center..."

# Load env vars
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi


# Ensure gemini is installed locally
if [ ! -f "node_modules/.bin/gemini" ]; then
    echo "📦 Installing Gemini CLI locally..."
    npm install -D @google/gemini-cli
fi

# Define alias for this script execution
GEMINI_CMD="npx gemini"

# Install Conductor (Orchestration)
echo "conductor: Installing..."
$GEMINI_CMD extensions install https://github.com/gemini-cli-extensions/conductor --auto-update

# Install Security (Guardrails)
echo "security: Installing..."
$GEMINI_CMD extensions install https://github.com/gemini-cli-extensions/security

# Install Code Review (QA)
echo "code-review: Installing..."
$GEMINI_CMD extensions install https://github.com/gemini-cli-extensions/code-review

# Install Jules (Autonomous Coding)
echo "jules: Installing..."
$GEMINI_CMD extensions install https://github.com/gemini-cli-extensions/jules

echo "✅ Agentic Command Center Ready."
