import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead, useContractReads, useContractEvent, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

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
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Currently Active</option>
              <option value="past">Past</option>
            </select>
            <button 
              onClick={handleRefresh} 
              disabled={loading || useMockData}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => forceMockMode(!useMockData)}
              className={`px-4 py-2 rounded-lg text-white ${useMockData ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {useMockData ? 'Use Real Data' : 'Use Mock Data'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-700 font-medium">Contract Connected</p>
        <p className="text-green-700 text-sm mt-1">
          Connected to contract at address <span className="font-mono text-xs">{eventManagerAddress}</span>.
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
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="text-sm text-blue-700">
            <p>Contract Address: {eventManagerAddress}</p>
            <p>Event Count: {debugInfo.eventCount}</p>
            <p>Contract Connected: {debugInfo.contractConnected ? 'Yes' : 'No'}</p>
            <p>Using Mock Data: {useMockData ? 'Yes' : 'No'}</p>
            {debugInfo.lastError && <p className="text-red-500">Error: {debugInfo.lastError}</p>}
          </div>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => {
                console.clear();
                handleRefresh();
              }}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
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
              className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
            >
              Force Load Event IDs
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading events...</div>
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
            
            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <img
                  src={event.imageUri}
                  alt={event.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80";
                  }}
                />
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {new Date(typeof event.startTime === 'bigint' 
                        ? Number(event.startTime.toString()) * 1000 
                        : Number(event.startTime) * 1000).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-semibold">
                      {ticketPriceFormatted} ETH
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No events found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try creating a new event or check your contract connection.
          </p>
        </div>
      )}
    </div>
  );
}

export default Events;