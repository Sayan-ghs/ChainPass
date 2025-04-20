import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import WalletConnect from './WalletConnect';

function Navbar() {
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const isActive = (path) => {
    return location.pathname === path 
      ? 'text-blue-600 font-semibold border-b-2 border-blue-500' 
      : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300';
  };

  return (
    <nav className={`bg-gradient-to-r from-white to-gray-50 sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'shadow-md' : 'shadow-sm'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-500 transition-colors">
                ChainPass
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/events" className={`${isActive('/events')} py-5 px-1 transition-all duration-200`}>
              Events
            </Link>
            {isConnected && (
              <>
                <Link to="/my-tickets" className={`${isActive('/my-tickets')} py-5 px-1 transition-all duration-200`}>
                  My Tickets
                </Link>
                <Link to="/events/create" className={`${isActive('/events/create')} py-5 px-1 transition-all duration-200`}>
                  Create Event
                </Link>
                <Link to="/events/history" className={`${isActive('/events/history')} py-5 px-1 transition-all duration-200`}>
                  Event History
                </Link>
              </>
            )}
            
            <div className="ml-4">
              <WalletConnect />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-blue-600 focus:outline-none transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fadeIn">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/events" 
                className={`${isActive('/events')} px-3 py-2 rounded-md transition-all duration-200`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Events
              </Link>
              {isConnected && (
                <>
                  <Link 
                    to="/my-tickets" 
                    className={`${isActive('/my-tickets')} px-3 py-2 rounded-md transition-all duration-200`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Tickets
                  </Link>
                  <Link 
                    to="/events/create" 
                    className={`${isActive('/events/create')} px-3 py-2 rounded-md transition-all duration-200`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Event
                  </Link>
                  <Link 
                    to="/events/history" 
                    className={`${isActive('/events/history')} px-3 py-2 rounded-md transition-all duration-200`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Event History
                  </Link>
                </>
              )}
              <div className="px-3 py-2">
                <WalletConnect />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 