import path from 'path';

const config = {
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    environment: 'node',
  },
};

export default config;
