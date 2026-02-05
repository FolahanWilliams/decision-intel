import path from 'path';

export default {
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    environment: 'node',
    globals: true,
  },
};
