import path from 'path';

const config = {
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
};

export default config;
