/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_ONCHAINKIT_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare process.env for compatibility
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_PUBLIC_ONCHAINKIT_API_KEY: string;
  }
} 