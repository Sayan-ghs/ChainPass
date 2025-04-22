import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { ChainPassLogoBase64 } from '../assets/chainpass-logo';

function Home() {
  const { isConnected } = useAccount();
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  // Simulate content loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Features data
  const features = [
    {
      id: 1,
      title: "NFT Tickets",
      description: "Mint unique NFT tickets for your events with optional soulbound functionality.",
      icon: "🎟️",
      color: "from-blue-500 to-purple-600",
    },
    {
      id: 2,
      title: "On-chain Check-in",
      description: "Verify attendance with QR codes or wallet connections, all recorded on-chain.",
      icon: "✓",
      color: "from-purple-500 to-pink-600",
    },
    {
      id: 3,
      title: "Rewards System",
      description: "Claim NFTs, tokens, or POAPs as rewards for attending events.",
      icon: "🏆",
      color: "from-orange-500 to-red-600",
    },
  ];

  return (
    <div className="space-y-16 overflow-hidden">
      {/* Hero Section with animation */}
      <section className="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <div className="absolute w-64 h-64 rounded-full bg-white opacity-5 -top-20 -left-20 animate-pulse"></div>
          <div className="absolute w-96 h-96 rounded-full bg-white opacity-5 -bottom-40 -right-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={`flex flex-col items-center justify-center mb-8 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative">
              <img 
                src={ChainPassLogoBase64} 
                alt="ChainPass Logo" 
                className="h-32 mb-6 drop-shadow-lg hover:scale-105 transition-transform duration-300"
                onLoad={() => setIsLoaded(true)}
              />
              <div className="absolute -inset-1 bg-white opacity-20 blur-lg rounded-full animate-pulse"></div>
            </div>
            <h1 className="text-5xl font-bold mb-6 animate-fadeIn">Welcome to ChainPass</h1>
          </div>
          <p className="text-xl mb-8 max-w-2xl mx-auto animate-fadeIn" style={{animationDelay: '0.3s'}}>
            The decentralized event access system that revolutionizes how you manage and attend events.
          </p>
          <div className="space-x-4 animate-fadeIn" style={{animationDelay: '0.6s'}}>
            <Link
              to="/events"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Browse Events
            </Link>
            {isConnected && (
              <Link
                to="/events/create"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Create Event
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* What is ChainPass? Section for Judges */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 animate-fadeIn">What is ChainPass?</h2>
          
          <div className="bg-white p-8 rounded-xl shadow-xl relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full opacity-70"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-100 rounded-full opacity-70"></div>
            
            <div className="relative z-10">
              <p className="text-lg mb-6 leading-relaxed text-gray-700">
                <span className="font-semibold text-blue-700">ChainPass</span> is a decentralized event management platform built on Base Chain that revolutionizes how events are created, attended, and verified using blockchain technology.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    The Problem
                  </h3>
                  <p className="text-gray-700">
                    Traditional event ticketing systems suffer from counterfeiting, scalping, and lack of transparency. Attendee verification is often manual and prone to errors.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="font-semibold text-purple-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Our Solution
                  </h3>
                  <p className="text-gray-700">
                    ChainPass uses soulbound NFT tickets and on-chain verification to create a secure, transparent event ecosystem that benefits both organizers and attendees.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  Technical Implementation
                </h3>
                <p className="text-gray-700">
                  Built on <span className="font-semibold">Base Chain</span> using a system of smart contracts including EventManager, TicketNFT, and CheckInManager. We use <span className="font-semibold">ERC721</span> for tickets with optional soulbound properties and secure, on-chain validation.
                </p>
              </div>
              
              <div className="flex justify-center">
                <a 
                  href="https://github.com/your-username/chainpass" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  View Source Code
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with hover effects */}
      <section className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 animate-slideInBottom">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className={`bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${activeFeature === feature.id ? 'ring-2 ring-blue-500' : ''}`}
              onMouseEnter={() => setActiveFeature(feature.id)}
              onMouseLeave={() => setActiveFeature(null)}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${feature.color} text-white flex items-center justify-center text-xl mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section with numbered steps and visual connections */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-xl">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-200 -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {[
              { step: 1, title: "Connect Wallet", desc: "Login with your smart wallet" },
              { step: 2, title: "Mint Ticket", desc: "Get your NFT ticket for the event" },
              { step: 3, title: "Check In", desc: "Verify your attendance at the event" },
              { step: 4, title: "Claim Rewards", desc: "Receive your event rewards" }
            ].map((item) => (
              <div key={item.step} className="text-center flex flex-col items-center">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg hover:shadow-xl transition-all duration-300 border-4 border-blue-100">
                  <span className="text-blue-600 font-bold text-xl">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2 text-lg">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 rounded-xl mx-4">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users already using ChainPass for their events.
          </p>
          <Link
            to="/events"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 shadow-lg inline-block"
          >
            Explore Events
          </Link>
        </div>
      </section>
    </div>
  );
}

// Add these animations to your CSS or tailwind.config.js
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
// @keyframes slideInBottom { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
// .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
// .animate-slideInBottom { animation: slideInBottom 0.8s ease-out forwards; }

export default Home; 