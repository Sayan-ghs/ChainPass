import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  define: {
    'process.env.WALLET_CONNECT_PROJECT_ID': JSON.stringify(process.env.WALLET_CONNECT_PROJECT_ID),
  },
  optimizeDeps: {
    exclude: ['@farcaster/hub-nodejs', '@grpc/grpc-js'],
    include: ['@coinbase/onchainkit', '@walletconnect/core', '@reown/walletkit'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['@farcaster/hub-nodejs', '@grpc/grpc-js'],
    },
  },
  resolve: {
    alias: {
      '@farcaster/hub-nodejs': path.resolve(__dirname, './src/mocks/@farcaster/hub-nodejs.js'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  esbuild: {
    target: 'esnext',
  },
}) 