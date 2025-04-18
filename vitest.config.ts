import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        '.release-it.js',
        'eslint.config.mjs',
        'vitest.config.ts',
        'src/sources/base.ts'
      ]
    }
  },
});
