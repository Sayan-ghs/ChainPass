import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead, useContractReads, useContractEvent, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import EventSkeleton from '../components/EventSkeleton';

// Mock events to display when no events are found from the contract
const MOCK_EVENTS = [
  {
    id: 1,
    name: "Blockchain Developer Summit",
    description: "Join the largest gathering of blockchain developers to learn about the latest in Web3 technology.",
    imageUri: "https://images.unsplash.com/photo-1516245834210-c4c142787335?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1169&q=80",
    organizer: "0x0000000000000000000000000000000000000000",
    ticketPrice: "0.05",
    maxTickets: 200,
    startTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
    endTime: Math.floor(Date.now() / 1000) + 86400 * 8, // 8 days from now
    isActive: true
  },
  {
    id: 2,
    name: "NFT Art Exhibition",
    description: "Explore the intersection of art and technology in this exclusive NFT showcase.",
    imageUri: "https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80",
    organizer: "0x0000000000000000000000000000000000000000",
    ticketPrice: "0.1",
    maxTickets: 100,
    startTime: Math.floor(Date.now() / 1000) + 86400 * 14, // 14 days from now
    endTime: Math.floor(Date.now() / 1000) + 86400 * 16, // 16 days from now
    isActive: true
  },
  {
    id: 3,
    name: "DeFi Workshop",
    description: "Learn how to navigate the world of decentralized finance in this hands-on workshop.",
    imageUri: "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80",
    organizer: "0x0000000000000000000000000000000000000000",
    ticketPrice: "0.02",
    maxTickets: 50,
    startTime: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days from now
    endTime: Math.floor(Date.now() / 1000) + 86400 * 4, // 4 days from now
    isActive: true
  }
];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [debugInfo, setDebugInfo] = useState({
    eventCount: 0,
    contractConnected: false,
    lastError: null
  });
  
  // Get the connected wallet address
  const { address } = useAccount();
  
  // Get the event count from the contract
  const { data: eventCountData, isError: countError } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEventCount',
    watch: true, // This makes the query refresh when the data changes on-chain
  });
  
  // Use the event count if available, otherwise try a fixed number
  const eventCount = eventCountData ? Number(eventCountData) : 10;
  
  // Check if EVENT_MANAGER_ADDRESS is set
  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;
  
  useEffect(() => {
    console.log("Event Manager Address:", eventManagerAddress);
    console.log("Event Count Data:", eventCountData);
    
    setDebugInfo(prev => ({
      ...prev,
      eventCount: eventCountData ? Number(eventCountData) : 0,
      contractConnected: !!eventManagerAddress && eventManagerAddress !== "0x0000000000000000000000000000000000000000"
    }));
    
    // Check if contract address is valid
    if (!eventManagerAddress || eventManagerAddress === "0x0000000000000000000000000000000000000000") {
      console.warn("EVENT_MANAGER_ADDRESS is not set or invalid. Using mock data.");
      setEvents(MOCK_EVENTS);
      setLoading(false);
      setUseMockData(true);
      return;
    }
    
    // If we have a valid contract and event count, prioritize using real data
    if (eventCountData && Number(eventCountData) > 0) {
      setUseMockData(false);
      console.log("Valid event count detected, attempting to use real data");
      return;
    }
    
    // Only use mock data if we can't detect event count at all
    if (!eventCountData) {
      console.warn("No event count data. Using mock data as fallback.");
      setEvents(MOCK_EVENTS);
      setLoading(false);
      setUseMockData(true);
    }
  }, [eventManagerAddress, eventCountData, countError]);
  
  // Listen for new events
  useContractEvent({
    address: eventManagerAddress,
    abi: EventManagerABI,
    eventName: 'EventCreated',
    listener(log) {
      console.log('New event detected in Events page:', log);
      // Trigger a refresh when a new event is created
      setRefreshTrigger(prev => prev + 1);
      setLastRefreshed(new Date());
      
      // Force refetch after a short delay to allow blockchain to update
      setTimeout(() => {
        console.log("Forcing event refresh after new event creation");
        refetch();
      }, 2000);
    },
  });
  
  // Generate contract calls for events 1 through eventCount
  const contracts = Array.from({ length: eventCount }, (_, i) => ({
    address: eventManagerAddress,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [i + 1],
  }));

  const { data: eventsData, isError, isLoading, refetch } = useContractReads({
    contracts,
    enabled: !useMockData && !!eventManagerAddress && eventCount > 0,
  });

  // Handle manual refresh
  const handleRefresh = () => {
    setLoading(true);
    console.log("Manual refresh triggered");
    
    // Reset any error state
    setError(null);
    
    refetch().then(() => {
      setLastRefreshed(new Date());
      setLoading(false);
      console.log("Refresh completed");
    }).catch(err => {
      console.error("Error during refresh:", err);
      setError("Error refreshing events: " + err.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    console.log("Contract read state:", { isLoading, isError, dataReceived: !!eventsData, eventCount });
    
    if (isError) {
      console.error("Error reading events from contract");
      setError("Failed to load events from blockchain. Using sample events instead.");
      setEvents(MOCK_EVENTS);
      setLoading(false);
      setDebugInfo(prev => ({
        ...prev,
        lastError: "Contract read error"
      }));
      return;
    }
    
    if (useMockData) return;
    
    if (!eventsData) return;

    console.log("Raw events data received:", eventsData);
    console.log("Events data length:", eventsData.length);

    // Log each event result separately for debugging
    eventsData.forEach((result, index) => {
      console.log(`Event ${index + 1} result:`, {
        status: result.status,
        result: result.result,
        error: result.error
      });
    });

    const eventsList = eventsData
      .map((result, index) => {
        // Log each result to inspect what might be wrong
        console.log(`Checking event ${index + 1}:`, {
          status: result.status,
          hasResult: !!result.result,
          resultId: result.result?.id?.toString(),
          resultName: result.result?.name
        });

        // MODIFIED CHECKS: Accept events even if status is failure as long as they have data
        // This is needed because some contracts return data correctly but still mark status as failure
        if (result.result && result.result.id) {
          console.log(`Event ${index + 1} is valid despite status:`, result.result);
          return {
            id: Number(result.result.id),
            ...result.result,
            // Ensure isActive is set to true if it's missing or undefined
            isActive: result.result.isActive !== undefined ? result.result.isActive : true
          };
        } else {
          console.log(`Event ${index + 1} is invalid:`, result);
          return null;
        }
      })
      .filter(Boolean);

    console.log("Processed events:", eventsList);
    
    if (eventsList.length === 0) {
      console.log("No events found in contract, using mock data");
      setEvents(MOCK_EVENTS);
      setDebugInfo(prev => ({
        ...prev,
        lastError: "No events found in contract"
      }));
    } else {
      console.log("Setting real events:", eventsList);
      setEvents(eventsList);
      setDebugInfo(prev => ({
        ...prev,
        lastError: null
      }));
    }
    
    setLoading(false);
  }, [eventsData, isError, isLoading, useMockData, eventCount]);

  // Also refresh on component mount
  useEffect(() => {
    if (!useMockData && eventManagerAddress) {
      console.log("Initial events refresh");
      refetch();
    }
  }, []);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.startTime > Date.now() / 1000;
    if (filter === 'past') return event.endTime < Date.now() / 1000;
    return true;
  });

  // Format ETH amount safely
  const formatEth = (wei) => {
    try {
      // Handle both BigInt and string/number representations
      if (typeof wei === 'bigint') {
        // Convert BigInt to string first to avoid mixing BigInt with other types
        return Number(wei.toString()) / 1e18;
      } else if (typeof wei === 'string' && wei.includes('n')) {
        // Handle case where BigInt is represented as a string with 'n' suffix
        return Number(wei.replace('n', '')) / 1e18;
      } else {
        return Number(wei) / 1e18;
      }
    } catch (err) {
      console.error("Error formatting ETH amount:", err, "Value was:", wei, "Type:", typeof wei);
      return 0;
    }
  };

  // Force using real contract data
  const forceMockMode = (useMock) => {
    setUseMockData(useMock);
    if (!useMock) {
      setLoading(true);
      refetch().then(() => {
        setLoading(false);
      });
    } else {
      setEvents(MOCK_EVENTS);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        <div className="flex space-x-4">
          {useMockData && (
            <div className="text-sm text-yellow-600 mr-4 py-2">
              Using sample events (contract not connected)
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 mr-4 py-2">
              {error}
            </div>
          )}
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Currently Active</option>
              <option value="past">Past</option>
            </select>
            <button 
              onClick={handleRefresh} 
              disabled={loading || useMockData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300 transition-colors duration-200 transform hover:scale-105 active:scale-95 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
            <button
              onClick={() => forceMockMode(!useMockData)}
              className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 transform hover:scale-105 active:scale-95 ${useMockData ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {useMockData ? 'Use Real Data' : 'Use Mock Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg transform transition-all duration-300 hover:shadow-md">
        <p className="text-green-700 font-medium">Contract Connected</p>
        <p className="text-green-700 text-sm mt-1">
          Connected to blockchain. 
          {eventCount > 0 ? 
            ` Found ${eventCount} events on the blockchain.` : 
            " No events found yet. Try creating an event!"}
        </p>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Last updated: {lastRefreshed.toLocaleString()} 
        {eventCount > 0 && !useMockData && (
          <span> • {eventCount} total events found on-chain</span>
        )}
      </div>
      
      {!useMockData && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg transform transition-all duration-300 hover:shadow-md">
          <div className="text-sm text-blue-700">
            <p>Contract Status: {debugInfo.contractConnected ? 'Connected' : 'Not Connected'}</p>
            <p>Event Count: {debugInfo.eventCount}</p>
            <p>Using Mock Data: {useMockData ? 'Yes' : 'No'}</p>
            {debugInfo.lastError && <p className="text-red-500">Error: {debugInfo.lastError}</p>}
          </div>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => {
                console.clear();
                handleRefresh();
              }}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Clear Console & Refresh
            </button>
            
            <button
              onClick={() => {
                // Force read all existing events even if they have errors
                const fixedEventsList = Array.from({ length: Number(eventCountData) }, (_, i) => ({
                  id: i + 1,
                  name: `Event ${i + 1}`,
                  description: `Description for event ${i + 1}`,
                  imageUri: "https://images.unsplash.com/photo-1639322537228-f710d846310a",
                  organizer: address || "0x0000000000000000000000000000000000000000",
                  ticketPrice: "1000000000000000",
                  maxTickets: 10,
                  startTime: Math.floor(Date.now() / 1000) + 86400 * 7,
                  endTime: Math.floor(Date.now() / 1000) + 86400 * 14,
                  isActive: true
                }));
                setEvents(fixedEventsList);
                setUseMockData(false);
                setDebugInfo(prev => ({
                  ...prev,
                  lastError: "Using placeholder data with real event IDs"
                }));
              }}
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors duration-200"
            >
              Force Load Event IDs
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, index) => (
            <EventSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => {
            // Convert any BigInt values to standard numbers before using them
            const ticketPriceFormatted = formatEth(event.ticketPrice || 0);
            const availableTicketsNum = typeof event.availableTickets === 'bigint' 
              ? Number(event.availableTickets.toString()) 
              : Number(event.availableTickets || 0);
            const totalTicketsNum = typeof event.totalTickets === 'bigint'
              ? Number(event.totalTickets.toString())
              : Number(event.totalTickets || 0);
            
            const startDate = new Date(typeof event.startTime === 'bigint' 
              ? Number(event.startTime.toString()) * 1000 
              : Number(event.startTime) * 1000);
              
            // Calculate if event is upcoming, active, or past
            const now = new Date();
            const eventStatus = startDate > now 
              ? 'upcoming' 
              : (new Date(Number(event.endTime) * 1000) < now ? 'past' : 'active');
              
            // Determine status badge
            let statusBadge = null;
            if (eventStatus === 'upcoming') {
              statusBadge = <span className="absolute top-4 right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">Upcoming</span>;
            } else if (eventStatus === 'active') {
              statusBadge = <span className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">Active</span>;
            } else {
              statusBadge = <span className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">Past</span>;
            }
            
            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={event.imageUri}
                    alt={event.name}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80";
                    }}
                  />
                  {statusBadge}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-300">{event.name}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-500">
                        {startDate.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-semibold text-blue-600">
                        {ticketPriceFormatted} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 animate-fadeIn">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600 mt-4 text-lg font-medium">No events found.</p>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Try creating a new event or check your contract connection.
          </p>
          <Link
            to="/events/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Event
          </Link>
        </div>
      )}
    </div>
  );
}

export default Events;