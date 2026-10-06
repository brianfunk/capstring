import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20000, // first /api/spell test loads a 600 kB Hunspell dictionary
    coverage: {
      provider: 'v8',
      include: ['index.js', 'cli.js', 'netlify/functions/**'],
      exclude: ['bin/**', 'web/**'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }
    }
  }
});
