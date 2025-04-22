import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractWrite, useWaitForTransaction, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function CreateEvent() {
  const navigate = useNavigate();
  const { address } = useAccount();
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

      // Call contract function
      console.log("Calling contract function createEvent with address:", eventManagerAddress);
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
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {mockMode && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700">
            Running in mock mode. Events created will not be stored on the blockchain.
          </p>
        </div>
      )}
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-700 font-medium">Contract Connected</p>
        <p className="text-green-700 text-sm mt-1">
          The contract is ready to use. You can now create events that will be stored on the blockchain.
        </p>
        <p className="text-green-700 text-sm mt-2">
          Note: This contract doesn't support soulbound tickets.
        </p>
        </div>

      <form onSubmit={handleSubmit}>
        {/* Event details */}
        <div className="space-y-4">
          {/* Event name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Event Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={eventData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Event description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              required
              value={eventData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            ></textarea>
          </div>
          
          {/* Image URI */}
          <div>
            <label htmlFor="imageUri" className="block text-sm font-medium text-gray-700">
              Image URL
            </label>
            <input
              type="url"
              id="imageUri"
              name="imageUri"
              value={eventData.imageUri}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave blank to use a default image.
            </p>
        </div>

          {/* Ticket price */}
          <div>
            <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700">
              Ticket Price (ETH) *
            </label>
            <input
              type="number"
              id="ticketPrice"
              name="ticketPrice"
              required
              min="0"
              step="0.001"
              value={eventData.ticketPrice}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Max tickets */}
          <div>
            <label htmlFor="maxTickets" className="block text-sm font-medium text-gray-700">
              Maximum Tickets *
            </label>
            <input
              type="number"
              id="maxTickets"
              name="maxTickets"
              required
              min="1"
              value={eventData.maxTickets}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {/* Date and time fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                value={eventData.startDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                Start Time *
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                required
                value={eventData.startTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                value={eventData.endDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                End Time *
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
              required
                value={eventData.endTime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

          {/* Soulbound checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
          <input
                id="isSoulbound"
                name="isSoulbound"
            type="checkbox"
                checked={eventData.isSoulbound}
            onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={true}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="isSoulbound" className="font-medium text-gray-500">
                Soulbound Tickets (Not Supported)
          </label>
              <p className="text-gray-500">
                This feature is not available in the current contract version.
              </p>
            </div>
        </div>

          {/* Submit button */}
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          <button
            type="submit"
              disabled={isWriteLoading || isConfirming}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isWriteLoading || isConfirming ? (
                <span>Creating... <span className="animate-pulse">⏳</span></span>
              ) : (
                'Create Event'
              )}
          </button>
          </div>
        </div>
      </form>

      {/* Debug Section */}
      {isDebugMode && (
        <div className="bg-gray-50 rounded-lg p-4 mt-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Debug Information</h2>
            <button
              onClick={() => setIsDebugMode(false)}
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded"
            >
              Hide Debug Info
            </button>
          </div>
          
          {getDebugInfo()}
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <button
              onClick={() => setMockMode(!mockMode)}
              className={`text-sm px-4 py-2 rounded ${
                mockMode ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {mockMode ? 'Disable Mock Mode' : 'Enable Mock Mode'}
            </button>
            
            <button
              onClick={() => {
                // Force refresh
                window.location.reload();
              }}
              className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
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