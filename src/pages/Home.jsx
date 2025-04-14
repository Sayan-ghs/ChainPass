import React from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">Welcome to ChainPass</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            The decentralized event access system that revolutionizes how you manage and attend events.
          </p>
          <div className="space-x-4">
            <Link
              to="/events"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Browse Events
            </Link>
            {isConnected && (
              <Link
                to="/events/create"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
              >
                Create Event
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">NFT Tickets</h3>
            <p className="text-gray-600">
              Mint unique NFT tickets for your events with optional soulbound functionality.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">On-chain Check-in</h3>
            <p className="text-gray-600">
              Verify attendance with QR codes or wallet connections, all recorded on-chain.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Rewards System</h3>
            <p className="text-gray-600">
              Claim NFTs, tokens, or POAPs as rewards for attending events.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Connect Wallet</h3>
            <p className="text-gray-600">Login with your smart wallet</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Mint Ticket</h3>
            <p className="text-gray-600">Get your NFT ticket for the event</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Check In</h3>
            <p className="text-gray-600">Verify your attendance at the event</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold">4</span>
            </div>
            <h3 className="font-semibold mb-2">Claim Rewards</h3>
            <p className="text-gray-600">Receive your event rewards</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home; 