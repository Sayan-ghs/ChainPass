import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
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