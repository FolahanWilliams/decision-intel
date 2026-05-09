import path from 'path';

const vitestConfig = {
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // 'node_modules/**' on its own only matches the ROOT node_modules.
    // The voice-worker has its own nested node_modules (separate Node
    // app — Railway-hosted, NOT bundled with the Vercel main app per
    // CLAUDE.md voice-mode lock 2026-05-03), and vitest was recursively
    // running upstream package tests (@livekit/agents, pino, pino-pretty,
    // on-exit-leak-free) shipped inside those vendored packages. Adding
    // '**/node_modules/**' catches every nested node_modules; adding
    // 'voice-worker/**' belt-and-braces skips the whole sub-app — it has
    // its own test runner if/when needed.
    exclude: ['e2e/**', '**/node_modules/**', 'voice-worker/**'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 30,
        branches: 30,
        functions: 30,
        lines: 30,
      },
    },
  },
};

export default vitestConfig;
