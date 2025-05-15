import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Read from .env file
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: 30000, // Global timeout for each test in milliseconds
  expect: {
    timeout: 5000, // Timeout for expect() assertions
  },
  fullyParallel: true, // Run tests in files in parallel
  forbidOnly: !!process.env.CI, // Fail if tests are focused with test.only in CI
  retries: process.env.CI ? 1 : 0, // Retry failed tests once in CI
  workers: process.env.CI ? 1 : undefined, // Number of concurrent workers
  reporter: [
    ['html', { open: 'never' }], // HTML reporter
    ['list'] // List reporter for console output
  ],
  use: {
    trace: 'on-first-retry', // Trace on first retry of failed tests
  },
  // Configure environment-specific projects
  projects: [
    {
      name: 'local',
      use: {
        // Local environment settings
        LAB_GATEWAY_URL: 'localhost:50051',
      },
    },
    {
      name: 't1',
      use: {
        // T1 environment settings
        LAB_GATEWAY_URL: 'https://lab.t1-lab-lab.t1.testenv.io:50051',
      },
    },
  ],
}); 