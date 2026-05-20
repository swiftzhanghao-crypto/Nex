import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts', 'data/generators.ts'],
      exclude: [
        'server/production.ts',
        'server/index.ts',
        'server/seed.ts',
        'server/middleware.ts',
        'server/openapi.ts',
        'server/notifications.ts',
        'server/routes/wps-auth.ts',
        'server/routes/ai.ts',
        'server/routes/finance.ts',
        'server/routes/opportunities.ts',
        'server/routes/spaces.ts',
        'server/routes/crm-xiaoshouyi.ts',
        'server/routes/audit.ts',
        'server/routes/import.ts',
        'server/routes/notifications.ts',
      ],
      thresholds: { lines: 70, branches: 55, functions: 65, statements: 70 },
    },
  },
});
