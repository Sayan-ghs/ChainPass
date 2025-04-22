import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { useTransactions, TX_STATUS } from '../contexts/TransactionContext';

function CreateEvent() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { addTransaction, updateTransaction } = useTransactions();
  const [currentTxId, setCurrentTxId] = useState(null);
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    imageUri: '',
    ticketPrice: '0.01',
    maxTickets: '100',
    startDate: '',
    startTime: '12:00',
    endDate: '',
    endTime: '20:00',
    isSoulbound: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contractEnabled, setContractEnabled] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [showGasInfo, setShowGasInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    contractAddress: '',
    walletConnected: false,
    walletAddress: '',
    isMockMode: false,
    contractConnected: false
  });
  const [isDebugMode, setIsDebugMode] = useState(true);

  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;

  useEffect(() => {
    console.log("CreateEvent - Contract address:", eventManagerAddress);
    console.log("CreateEvent - Wallet address:", address);
    
    setDebugInfo({
      contractAddress: eventManagerAddress || 'Not set',
      walletConnected: !!address,
      walletAddress: address || 'Not connected',
      isMockMode: !eventManagerAddress || eventManagerAddress === "0x0000000000000000000000000000000000000000",
      contractConnected: !!eventManagerAddress && eventManagerAddress !== "0x0000000000000000000000000000000000000000"
    });
    
    // Check if contract address is valid
    if (!eventManagerAddress || eventManagerAddress === "0x0000000000000000000000000000000000000000") {
      console.warn("EVENT_MANAGER_ADDRESS is not set. Using mock mode.");
      setContractEnabled(false);
      setMockMode(true);
      return;
    }

    // Contract is valid, use real mode
    console.log("Contract address is valid, using real mode");
    setMockMode(false);
    setContractEnabled(true);
    
    // Check for past transaction failures in localStorage
    const checkPastFailures = () => {
      try {
        // Reset failure count since we've fixed the ABI
        localStorage.setItem('eventCreationFailures', '0');
      } catch (e) {
        console.error("Error updating local storage:", e);
      }
    };
    
    checkPastFailures();

    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    setEventData(prev => ({
      ...prev,
      startDate: formatDate(tomorrow),
      endDate: formatDate(nextWeek)
    }));
  }, [eventManagerAddress, address]);

  // Format date for input fields
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate Unix timestamp from date and time
  const getUnixTimestamp = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return Math.floor(new Date(year, month - 1, day, hours, minutes).getTime() / 1000);
  };

  // Contract write for creating events
  const { data: writeData, write, isLoading: isWriteLoading, isError: isWriteError, error: writeError } = useContractWrite({
    address: eventManagerAddress,
    abi: EventManagerABI,
    functionName: 'createEvent',
    enabled: contractEnabled
  });

  // Wait for transaction to be mined
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: writeData?.hash,
    enabled: !!writeData?.hash,
    onSuccess(data) {
      console.log("Transaction confirmed:", data);
      console.log("Transaction hash:", writeData?.hash);
      
      // Update transaction notification
      if (currentTxId) {
        updateTransaction(currentTxId, {
          status: TX_STATUS.SUCCESS,
          message: `Event "${eventData.name}" created successfully!`,
          autoClose: true
        });
      }
    },
    onError(error) {
      console.error("Transaction confirmation error:", error);
      
      // Update transaction notification
      if (currentTxId) {
        updateTransaction(currentTxId, {
          status: TX_STATUS.ERROR,
          message: `Failed to create event: ${error.message}`,
          autoClose: false
        });
      }
    }
  });

  // Show success message when transaction is mined
  useEffect(() => {
    if (isSuccess) {
      console.log("Event creation transaction successful!");
      setSuccess('Event created successfully!');
      
      // Clear any past failure records
      try {
        localStorage.setItem('eventCreationFailures', '0');
      } catch (e) {
        console.error("Error updating local storage:", e);
      }
      
      setTimeout(() => {
        navigate('/events');
      }, 2000);
    }
  }, [isSuccess, navigate]);

  // Show error message when write fails
  useEffect(() => {
    if (isWriteError && writeError) {
      console.error('Contract error:', writeError);
      setError('Failed to create event: ' + writeError.message);
      
      // Record failure in localStorage to suggest mock mode next time
      try {
        const failureCount = parseInt(localStorage.getItem('eventCreationFailures') || 0);
        localStorage.setItem('eventCreationFailures', failureCount + 1);
      } catch (e) {
        console.error("Error updating local storage:", e);
      }
      
      // Fall back to mock mode if contract interaction fails
      setMockMode(true);
    }
  }, [isWriteError, writeError]);

  // Estimate gas for contract creation (in a real app, this would query the network)
  const getGasEstimate = () => {
    // Since creating an event deploys two contracts, the gas estimate is substantial
    // This is a rough estimate based on typical contract deployment costs
    setGasEstimate({
      estimatedGas: "~1,000,000 gas units",
      estimatedCost: "~0.01-0.02 ETH",
      explanation: "Creating an event requires deploying two smart contracts (TicketNFT and CheckInManager), which needs significantly more gas than regular transactions."
    });
    setShowGasInfo(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log("Form submitted - creating event");
    
    // Always show debug panel
    setShowGasInfo(true);

    // Double-check wallet connection
    if (!address) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    try {
      // Convert values to appropriate formats
      const startTimestamp = getUnixTimestamp(eventData.startDate, eventData.startTime);
      const endTimestamp = getUnixTimestamp(eventData.endDate, eventData.endTime);
      
      // More user-friendly ticket price handling
      let ticketPriceValue = parseFloat(eventData.ticketPrice);
      if (isNaN(ticketPriceValue) || ticketPriceValue <= 0) {
        setError('Please enter a valid ticket price greater than 0');
        return;
      }
      
      // Format with standard precision to avoid floating point errors
      const ticketPriceWei = BigInt(Math.floor(ticketPriceValue * 1e18));
      
      // Use a reasonable minimum for max tickets (at least 5)
      const maxTickets = Math.max(5, parseInt(eventData.maxTickets) || 5);

      console.log("Event parameters:", {
        name: eventData.name,
        description: eventData.description,
        imageUri: eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
        ticketPrice: ticketPriceWei.toString(),
        maxTickets,
        startTime: startTimestamp,
        endTime: endTimestamp,
        isSoulbound: eventData.isSoulbound
      });

      // Validate dates
      if (startTimestamp >= endTimestamp) {
        setError('End time must be after start time');
        return;
      }

      if (startTimestamp < Math.floor(Date.now() / 1000)) {
        setError('Start time must be in the future');
        return;
      }

      // Validate ticket price
      if (parseFloat(eventData.ticketPrice) <= 0) {
        setError('Ticket price must be greater than 0');
        return;
      }

      if (mockMode) {
        // Mock event creation (no blockchain interaction)
        console.log('Creating mock event:', {
          name: eventData.name,
          description: eventData.description,
          imageUri: eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
          ticketPrice: eventData.ticketPrice,
          maxTickets,
          startTime: startTimestamp,
          endTime: endTimestamp,
          isSoulbound: eventData.isSoulbound
        });

        // Simulate success after a delay
        setSuccess('Creating event (simulation)...');
        setTimeout(() => {
          setSuccess('Event created successfully!');
          setTimeout(() => {
            navigate('/events');
          }, 2000);
        }, 1500);
        return;
      }

      // Show gas info
      getGasEstimate();

      // Verify contract is enabled
      if (!contractEnabled) {
        console.error("Contract is not enabled");
        setError("Contract interaction is disabled. Please check your wallet connection and refresh.");
        return;
      }

      // Check if write function is available
      if (!write) {
        console.error("Write function not available");
        setError("Contract write function is not available. Please check your connection.");
        return;
      }

      console.log("Writing to contract with data:", {
        name: eventData.name,
        description: eventData.description,
        imageUri: eventData.imageUri,
        ticketPriceWei: ticketPriceWei.toString(),
        maxTickets,
        startTimestamp,
        endTimestamp
      });
      
      // Create a transaction notification
      const txId = addTransaction({
        status: TX_STATUS.PENDING,
        message: `Creating event "${eventData.name}"...`,
        autoClose: false
      });
      
      // Save the transaction ID for updates
      setCurrentTxId(txId);

      // Execute the contract call
      write({
        args: [
          eventData.name,
          eventData.description,
          eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
          ticketPriceWei,
          BigInt(maxTickets),
          BigInt(startTimestamp),
          BigInt(endTimestamp)
        ],
        // Add gas limit to avoid out-of-gas errors
        gas: BigInt(2000000)
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError('Error creating event: ' + err.message);
      
      // Add error notification
      addTransaction({
        status: TX_STATUS.ERROR,
        message: `Error: ${err.message}`,
        autoClose: false
      });
    }
  };

  // Debugging info in the modal
  const getDebugInfo = () => {
    return (
      <>
        <p className="text-sm text-gray-500 mt-2">Debug Information:</p>
        <div className="text-xs text-gray-400 mt-1 font-mono bg-gray-100 p-2 rounded">
          <p>Using mock mode: {mockMode ? 'Yes' : 'No'}</p>
          <p>Contract connected: {debugInfo.contractConnected ? 'Yes' : 'No'}</p>
          <p>Wallet connected: {debugInfo.walletConnected ? 'Yes' : 'No'}</p>
        </div>
        <div className="mt-2">
          <a 
            href={`https://sepolia.basescan.org`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline"
          >
            View contract on BaseScan
          </a>
        </div>
      </>
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-3xl font-bold mb-2 text-gray-800 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Create New Event</h1>
      <p className="text-gray-500 mb-8">Fill in the details below to create your blockchain-powered event</p>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md transition-all duration-300 animate-fadeIn">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md transition-all duration-300 animate-fadeIn">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{success}</p>
            </div>
          </div>
        </div>
      )}

      {mockMode && (
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-md transition-all duration-300 animate-fadeIn">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-purple-700 font-medium">Demo Mode Active</p>
              <p className="text-xs text-purple-600 mt-1">
                Events created will be simulated without blockchain transactions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-md transition-all duration-300 animate-fadeIn shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700 font-medium">Ready to Create</p>
            <p className="text-xs text-blue-600 mt-1">
              Your event will be published to the blockchain and tickets will be available for purchase immediately.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Basic Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Event Information</h2>
          <div className="space-y-4">
            {/* Event name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={eventData.name}
                onChange={handleChange}
                placeholder="Enter a catchy event name"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
              />
            </div>

            {/* Event description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="3"
                required
                value={eventData.description}
                onChange={handleChange}
                placeholder="Describe your event, what attendees can expect, and any other important details"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
              ></textarea>
            </div>
            
            {/* Image URI */}
            <div>
              <label htmlFor="imageUri" className="block text-sm font-medium text-gray-700 mb-1">
                Event Image URL
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  URL
                </span>
                <input
                  type="url"
                  id="imageUri"
                  name="imageUri"
                  value={eventData.imageUri}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Add an image URL to make your event stand out. If left blank, a default image will be used.
              </p>
            </div>
          </div>
        </div>

        {/* Ticket Information Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Ticket Settings</h2>
          <div className="space-y-4">
            {/* Ticket price */}
            <div>
              <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Price (ETH) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">Ξ</span>
                </div>
                <input
                  type="number"
                  id="ticketPrice"
                  name="ticketPrice"
                  required
                  min="0"
                  step="0.001"
                  value={eventData.ticketPrice}
                  onChange={handleChange}
                  placeholder="0.01"
                  className="block w-full pl-10 rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
              {parseFloat(eventData.ticketPrice) > 0.1 && (
                <p className="mt-1 text-xs text-yellow-600">
                  Setting a high ticket price may reduce attendance. Consider the value proposition for attendees.
                </p>
              )}
            </div>

            {/* Max tickets */}
            <div>
              <label htmlFor="maxTickets" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Tickets <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="maxTickets"
                  name="maxTickets"
                  required
                  min="1"
                  value={eventData.maxTickets}
                  onChange={handleChange}
                  placeholder="100"
                  className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-500 sm:text-sm">tickets</span>
                </div>
              </div>
              {parseInt(eventData.maxTickets) > 500 && (
                <p className="mt-1 text-xs text-blue-600">
                  Large ticket pool! Make sure you're prepared for a big audience.
                </p>
              )}
            </div>
            
            {/* Soulbound toggle (disabled) */}
            <div className="bg-gray-100 p-3 rounded-md opacity-75">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isSoulbound"
                    name="isSoulbound"
                    type="checkbox"
                    checked={eventData.isSoulbound}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 opacity-50"
                    disabled={true}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isSoulbound" className="font-medium text-gray-500">
                    Soulbound Tickets (Coming Soon)
                  </label>
                  <p className="text-gray-500 text-xs mt-1">
                    Non-transferable tickets that can only be used by the original purchaser.
                    This feature will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        {/* Date and Time Section */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Event Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Start</h3>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  value={eventData.startDate}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  required
                  value={eventData.startTime}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">End</h3>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  required
                  value={eventData.endDate}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  required
                  value={eventData.endTime}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200"
                />
              </div>
            </div>
          </div>
          {/* Duration visualization */}
          <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Event Duration</p>
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {eventData.startDate} {eventData.startTime}
              </div>
              <div className="flex-1 h-1 bg-blue-100 relative">
                <div className="absolute inset-0 bg-blue-500 bg-opacity-50"></div>
              </div>
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {eventData.endDate} {eventData.endTime}
              </div>
            </div>
          </div>
        </div>

        {/* Submit section */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
            </svg>
            Cancel & Return
          </button>
          
          <div className="w-full sm:w-auto flex space-x-3">
            {showGasInfo && gasEstimate && (
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded-md">
                Est. gas: {gasEstimate.estimatedGas}
              </div>
            )}
            <button
              type="submit"
              disabled={isWriteLoading || isConfirming}
              className="w-full sm:w-auto inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isWriteLoading || isConfirming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Event...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Event
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Debug Section */}
      {isDebugMode && (
        <div className="bg-gray-50 rounded-lg p-4 mt-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Developer Tools</h2>
            <button
              onClick={() => setIsDebugMode(false)}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded transition-colors duration-200"
            >
              Hide
            </button>
          </div>
          
          {getDebugInfo()}
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              onClick={() => setMockMode(!mockMode)}
              className={`text-sm px-4 py-2 rounded transition-colors duration-200 ${
                mockMode ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {mockMode ? 'Disable Mock Mode' : 'Enable Mock Mode'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateEvent; 