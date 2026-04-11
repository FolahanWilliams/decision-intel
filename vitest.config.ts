import path from 'path';

const vitestConfig = {
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    exclude: ['e2e/**', 'node_modules/**'],
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
