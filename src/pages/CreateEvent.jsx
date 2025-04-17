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
  const [success, setSuccess] = useState('');
  const [contractEnabled, setContractEnabled] = useState(true);
  const [mockMode, setMockMode] = useState(false);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [showGasInfo, setShowGasInfo] = useState(false);

  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;

  useEffect(() => {
    // Check if contract address is valid
    if (!eventManagerAddress || eventManagerAddress === "0x0000000000000000000000000000000000000000") {
      console.warn("EVENT_MANAGER_ADDRESS is not set. Using mock mode.");
      setContractEnabled(false);
      setMockMode(true);
    }

    // Check for past transaction failures in localStorage
    const checkPastFailures = () => {
      try {
        const failureCount = localStorage.getItem('eventCreationFailures') || 0;
        if (parseInt(failureCount) > 2) {
          setMockMode(true);
          console.log("Auto-enabling mock mode due to past transaction failures");
        }
      } catch (e) {
        console.error("Error checking local storage:", e);
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
  }, [eventManagerAddress]);

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
    enabled: !!writeData?.hash
  });

  // Show success message when transaction is mined
  useEffect(() => {
    if (isSuccess) {
      setSuccess('Event created successfully!');
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

    try {
      // Convert values to appropriate formats
      const startTimestamp = getUnixTimestamp(eventData.startDate, eventData.startTime);
      const endTimestamp = getUnixTimestamp(eventData.endDate, eventData.endTime);
      const ticketPriceWei = BigInt(parseFloat(eventData.ticketPrice) * 1e18);
      const maxTickets = parseInt(eventData.maxTickets);

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

      // Call contract function
      write({
        args: [
          eventData.name,
          eventData.description,
          eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
          ticketPriceWei,
          maxTickets,
          BigInt(startTimestamp),
          BigInt(endTimestamp),
          eventData.isSoulbound
        ]
      });
    } catch (err) {
      console.error('Form validation error:', err);
      setError('Error creating event: ' + err.message);
      setMockMode(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Create Event</h1>
      
      <div className="mb-6 flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h3 className="font-medium">Having trouble with transactions?</h3>
          <p className="text-sm text-gray-600">Toggle mock mode to test without blockchain interactions</p>
        </div>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={getGasEstimate}
            className="px-4 py-2 rounded-lg text-white font-medium bg-gray-500 hover:bg-gray-600"
          >
            Gas Info
          </button>
          <button
            type="button"
            onClick={() => setMockMode(!mockMode)}
            className={`px-4 py-2 rounded-lg text-white font-medium ${
              mockMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {mockMode ? 'Disable Mock Mode' : 'Enable Mock Mode'}
          </button>
        </div>
      </div>

      {showGasInfo && gasEstimate && (
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4">
          <div className="flex justify-between">
            <h3 className="font-medium text-blue-800">Gas Estimate for Event Creation</h3>
            <button 
              onClick={() => setShowGasInfo(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm text-blue-700">Estimated Gas: {gasEstimate.estimatedGas}</p>
          <p className="text-sm text-blue-700">Estimated Cost: {gasEstimate.estimatedCost}</p>
          <p className="mt-2 text-sm text-blue-600">{gasEstimate.explanation}</p>
        </div>
      )}
      
      {mockMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Note:</strong> Contract connection is unavailable. This will create a sample event (no blockchain transaction).
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
          {error.includes("reverted") && (
            <div className="text-sm mt-2 text-red-600">
              <p className="font-medium mb-1">This error could be due to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Insufficient ETH in your wallet for gas fees (most common cause)</li>
                <li>Contract deployment failure due to network congestion</li>
                <li>Invalid input parameters</li>
              </ul>
              <p className="mt-2 font-medium">Recommended solutions:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Get more Base Sepolia testnet ETH from <a href="https://www.coinbase.com/faucets/base-sepolia-faucet" target="_blank" rel="noopener noreferrer" className="underline">Base Sepolia Faucet</a></li>
                <li>Try using mock mode to test your form without blockchain transactions</li>
                <li>Try again later when the network is less congested</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Name */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Event Name</label>
            <input
              type="text"
              name="name"
              value={eventData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={eventData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your event"
              rows="4"
              required
            ></textarea>
          </div>

          {/* Image URI */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 font-medium mb-2">Image URL</label>
            <input
              type="url"
              name="imageUri"
              value={eventData.imageUri}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg (optional)"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to use a default image</p>
          </div>

          {/* Ticket Price */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Ticket Price (ETH)</label>
            <input
              type="number"
              name="ticketPrice"
              value={eventData.ticketPrice}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.01"
              step="0.001"
              min="0.001"
              required
            />
          </div>

          {/* Max Tickets */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Maximum Tickets</label>
            <input
              type="number"
              name="maxTickets"
              value={eventData.maxTickets}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
              min="1"
              required
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={eventData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={eventData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={eventData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={eventData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Soulbound */}
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isSoulbound"
                checked={eventData.isSoulbound}
                onChange={handleChange}
                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">
                Make tickets non-transferable (soulbound)
              </span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="px-6 py-2 mr-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200 ${
              isWriteLoading || isConfirming
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            disabled={isWriteLoading || isConfirming}
          >
            {isWriteLoading || isConfirming ? 'Creating...' : 'Create Event'}
          </button>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-medium">Tips for successful event creation:</h3>
          <ul className="text-sm text-blue-700 mt-2 list-disc pl-5">
            <li>Make sure you have enough ETH in your wallet to cover gas fees</li>
            <li>Event creation creates two new smart contracts, which requires more gas than regular transactions</li>
            <li>All fields must be valid, including ticket price (must be greater than 0)</li>
            <li>Wait for transaction confirmation, which may take a few moments</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

export default CreateEvent; 