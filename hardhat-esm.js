#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const hardhatBin = resolve(__dirname, 'node_modules', '.bin', 'hardhat');

// Run hardhat with proper Node.js flags for ES modules
const hardhat = spawn(
  'node', 
  [
    '--experimental-specifier-resolution=node',
    '--loader=ts-node/esm',
    hardhatBin,
    ...args
  ],
  { 
    stdio: 'inherit',
    shell: true
  }
);

hardhat.on('close', (code) => {
  process.exit(code);
}); 