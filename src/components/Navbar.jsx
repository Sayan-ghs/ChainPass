import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import WalletConnect from './WalletConnect';
import { ChainPassLogoBase64 } from '../assets/chainpass-logo';

function Navbar() {
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('');

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

  useEffect(() => {
    // Set the active menu item based on current location
    setActiveMenuItem(location.pathname);
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path 
      ? 'text-blue-600 font-semibold border-b-2 border-blue-500' 
      : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300';
  };

  const menuItems = [
    { path: '/events', label: 'Events', alwaysShow: true },
    { path: '/my-tickets', label: 'My Tickets', requiresAuth: true },
    { path: '/events/create', label: 'Create Event', requiresAuth: true },
    { path: '/events/history', label: 'Event History', requiresAuth: true },
  ];

  return (
    <nav 
      className={`bg-gradient-to-r from-white to-gray-50 sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="relative overflow-hidden">
                <img 
                  src={ChainPassLogoBase64} 
                  alt="ChainPass" 
                  className="h-10 w-auto mr-2 transition-transform duration-300 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300"></div>
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-500 transition-colors">
                ChainPass
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map(item => (
              (item.alwaysShow || (item.requiresAuth && isConnected)) && (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`${isActive(item.path)} py-5 px-1 transition-all duration-200 relative group`}
                  onMouseEnter={() => setActiveMenuItem(item.path)}
                  onMouseLeave={() => setActiveMenuItem(location.pathname)}
                >
                  {item.label}
                  <span 
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${
                      activeMenuItem === item.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </Link>
              )
            ))}
            
            <div className="ml-4">
              <WalletConnect />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-blue-600 focus:outline-none transition-colors duration-200 p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 relative">
                <span className={`absolute h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 top-3' : 'top-1'}`}></span>
                <span className={`absolute h-0.5 w-full bg-current transform transition-all duration-300 top-3 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`absolute h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 top-3' : 'top-5'}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu with animation */}
        <div 
          className={`md:hidden border-t border-gray-200 overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-4">
            <div className="flex flex-col space-y-3">
              {menuItems.map(item => (
                (item.alwaysShow || (item.requiresAuth && isConnected)) && (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`${
                      location.pathname === item.path 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                    } px-4 py-2 rounded-md transition-all duration-200`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              <div className="px-4 py-2">
                <WalletConnect />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 