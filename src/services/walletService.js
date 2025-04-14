import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';

let walletKitInstance = null;

export const initWalletKit = async () => {
  if (walletKitInstance) {
    return walletKitInstance;
  }

  const core = new Core({
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