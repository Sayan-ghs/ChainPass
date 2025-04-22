import { useEffect } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';

// This component doesn't render anything - it just logs network information
const NetworkCheck = () => {
  const { chain } = useNetwork();
  const { isConnected, address } = useAccount();

  useEffect(() => {
    console.log('Network Check: Initializing...');
    console.log('Application configured to support Base chains:', [base.name, baseSepolia.name]);
    console.log('Base Sepolia chain ID:', baseSepolia.id);
    
    return () => {
      console.log('Network Check: Cleaning up...');
    };
  }, []);

  useEffect(() => {
    if (chain) {
      const isBaseChain = chain.id === base.id || chain.id === baseSepolia.id;
      const networkInfo = {
        chainId: chain.id,
        chainName: chain.name,
        isConnected,
        isBaseChain,
        isBaseSepolia: chain.id === baseSepolia.id,
        connectedAddress: address
      };
      
      console.log('Network Check: Chain changed', networkInfo);
      
      if (isBaseChain) {
        console.log('✅ Successfully connected to a Base chain');
        
        if (chain.id === baseSepolia.id) {
          console.log('✅ Connected to Base Sepolia Testnet (Chain ID: 84532)');
        } else if (chain.id === base.id) {
          console.log('✅ Connected to Base Mainnet (Chain ID: 8453)');
        }
      } else {
        console.warn('⚠️ Not connected to a Base chain. Please switch to Base or Base Sepolia.');
      }
    }
  }, [chain, isConnected, address]);

  // This component doesn't render anything
  return null;
};

export default NetworkCheck; 