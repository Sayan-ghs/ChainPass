import React, { useEffect } from 'react';
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
const queryClient = new QueryClient();

// Configure chains & providers
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base, baseSepolia],
  [publicProvider()]
);

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
      projectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '0ac4eca2c22f98c8831f8f830c41fc2b'
    },
  }),
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'ChainPass',
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

function App() {
  useEffect(() => {
    // Initialize WalletKit when the app loads
    const initializeWallet = async () => {
      try {
        await initWalletKit();
        console.log('WalletKit initialized successfully');
      } catch (error) {
        console.error('Error initializing WalletKit:', error);
      }
    };

    initializeWallet();
  }, []);

  return (
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
  );
}

export default App; 