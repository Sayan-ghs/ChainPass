import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

let walletKitInstance = null;

export const initWalletKit = async () => {
  if (walletKitInstance) {
    return walletKitInstance;
  }

  const core = new Core({
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '0ac4eca2c22f98c8831f8f830c41fc2b',
    // Configure the core with proper expirer settings
    logger: 'error',
    relayUrl: 'wss://relay.walletconnect.com'
  });

  const metadata = {
    name: 'ChainPass',
    description: 'Decentralized event access system with NFT tickets',
    url: window.location.origin,
    icons: ['https://assets.reown.com/reown-profile-pic.png']
  };

  // Configuration for storage
  const storageOptions = {
    // Set a unique storage key prefix to avoid conflicts
    storagePrefix: 'chainpass_wallet_',
    // Configure expirer options
    expirer: {
      // Default expiry set to 7 days (in seconds)
      defaultTtl: 7 * 24 * 60 * 60,
      // Auto-remove expired entries on initialization
      clearOnInit: true
    }
  };

  try {
    walletKitInstance = await WalletKit.init({
      core,
      metadata,
      storageOptions
    });
    
    return walletKitInstance;
  } catch (error) {
    console.error('Failed to initialize WalletKit:', error);
    throw error;
  }
};

export const getWalletKit = () => {
  if (!walletKitInstance) {
    throw new Error('WalletKit not initialized. Call initWalletKit first.');
  }
  return walletKitInstance;
}; 