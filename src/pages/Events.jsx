import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead, useContractReads, useContractEvent } from 'wagmi';
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
  
  // Get the event count from the contract
  const { data: eventCountData } = useContractRead({
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
    if (!eventManagerAddress || eventManagerAddress === "0x0000000000000000000000000000000000000000") {
      console.warn("EVENT_MANAGER_ADDRESS is not set or invalid. Using mock data.");
      setEvents(MOCK_EVENTS);
      setLoading(false);
      setUseMockData(true);
      return;
    }
  }, [eventManagerAddress]);
  
  // Listen for new events
  useContractEvent({
    address: eventManagerAddress,
    abi: EventManagerABI,
    eventName: 'EventCreated',
    listener() {
      // Trigger a refresh when a new event is created
      setRefreshTrigger(prev => prev + 1);
      setLastRefreshed(new Date());
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
    refetch().then(() => {
      setLastRefreshed(new Date());
      setLoading(false);
    });
  };

  useEffect(() => {
    console.log("Contract read state:", { isLoading, isError, dataReceived: !!eventsData });
    
    if (isError) {
      console.error("Error reading events from contract");
      setError("Failed to load events from blockchain. Using sample events instead.");
      setEvents(MOCK_EVENTS);
      setLoading(false);
      return;
    }
    
    if (useMockData) return;
    
    if (!eventsData) return;

    console.log("Events data received:", eventsData);

    const eventsList = eventsData
      .map((result, index) => {
        // Only include successful reads where the event exists
        if (result.status === 'success' && result.result && 
            result.result.id && result.result.id.toString() !== '0' && 
            result.result.name && result.result.name.length > 0) {
          return {
            id: index + 1,
            ...result.result,
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log("Processed events:", eventsList);
    
    if (eventsList.length === 0) {
      console.log("No events found in contract, using mock data");
      setEvents(MOCK_EVENTS);
    } else {
      setEvents(eventsList);
    }
    
    setLoading(false);
  }, [eventsData, isError, isLoading, useMockData]);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.startTime > Date.now() / 1000;
    if (filter === 'past') return event.endTime < Date.now() / 1000;
    return true;
  });

  // Format ETH amount safely
  const formatEth = (wei) => {
    try {
      return Number(wei) / 1e18;
    } catch (err) {
      return 0;
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
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Last updated: {lastRefreshed.toLocaleString()} 
        {eventCount > 0 && !useMockData && (
          <span> • {eventCount} total events found on-chain</span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
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
                    {new Date(event.startTime * 1000).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-semibold">
                    {formatEth(event.ticketPrice)} ETH
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No events found.</p>
        </div>
      )}
    </div>
  );
}

// Helper function to determine event status and appropriate badge
function getEventStatus(event) {
  const now = Math.floor(Date.now() / 1000);
  
  if (!event.isActive) {
    return { badge: 'Inactive', color: 'bg-gray-500 text-white' };
  }
  
  if (event.startTime > now) {
    const daysToGo = Math.ceil((event.startTime - now) / 86400);
    if (daysToGo <= 3) {
      return { badge: 'Soon', color: 'bg-yellow-500 text-white' };
    }
    return { badge: 'Upcoming', color: 'bg-blue-500 text-white' };
  }
  
  if (event.endTime < now) {
    return { badge: 'Ended', color: 'bg-red-500 text-white' };
  }
  
  return { badge: 'Live', color: 'bg-green-500 text-white' };
}

export default Events; 