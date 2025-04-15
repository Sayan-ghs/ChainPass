import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

let walletKitInstance = null;

export const initWalletKit = async () => {
  if (walletKitInstance) {
    return walletKitInstance;
  }

  const core = new Core({
<<<<<<< HEAD
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
=======
    projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '0ac4eca2c22f98c8831f8f830c41fc2b'
  });

  const metadata = {
    name: 'My_first_web3',
    description: 'AppKit Example',
    url: window.location.origin, // Ensures it matches your domain & subdomain
    icons: ['https://assets.reown.com/reown-profile-pic.png']
  };

  try {
    walletKitInstance = await WalletKit.init({
      core, // pass the shared 'core' instance
      metadata
>>>>>>> ee039e47a9707604db9ec632d6f185c2eba420c0
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