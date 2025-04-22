import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import TicketPreview from '../components/TicketPreview';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { useTransactions, TX_STATUS } from '../contexts/TransactionContext';

function EventDetails() {
  const { id } = useParams();
  const { address } = useAccount();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { addTransaction, updateTransaction } = useTransactions();
  const [currentTxId, setCurrentTxId] = useState(null);

  const { data: eventData, isError: isEventError, error: eventError } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [id],
    enabled: !!id,
  });

  const { 
    write: writeContract, 
    isLoading: isWriteLoading, 
    isSuccess: isWriteSuccess, 
    error: writeError,
    data: writeData
  } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'buyTicket',
  });
  
  // Add transaction waiting functionality
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    error: confirmError 
  } = useWaitForTransaction({
    hash: writeData?.hash,
    enabled: !!writeData?.hash,
    onSuccess(data) {
      // Update the transaction notification to success
      if (currentTxId) {
        updateTransaction(currentTxId, {
          status: TX_STATUS.SUCCESS,
          message: `Successfully purchased a ticket for "${event?.name}"`,
          autoClose: true
        });
      }
      
      // Show success message
      setBuyingTicket(false);
    },
    onError(error) {
      // Update the transaction notification to error
      if (currentTxId) {
        updateTransaction(currentTxId, {
          status: TX_STATUS.ERROR,
          message: `Transaction failed: ${error.message}`,
          autoClose: false
        });
      }
      
      setBuyingTicket(false);
      console.error('Transaction confirmation error:', error);
    }
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
    if (isWriteSuccess && writeData) {
      // Create notification for pending transaction
      const txId = addTransaction({
        status: TX_STATUS.PENDING,
        message: `Purchasing ticket for "${event?.name}"...`,
        hash: writeData.hash,
        autoClose: false
      });
      
      setCurrentTxId(txId);
      console.log('Transaction submitted:', writeData.hash);
    }
    
    if (writeError) {
      setBuyingTicket(false);
      console.error('Transaction error:', writeError);
      
      // Check for different error types
      const errorMessage = writeError.message || '';
      let notificationStatus = TX_STATUS.ERROR;
      let notificationMessage = 'Transaction failed';
      
      if (errorMessage.includes('insufficient funds')) {
        setInsufficientFunds(true);
        notificationMessage = `Insufficient funds for this purchase. You need at least ${formatEth(event?.ticketPrice || 0)} ETH plus gas fees.`;
      } else if (errorMessage.includes('user rejected transaction')) {
        // User rejected in wallet
        notificationStatus = TX_STATUS.REJECTED;
        notificationMessage = 'Transaction was rejected in your wallet';
        console.log('User rejected the transaction');
      } else if (errorMessage.includes('transaction reverted')) {
        // Contract reverted - try to provide a more specific reason
        if (errorMessage.includes('sold out') || errorMessage.includes('maxTickets')) {
          notificationMessage = 'This event is sold out. No more tickets are available.';
        } else if (errorMessage.includes('already purchased') || errorMessage.includes('already has a ticket')) {
          notificationMessage = 'You already have a ticket for this event.';
        } else if (errorMessage.includes('event ended') || errorMessage.includes('not active')) {
          notificationMessage = 'This event has ended or is not active.';
        } else if (errorMessage.includes('incorrect amount') || errorMessage.includes('wrong amount') || errorMessage.includes('price')) {
          notificationMessage = `The exact ticket price of ${formatEth(event?.ticketPrice || 0)} ETH must be sent.`;
        } else {
          notificationMessage = 'The transaction was reverted by the smart contract.';
        }
      }
      
      // Add notification for the error
      addTransaction({
        status: notificationStatus,
        message: notificationMessage,
        autoClose: false
      });
    }
  }, [isWriteSuccess, writeData, writeError, event, addTransaction, updateTransaction]);

  const handleBuyTicket = async () => {
    if (!address) {
      addTransaction({
        status: TX_STATUS.ERROR,
        message: 'Please connect your wallet to buy a ticket',
        autoClose: true
      });
      return;
    }

    if (insufficientFunds && !isDemoMode) {
      addTransaction({
        status: TX_STATUS.ERROR,
        message: `You likely have insufficient funds for this purchase. You need at least ${formatEth(event.ticketPrice)} ETH plus gas fees.`,
        autoClose: false
      });
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
        
        // Create notification for demo
        const demoTxId = addTransaction({
          status: TX_STATUS.PENDING,
          message: `DEMO: Purchasing ticket for "${event?.name}"...`,
          autoClose: false
        });
        
        // Create a demo ticket with safe serialization of any BigInt values
        const demoTicket = {
          id: Math.floor(100000 + Math.random() * 900000), // Random 6-digit number
          isUsed: false,
          eventId: Number(id),
          event: {
            ...event,
            id: Number(id),
            // Convert BigInt values to strings to avoid JSON serialization issues
            ticketPrice: typeof event.ticketPrice === 'bigint' ? event.ticketPrice.toString() : event.ticketPrice,
            startTime: typeof event.startTime === 'bigint' ? Number(event.startTime.toString()) : event.startTime,
            endTime: typeof event.endTime === 'bigint' ? Number(event.endTime.toString()) : event.endTime
          },
          purchasedAt: new Date().toISOString(),
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-TICKET-${id}-${Date.now()}`
        };
        
        // Helper function to safely serialize BigInt values in objects
        const serializeBigInt = (obj) => {
          return JSON.stringify(obj, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value
          );
        };
        
        // Save to localStorage for persistence
        const existingTickets = localStorage.getItem('demoTickets') 
          ? JSON.parse(localStorage.getItem('demoTickets')) 
          : [];
        
        const updatedTickets = [...existingTickets, demoTicket];
        localStorage.setItem('demoTickets', serializeBigInt(updatedTickets));
        
        // Simulate transaction delay
        setTimeout(() => {
          setBuyingTicket(false);
          
          // Update notification to success
          updateTransaction(demoTxId, {
            status: TX_STATUS.SUCCESS,
            message: 'DEMO: Ticket purchased successfully! View it in My Tickets section.',
            autoClose: true
          });
        }, 2000);
        
        return;
      }
      
      // Warn user about potential insufficient funds
      const confirmPurchase = window.confirm(
        `You are about to purchase a ticket for ${event.name} for ${ticketPriceInEth} ETH.\n\n` +
        `Make sure you have enough ETH in your wallet (${ticketPriceInEth} ETH for the ticket + extra for gas fees).\n\n` +
        `Would you like to continue?`
      );
      
      if (!confirmPurchase) return;
      
      // Set buying state
      setBuyingTicket(true);
      
      // Execute the transaction
      writeContract({
        args: [id],
        value: price
      });
    } catch (err) {
      console.error('Error initiating transaction:', err);
      setBuyingTicket(false);
      
      // Add notification for error
      addTransaction({
        status: TX_STATUS.ERROR,
        message: `Error: ${err.message}`,
        autoClose: false
      });
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
          
          {/* Ticket Preview Component */}
          {event.isActive && !isEventEnded() && (
            <TicketPreview event={event} />
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