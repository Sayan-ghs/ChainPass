import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// Base logo component
const BaseLogoSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM18.75 12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421C17.3077 7.53556 17.7692 8.14386 18.098 8.82213C18.4268 9.5004 18.618 10.2339 18.6604 10.9841C18.7028 11.7343 18.5955 12.486 18.345 13.1927C18.0944 13.8995 17.7057 14.547 17.2019 15.0983C16.698 15.6496 16.0886 16.0936 15.4121 16.407C14.7357 16.7203 14.0046 16.8965 13.2556 16.9254C12.5066 16.9542 11.7642 16.8351 11.0655 16.5751C10.3667 16.3151 9.7269 15.9196 9.18748 15.4114C8.64806 14.9031 8.2179 14.2927 7.92303 13.6146C7.62816 12.9365 7.47487 12.2046 7.47487 11.4646C7.47487 10.7246 7.62816 9.99273 7.92303 9.31463C8.2179 8.63652 8.64806 8.02614 9.18748 7.51787C9.7269 7.0096 10.3667 6.61409 11.0655 6.35408C11.7642 6.09408 12.5066 5.975 13.2556 6.00378C13.7562 6.02373 14.2508 6.10983 14.7281 6.25956C15.2054 6.40929 15.6598 6.62097 16.0764 6.88834C16.493 7.15572 16.8667 7.47574 17.1848 7.83944C17.5028 8.20313 17.761 8.60647 17.9503 9.03824L10.4415 13.0974C10.4415 13.0974 10.0356 13.3239 10.2184 13.6554C10.4011 13.9869 10.7925 13.7761 10.7925 13.7761L18.2284 9.76142C18.3324 10.1908 18.3903 10.6305 18.401 11.0726C18.4134 11.479 18.3943 11.7946 18.3557 12.0255C18.3171 12.2563 18.1947 12.5758 18.0531 12.8842C17.9114 13.1925 17.7214 13.548 17.5195 13.8626C17.3177 14.1771 17.0565 14.5063 16.7954 14.7705C16.5343 15.0347 16.2182 15.289 15.894 15.477C15.5697 15.6651 15.2042 15.8165 14.8387 15.9011C14.4732 15.9858 14.0845 16.0186 13.6959 15.9844C13.3073 15.9502 12.8996 15.8606 12.5129 15.7181C12.1262 15.5756 11.7431 15.3777 11.4009 15.1458C11.0588 14.9139 10.7413 14.6329 10.485 14.3372C10.2286 14.0415 10.0214 13.7076 9.87599 13.3736C9.73057 13.0396 9.63992 12.6919 9.61139 12.3442C9.58286 11.9965 9.60926 11.6487 9.70014 11.2937C9.79102 10.9387 9.94455 10.5909 10.1488 10.2639C10.353 9.93694 10.6139 9.6245 10.9158 9.35831C11.2176 9.09213 11.5604 8.86833 11.9304 8.7009C12.3003 8.53348 12.698 8.41912 13.0956 8.37032C13.4933 8.32152 13.9054 8.33539 14.2954 8.41284L10.3856 10.5945C10.3856 10.5945 9.96921 10.8039 10.1692 11.1526C10.3692 11.5013 10.7438 11.2819 10.7438 11.2819L18.75 7.02252V12Z" fill="#1652F0"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.75 7.02246V12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421L18.75 7.02246Z" fill="#0052FF"/>
  </svg>
);

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const [error, setError] = useState('');
  const [showConnectors, setShowConnectors] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowConnectors(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Log connection information when connected to Base Sepolia
  useEffect(() => {
    if (isConnected && chain) {
      if (chain.id === baseSepolia.id) {
        console.log('Connected to Base Sepolia Testnet');
        console.log('Chain ID:', chain.id);
        console.log('Connected address:', address);
      }
    }
  }, [isConnected, chain, address]);

  const handleConnect = async (connector) => {
    setError('');
    try {
      connect({ connector });
      setShowConnectors(false);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  return (
    <div className="wallet-connect relative" ref={dropdownRef}>
      {!isConnected ? (
        <>
          <button 
            onClick={() => setShowConnectors(!showConnectors)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
            Connect Wallet
          </button>
          
          {showConnectors && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 transform transition-all duration-200 origin-top-right animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Select a wallet</h3>
              </div>
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={!connector.ready || isLoading}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center group"
                >
                  <div className="mr-3 w-6 h-6 flex items-center justify-center text-blue-500 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                    {connector.id.startsWith('meta') && (
                      <svg className="w-4 h-4" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M32.9582 1L19.8241 10.7183L22.2665 5.09082L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {!connector.id.startsWith('meta') && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="block font-medium text-gray-700">{connector.name}</span>
                    {!connector.ready && <span className="text-xs text-gray-500">Not installed</span>}
                  </div>
                  {isLoading && pendingConnector?.id === connector.id && (
                    <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              ))}
              {error && (
                <div className="text-red-500 text-sm px-4 py-2 border-t border-gray-100 bg-red-50">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {error}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-3">
          <div className="hidden md:flex text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 py-1.5 px-3 rounded-full items-center shadow-sm">
            {chain && chain.id === baseSepolia.id && (
              <div className="flex items-center mr-2">
                <BaseLogoSmall />
                <span className="text-xs text-blue-600 font-medium ml-1">Base</span>
              </div>
            )}
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            {address && (
              <span>{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            )}
          </div>
          <button 
            onClick={() => disconnect()}
            className="text-sm font-medium text-white py-1.5 px-3 rounded-md transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 