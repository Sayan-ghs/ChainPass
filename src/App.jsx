import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initWalletKit } from './services/walletService';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import MyTickets from './pages/MyTickets';
import CheckIn from './pages/CheckIn';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error('Query error:', error);
      }
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  }
});

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base, baseSepolia],
  [publicProvider()]
);

// App metadata
const appMetadata = {
  name: 'ChainPass',
  description: 'Decentralized event access system with NFT tickets',
  url: window.location.origin,
  icons: ['https://assets.reown.com/reown-profile-pic.png']
};

// Create connectors
const connectors = [
  new InjectedConnector({
    chains,
    options: { shimDisconnect: true },
  }),
  new MetaMaskConnector({
    chains,
    options: { shimDisconnect: true },
  }),
  new WalletConnectConnector({
    chains,
    options: {
      projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '0ac4eca2c22f98c8831f8f830c41fc2b',
      metadata: appMetadata,
      relayUrl: 'wss://relay.walletconnect.com',
      storageOptions: {
        storagePrefix: 'chainpass_wagmi_',
        expirer: {
          defaultTtl: 7 * 24 * 60 * 60,
          clearOnInit: true
        }
      }
    },
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'ChainPass',
      appLogoUrl: appMetadata.icons[0]
    },
  }),
];

// Create config
const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

// Error boundary component to catch errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Prevent browser extensions from breaking the app
  useEffect(() => {
    // Override any extension's overriding of global objects
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out extension errors
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('multiVariateTestingCS') || 
           args[0].includes('message port closed'))) {
        return; // Silently ignore these errors
      }
      originalConsoleError.apply(console, args);
    };

    // Clean up
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    // Initialize WalletKit when the app loads
    const initializeWallet = async () => {
      try {
        await initWalletKit();
        console.log('WalletKit initialized successfully');
        setAppInitialized(true);
      } catch (error) {
        console.error('Error initializing WalletKit:', error);
        setError(error);
      }
    };

    initializeWallet();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-700 mb-4">
            Failed to initialize the wallet connection. Please check your network connection and try again.
          </p>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <WagmiConfig config={config}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-gray-100">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/events/create" element={<CreateEvent />} />
                  <Route path="/events/:id" element={<EventDetails />} />
                  <Route path="/my-tickets" element={<MyTickets />} />
                  <Route path="/check-in/:eventId" element={<CheckIn />} />
                </Routes>
              </main>
            </div>
          </Router>
        </QueryClientProvider>
      </WagmiConfig>
    </ErrorBoundary>
  );
}

export default App; 