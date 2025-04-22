import React, { useState, useRef, useEffect } from 'react';
import { useNetwork, useSwitchNetwork, useAccount } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';

// Base chain logo - updated to match the provided Base symbol
const BaseLogoSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM18.75 12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421C17.3077 7.53556 17.7692 8.14386 18.098 8.82213C18.4268 9.5004 18.618 10.2339 18.6604 10.9841C18.7028 11.7343 18.5955 12.486 18.345 13.1927C18.0944 13.8995 17.7057 14.547 17.2019 15.0983C16.698 15.6496 16.0886 16.0936 15.4121 16.407C14.7357 16.7203 14.0046 16.8965 13.2556 16.9254C12.5066 16.9542 11.7642 16.8351 11.0655 16.5751C10.3667 16.3151 9.7269 15.9196 9.18748 15.4114C8.64806 14.9031 8.2179 14.2927 7.92303 13.6146C7.62816 12.9365 7.47487 12.2046 7.47487 11.4646C7.47487 10.7246 7.62816 9.99273 7.92303 9.31463C8.2179 8.63652 8.64806 8.02614 9.18748 7.51787C9.7269 7.0096 10.3667 6.61409 11.0655 6.35408C11.7642 6.09408 12.5066 5.975 13.2556 6.00378C13.7562 6.02373 14.2508 6.10983 14.7281 6.25956C15.2054 6.40929 15.6598 6.62097 16.0764 6.88834C16.493 7.15572 16.8667 7.47574 17.1848 7.83944C17.5028 8.20313 17.761 8.60647 17.9503 9.03824L10.4415 13.0974C10.4415 13.0974 10.0356 13.3239 10.2184 13.6554C10.4011 13.9869 10.7925 13.7761 10.7925 13.7761L18.2284 9.76142C18.3324 10.1908 18.3903 10.6305 18.401 11.0726C18.4134 11.479 18.3943 11.7946 18.3557 12.0255C18.3171 12.2563 18.1947 12.5758 18.0531 12.8842C17.9114 13.1925 17.7214 13.548 17.5195 13.8626C17.3177 14.1771 17.0565 14.5063 16.7954 14.7705C16.5343 15.0347 16.2182 15.289 15.894 15.477C15.5697 15.6651 15.2042 15.8165 14.8387 15.9011C14.4732 15.9858 14.0845 16.0186 13.6959 15.9844C13.3073 15.9502 12.8996 15.8606 12.5129 15.7181C12.1262 15.5756 11.7431 15.3777 11.4009 15.1458C11.0588 14.9139 10.7413 14.6329 10.485 14.3372C10.2286 14.0415 10.0214 13.7076 9.87599 13.3736C9.73057 13.0396 9.63992 12.6919 9.61139 12.3442C9.58286 11.9965 9.60926 11.6487 9.70014 11.2937C9.79102 10.9387 9.94455 10.5909 10.1488 10.2639C10.353 9.93694 10.6139 9.6245 10.9158 9.35831C11.2176 9.09213 11.5604 8.86833 11.9304 8.7009C12.3003 8.53348 12.698 8.41912 13.0956 8.37032C13.4933 8.32152 13.9054 8.33539 14.2954 8.41284L10.3856 10.5945C10.3856 10.5945 9.96921 10.8039 10.1692 11.1526C10.3692 11.5013 10.7438 11.2819 10.7438 11.2819L18.75 7.02252V12Z" fill="#1652F0"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.75 7.02246V12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421L18.75 7.02246Z" fill="#0052FF"/>
  </svg>
);

const NetworkInfo = () => {
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const { isConnected } = useAccount();
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Available networks
  const networks = [
    { id: baseSepolia.id, name: 'Base Sepolia', logo: <BaseLogoSVG />, testnet: true },
    { id: base.id, name: 'Base', logo: <BaseLogoSVG />, testnet: false }
  ];

  // Get current network info
  const currentNetwork = networks.find(net => net.id === chain?.id) || networks[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNetworkMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show nothing if not connected
  if (!isConnected) {
    return null;
  }

  return (
    <div className="network-info relative" ref={dropdownRef}>
      <button
        onClick={() => setShowNetworkMenu(!showNetworkMenu)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-md py-1.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <div className="flex-shrink-0">
          {currentNetwork.logo}
        </div>
        <span className="hidden sm:inline">
          {currentNetwork.name}
          {currentNetwork.testnet && <span className="text-xs text-blue-500 ml-1">(Testnet)</span>}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showNetworkMenu && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 animate-fadeIn">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Network</h3>
          </div>
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => {
                if (switchNetwork) switchNetwork(network.id);
                setShowNetworkMenu(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center ${
                currentNetwork.id === network.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="mr-2 flex-shrink-0">{network.logo}</div>
              <div>
                <span className="block font-medium text-gray-700">{network.name}</span>
                {network.testnet && (
                  <span className="text-xs text-blue-500">Testnet</span>
                )}
              </div>
              {currentNetwork.id === network.id && (
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkInfo; 