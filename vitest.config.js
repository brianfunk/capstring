import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['index.js', 'cli.js', 'netlify/functions/**'],
      exclude: ['bin/**', 'web/**'],
      reporter: ['text', 'html', 'lcov'],
      testTimeout: 20000,
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }
    }
  }
});
