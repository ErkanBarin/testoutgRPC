#!/usr/bin/env node

/**
 * Script to set environment configuration based on command line argument
 * Usage: node scripts/set-env.js [local|t1]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const envFile = path.join(rootDir, '.env');

// Define environment configurations
const environments = {
  local: {
    LAB_GATEWAY_URL: 'localhost:50051',
    SITE_ID: 12,
    OPERATOR_ID: 2
  },
  t1: {
    LAB_GATEWAY_URL: 'https://lab.t1-lab-lab.t1.testenv.io:50051',
    SITE_ID: 12,
    OPERATOR_ID: 2
  }
};

// Get environment from command line argument
const env = process.argv[2]?.toLowerCase();

if (!env || !environments[env]) {
  console.error('Please specify environment: node scripts/set-env.js [local|t1]');
  process.exit(1);
}

// Create .env content
const envContent = Object.entries(environments[env])
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write to .env file
try {
  fs.writeFileSync(envFile, envContent);
  console.log(`Environment set to ${env.toUpperCase()}`);
  console.log('Configuration:');
  console.log(envContent);
} catch (error) {
  console.error(`Error writing .env file: ${error.message}`);
  process.exit(1);
} 