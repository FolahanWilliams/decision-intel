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
      // Ratcheted 2026-05-16 (was 30 across the board) after the Tier-1/2/3
      // scoring + calibration + gate test cascade. Measured repo-wide v8
      // coverage at ratchet time: stmts 53.08 · branch 43.30 · funcs 51.23
      // · lines 53.67. Floors set ~3pt below measured so an unrelated PR
      // adding a little untested code doesn't snap CI, while the floor can
      // no longer silently regress to the old 30. Raise again as coverage
      // climbs (Tier-2 moat-path Prisma fixtures are the next lift).
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 48,
        lines: 50,
      },
    },
  },
};

export default vitestConfig;
