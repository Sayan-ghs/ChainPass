import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContractRead, useContractWrite, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function EventDetails() {
  const { id } = useParams();
  const { address } = useAccount();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { data: eventData, isError: isEventError, error: eventError } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [id],
    enabled: !!id,
  });

  const { write: writeContract, isLoading: isWriteLoading, isSuccess: isWriteSuccess, error: writeError } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'buyTicket',
  });

  // Check if we should enable demo mode (for development only)
  useEffect(() => {
    // Check URL params for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
      setIsDemoMode(true);
      console.log('DEMO MODE ENABLED - This is for testing UI only');
    }
  }, []);

  useEffect(() => {
    console.log("EventDetails mounted, checking ABI for buyTicket");
    console.log("Contract address:", import.meta.env.VITE_EVENT_MANAGER_ADDRESS);
    console.log("EventManagerABI functions:", EventManagerABI
      .filter(item => item.type === "function")
      .map(func => func.name)
    );
    if (isEventError && eventError) {
      console.error('Error fetching event:', eventError);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
    } else if (eventData) {
      // Process the event data, ensuring all values are properly formatted
      try {
        setEvent({
          id: Number(id),
          name: eventData.name,
          description: eventData.description,
          imageUri: eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
          organizer: eventData.organizer,
          ticketPrice: eventData.ticketPrice,
          maxTickets: Number(eventData.maxTickets),
          startTime: Number(eventData.startTime),
          endTime: Number(eventData.endTime),
          ticketContract: eventData.ticketContract,
          checkInContract: eventData.checkInContract,
          isActive: eventData.isActive,
          // Since ticketsSold might not be in the contract, default to 0
          ticketsSold: eventData.ticketsSold ? Number(eventData.ticketsSold) : 0,
        });
      } catch (err) {
        console.error('Error processing event data:', err);
        setError('Error processing event data');
      } finally {
        setLoading(false);
      }
    }
  }, [eventData, isEventError, eventError, id]);

  // Handle transaction states
  useEffect(() => {
    if (isWriteSuccess) {
      setBuyingTicket(false);
      alert('Ticket purchased successfully! It will be added to your account shortly.');
    }
    
    if (writeError) {
      setBuyingTicket(false);
      console.error('Transaction error:', writeError);
      
      if (writeError.message && writeError.message.includes('insufficient funds')) {
        setInsufficientFunds(true);
        alert(
          'Insufficient funds for this purchase.\n\n' +
          `You need at least ${formatEth(event?.ticketPrice || 0)} ETH plus gas fees.\n\n` +
          'Please add more funds to your wallet and try again.'
        );
      }
    }
  }, [isWriteSuccess, writeError]);

  const handleBuyTicket = async () => {
    if (!address) {
      alert('Please connect your wallet to buy a ticket');
      return;
    }

    if (insufficientFunds && !isDemoMode) {
      alert(
        'You likely have insufficient funds for this purchase.\n\n' +
        `You need at least ${formatEth(event.ticketPrice)} ETH plus gas fees in your wallet.\n\n` +
        'Please add more funds to your wallet and try again or use the demo mode for testing.'
      );
      return;
    }
    
    try {
      // Convert the ticketPrice to BigInt to avoid precision issues
      const price = event.ticketPrice;
      const ticketPriceInEth = formatEth(price);
      console.log('Buying ticket for event:', id, 'Price:', price.toString(), 'ETH Value:', ticketPriceInEth);
      
      // In demo mode, we skip the actual transaction and simulate success
      if (isDemoMode) {
        setBuyingTicket(true);
        console.log('DEMO MODE: Simulating ticket purchase success');
        
        // Create a demo ticket
        const demoTicket = {
          id: Math.floor(100000 + Math.random() * 900000), // Random 6-digit number
          isUsed: false,
          eventId: Number(id),
          event: {
            ...event,
            id: Number(id)
          },
          purchasedAt: new Date().toISOString(),
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-TICKET-${id}-${Date.now()}`
        };
        
        // Save to localStorage for persistence
        const existingTickets = localStorage.getItem('demoTickets') 
          ? JSON.parse(localStorage.getItem('demoTickets')) 
          : [];
        
        const updatedTickets = [...existingTickets, demoTicket];
        localStorage.setItem('demoTickets', JSON.stringify(updatedTickets));
        
        // Simulate transaction delay
        setTimeout(() => {
          setBuyingTicket(false);
          alert('DEMO MODE: Ticket purchased successfully! View it in My Tickets section.');
        }, 2000);
        
        return;
      }
      
      // Warn user about potential insufficient funds
      const confirmPurchase = window.confirm(
        `You are about to purchase a ticket for ${event.name} for ${ticketPriceInEth} ETH.\n\n` +
        `Make sure you have enough ETH in your wallet (${ticketPriceInEth} ETH for the ticket + extra for gas fees).\n\n` +
        `Would you like to continue?`
      );
      
      if (!confirmPurchase) {
        return;
      }
      
      setBuyingTicket(true);
      
      writeContract({
        args: [id],
        value: price,
      });
    } catch (error) {
      console.error('Error buying ticket:', error);
      setBuyingTicket(false);
      
      // Check for specific error types
      if (error.message && error.message.includes("insufficient funds")) {
        alert(
          'Insufficient funds for this purchase.\n\n' +
          `You need at least ${formatEth(event.ticketPrice)} ETH plus gas fees in your wallet.\n\n` +
          'Please add more funds to your wallet and try again.\n\n' +
          'For testing purposes, you can use demo mode by adding ?demo=true to the URL.'
        );
        setInsufficientFunds(true);
      } else {
        alert('Failed to buy ticket: ' + error.message);
      }
    }
  };

  // Update button text based on transaction state
  const getButtonText = () => {
    if (isDemoMode) return 'Buy Ticket (Demo Mode)';
    if (!address) return 'Connect Wallet to Buy Ticket';
    if (buyingTicket || isWriteLoading) return 'Processing Transaction...';
    if (insufficientFunds) return 'Insufficient Funds - Click for Details';
    return 'Buy Ticket';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-700">Event not found</p>
        </div>
      </div>
    );
  }

  // Format dates safely
  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Format ETH amount safely
  const formatEth = (wei) => {
    try {
      // Handle different types of inputs
      if (typeof wei === 'bigint') {
        return Number(wei.toString()) / 1e18;
      } else if (typeof wei === 'string') {
        return Number(wei) / 1e18;
      } else if (typeof wei === 'number') {
        return wei / 1e18;
      } else if (wei && typeof wei.toString === 'function') {
        return Number(wei.toString()) / 1e18;
      }
      return 0;
    } catch (err) {
      console.error('Error formatting ETH:', err, wei);
      return 0;
    }
  };

  // Helper to determine if event is ended
  const isEventEnded = () => {
    try {
      return new Date() >= new Date(event.endTime * 1000);
    } catch (err) {
      return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {isDemoMode && (
        <div className="max-w-4xl mx-auto mb-4 p-2 bg-purple-100 border-l-4 border-purple-500 text-purple-700">
          <p className="font-bold">Demo Mode Enabled</p>
          <p className="text-sm">No real transactions will be sent to the blockchain. This is for UI testing only.</p>
        </div>
      )}
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <img
          src={event.imageUri}
          alt={event.name}
          className="w-full h-64 object-cover"
        />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          <p className="text-gray-600 mb-6">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Event Details</h2>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-600">Start Time:</span>{' '}
                  {formatDate(event.startTime)}
                </li>
                <li>
                  <span className="text-gray-600">End Time:</span>{' '}
                  {formatDate(event.endTime)}
                </li>
                <li>
                  <span className="text-gray-600">Ticket Price:</span>{' '}
                  {formatEth(event.ticketPrice)} ETH
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Ticket Information</h2>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-600">Available Tickets:</span>{' '}
                  {event.maxTickets - event.ticketsSold} / {event.maxTickets}
                </li>
                <li>
                  <span className="text-gray-600">Tickets Sold:</span>{' '}
                  {event.ticketsSold}
                </li>
                <li>
                  <span className="text-gray-600">Soulbound:</span>{' '}
                  {event.isSoulbound ? 'Yes' : 'No'}
                </li>
              </ul>
            </div>
          </div>

          {event.isActive && !isEventEnded() && (
            <button
              onClick={handleBuyTicket}
              className={`w-full py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isDemoMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : insufficientFunds 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : (buyingTicket || isWriteLoading)
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              disabled={(!address && !isDemoMode) || buyingTicket || isWriteLoading}
            >
              {getButtonText()}
            </button>
          )}

          {!event.isActive && (
            <div className="text-center text-red-600 p-3 bg-red-50 rounded-lg">
              This event is no longer active
            </div>
          )}

          {isEventEnded() && (
            <div className="text-center text-orange-600 p-3 bg-orange-50 rounded-lg">
              This event has ended
            </div>
          )}
          
          {/* Demo mode toggle - for development purposes only */}
          <div className="mt-4 text-center">
            <button 
              onClick={() => setIsDemoMode(!isDemoMode)} 
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {isDemoMode ? "Exit Demo Mode" : "Enable Demo Mode (For Testing)"}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Demo mode allows testing without requiring actual ETH.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails; 