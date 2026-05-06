import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated agent skill files:
    '.agent/**',
    // Script files:
    'scripts/**',
    // Browser extension (minified vendor bundles):
    'extension/**',
    'extension 2/**',
    // Minified vendor bundles served from /public:
    'public/**',
  ]),
  {
    files: ['src/app/(platform)/documents/[id]/page.tsx'],
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  ...nextVitals,
  ...nextTs,
  // Override AFTER nextTs so the ignore patterns stick (the next-ts
  // preset configures @typescript-eslint/no-unused-vars with its own
  // defaults; later rules win in flat-config). The caughtErrors entry
  // (added 2026-05-06) silences the underscore-prefixed catch-param
  // warnings the silent-catch sweep created when it converted bare
  // `} catch {` blocks to `} catch (_err) {` to attach context.
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]);

export default eslintConfig;
