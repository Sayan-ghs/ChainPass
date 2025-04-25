import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import WalletConnect from './WalletConnect';
import NetworkInfo from './NetworkInfo';
import { AnimatedChainPassLogo } from '../assets/ChainpassLogo.jsx';

function Navbar() {
  const { address, isConnected } = useAccount();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState('');
  const [hasScrolledAnimated, setHasScrolledAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
        if (isScrolled) {
          setHasScrolledAnimated(true);
        }
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
      : 'text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-300';
  };

  const menuItems = [
    { path: '/events', label: 'Events', alwaysShow: true },
    { path: '/my-tickets', label: 'My Tickets', requiresAuth: true },
    { path: '/events/create', label: 'Create Event', requiresAuth: true },
    { path: '/events/history', label: 'Event History', requiresAuth: true },
  ];

  return (
    <nav 
      className={`backdrop-blur-sm sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'shadow-lg bg-white/90' 
          : 'bg-white/80 shadow-sm'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className={`transition-all duration-500 transform ${hasScrolledAnimated && scrolled ? 'scale-90' : 'scale-100'}`}>
                <AnimatedChainPassLogo 
                  width={scrolled ? "38px" : "45px"}
                  height={scrolled ? "38px" : "45px"} 
                  className="mr-3"
                  id={`nav-logo-${scrolled ? 'scrolled' : 'top'}`}
                />
              </div>
              <div className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-blue-400 transition-all duration-300 ${
                scrolled ? 'tracking-tight' : 'tracking-normal'
              }`}>
                ChainPass
              </div>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-5">
            {menuItems.map(item => (
              (item.alwaysShow || (item.requiresAuth && isConnected)) && (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={`${isActive(item.path)} py-5 px-2 transition-all duration-300 relative group text-sm font-medium`}
                  onMouseEnter={() => setActiveMenuItem(item.path)}
                  onMouseLeave={() => setActiveMenuItem(location.pathname)}
                >
                  {item.label}
                  <span 
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ease-out ${
                      activeMenuItem === item.path ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  ></span>
                </Link>
              )
            ))}
            
            {isConnected && (
              <div className="ml-1 transition-all duration-300 transform hover:scale-[1.03]">
                <NetworkInfo />
              </div>
            )}
            <div className="ml-2 transition-all duration-300 transform hover:scale-[1.03]">
              <WalletConnect />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-blue-600 focus:outline-none transition-colors duration-200 p-2 rounded-md hover:bg-blue-50"
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
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-3 border-t border-gray-100">
            <div className="flex flex-col space-y-2 pb-2">
              {menuItems.map(item => (
                (item.alwaysShow || (item.requiresAuth && isConnected)) && (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    className={`${
                      location.pathname === item.path 
                        ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-500' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 border-l-4 border-transparent'
                    } px-4 py-2.5 transition-all duration-200 rounded-r-md`}
                  >
                    {item.label}
                  </Link>
                )
              ))}
              {isConnected && (
                <div className="px-3 py-2 rounded-md">
                  <NetworkInfo />
                </div>
              )}
              <div className="px-3 py-2 rounded-md">
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