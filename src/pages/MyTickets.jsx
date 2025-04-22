import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useContractRead } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { readContract } from 'wagmi/actions';
import TicketNFTCard from '../components/TicketNFTCard';

// Demo tickets for development and testing
const DEMO_TICKETS = [
  {
    id: 123456,
    isUsed: false,
    eventId: 1,
    event: {
      id: 1,
      name: "Blockchain Developer Summit",
      description: "Join the largest gathering of blockchain developers to learn about the latest in Web3 technology.",
      imageUri: "https://images.unsplash.com/photo-1516245834210-c4c142787335?ixlib=rb-4.0.3&auto=format&fit=crop",
      organizer: "0x0000000000000000000000000000000000000000",
      ticketPrice: "50000000000000000", // 0.05 ETH
      startTime: Math.floor(Date.now() / 1000) + 86400 * 2, // 2 days from now
      endTime: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days from now
      isActive: true,
      maxTickets: 100,
      ticketsSold: 45
    },
    purchasedAt: new Date().toISOString(),
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-TICKET-123456"
  },
  {
    id: 789012,
    isUsed: false,
    eventId: 2,
    event: {
      id: 2,
      name: "NFT Art Exhibition",
      description: "Explore the intersection of art and technology in this exclusive NFT showcase.",
      imageUri: "https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?ixlib=rb-4.0.3&auto=format&fit=crop",
      organizer: "0x0000000000000000000000000000000000000000",
      ticketPrice: "100000000000000000", // 0.1 ETH
      startTime: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
      endTime: Math.floor(Date.now() / 1000) + 86400 * 6, // 6 days from now
      isActive: true,
      maxTickets: 50,
      ticketsSold: 22
    },
    purchasedAt: new Date(Date.now() - 86400 * 1000).toISOString(), // 1 day ago
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DEMO-TICKET-789012"
  }
];

function MyTickets() {
  const { address } = useAccount();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTickets, setDemoTickets] = useState([]);

  // Check if we should enable demo mode
  useEffect(() => {
    // Check URL params for demo mode
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    
    // Check local storage for demo ticket purchases
    const storedDemoTickets = localStorage.getItem('demoTickets');
    
    if (demoMode) {
      setIsDemoMode(true);
      console.log('DEMO MODE ENABLED - Using demo tickets');
      
      // Initialize with default demo tickets
      setDemoTickets(DEMO_TICKETS);
      
      // If there are stored demo tickets, merge them with default ones
      if (storedDemoTickets) {
        try {
          const parsedTickets = JSON.parse(storedDemoTickets);
          setDemoTickets(prevTickets => [...prevTickets, ...parsedTickets]);
        } catch (err) {
          console.error('Error parsing stored demo tickets:', err);
        }
      }
      
      setLoading(false);
    } else if (storedDemoTickets) {
      try {
        // Show stored demo tickets even if not in demo mode
        const parsedTickets = JSON.parse(storedDemoTickets);
        setDemoTickets(parsedTickets);
      } catch (err) {
        console.error('Error parsing stored demo tickets:', err);
      }
    }
  }, []);

  // Get event count instead of ticket count
  const { data: eventCount } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEventCount',
    enabled: !!address,
  });

  useEffect(() => {
    const fetchTickets = async () => {
      if (!eventCount || !address) return;
      
      try {
        setLoading(true);
        const ticketsList = [];
        
        // Iterate through all events and check if user has tickets
        for (let eventId = 1; eventId <= Number(eventCount); eventId++) {
          try {
            // Get event details
            const eventData = await readContract({
              address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
              abi: EventManagerABI,
              functionName: 'getEvent',
              args: [eventId],
            });
            
            // Skip events without a ticket contract address or with the zero address
            if (!eventData || 
                !eventData.ticketContract || 
                eventData.ticketContract === '0x0000000000000000000000000000000000000000') {
              continue;
            }
            
            // Check if user has a ticket for this event
            // We'll use a basic ERC721 balanceOf call to the ticket contract
            const TicketNFTABI = [
              {
                inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
                name: 'getTicketId',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
              },
              {
                inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
                name: 'isTicketValid',
                outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
                stateMutability: 'view',
                type: 'function',
              }
            ];
            
            try {
              // Check if user has any tickets for this event
              const balance = await readContract({
                address: eventData.ticketContract,
                abi: TicketNFTABI,
                functionName: 'balanceOf',
                args: [address],
              });
              
              if (Number(balance) > 0) {
                try {
                  // Get the ticket ID for this user
                  const ticketId = await readContract({
                    address: eventData.ticketContract,
                    abi: TicketNFTABI,
                    functionName: 'getTicketId',
                    args: [address],
                  });
                  
                  // Check if ticket is valid
                  const isValid = await readContract({
                    address: eventData.ticketContract,
                    abi: TicketNFTABI,
                    functionName: 'isTicketValid',
                    args: [ticketId],
                  }).catch(() => false);
                  
                  // Add ticket to list
                  ticketsList.push({
                    id: Number(ticketId),
                    isUsed: !isValid,
                    eventId: eventId,
                    event: eventData,
                  });
                } catch (err) {
                  console.warn(`Error getting ticket ID for event ${eventId}:`, err);
                  // Skip this ticket but continue processing others
                }
              }
            } catch (err) {
              console.warn(`Error checking balance for event ${eventId}:`, err);
              // Skip this ticket contract but continue checking others
            }
          } catch (err) {
            console.error(`Error fetching event ${eventId}:`, err);
            // Continue to next event
          }
        }
        
        setTickets(ticketsList);
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError('Failed to load tickets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (address && !isDemoMode) {
      fetchTickets();
    } else {
      // If in demo mode or no address, stop loading
      setLoading(false);
    }
  }, [eventCount, address, isDemoMode]);

  // Function to merge real tickets with demo tickets
  const getAllTickets = () => {
    return [...tickets, ...demoTickets.map(ticket => ({...ticket, isDemo: true}))];
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-700">Please connect your wallet to view your tickets</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading your tickets...</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My NFT Tickets</h1>
        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500">On</span>
          <div className="flex items-center bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
              <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM18.75 12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421C17.3077 7.53556 17.7692 8.14386 18.098 8.82213C18.4268 9.5004 18.618 10.2339 18.6604 10.9841C18.7028 11.7343 18.5955 12.486 18.345 13.1927C18.0944 13.8995 17.7057 14.547 17.2019 15.0983C16.698 15.6496 16.0886 16.0936 15.4121 16.407C14.7357 16.7203 14.0046 16.8965 13.2556 16.9254C12.5066 16.9542 11.7642 16.8351 11.0655 16.5751C10.3667 16.3151 9.7269 15.9196 9.18748 15.4114C8.64806 14.9031 8.2179 14.2927 7.92303 13.6146C7.62816 12.9365 7.47487 12.2046 7.47487 11.4646C7.47487 10.7246 7.62816 9.99273 7.92303 9.31463C8.2179 8.63652 8.64806 8.02614 9.18748 7.51787C9.7269 7.0096 10.3667 6.61409 11.0655 6.35408C11.7642 6.09408 12.5066 5.975 13.2556 6.00378C13.7562 6.02373 14.2508 6.10983 14.7281 6.25956C15.2054 6.40929 15.6598 6.62097 16.0764 6.88834C16.493 7.15572 16.8667 7.47574 17.1848 7.83944C17.5028 8.20313 17.761 8.60647 17.9503 9.03824L10.4415 13.0974C10.4415 13.0974 10.0356 13.3239 10.2184 13.6554C10.4011 13.9869 10.7925 13.7761 10.7925 13.7761L18.2284 9.76142C18.3324 10.1908 18.3903 10.6305 18.401 11.0726C18.4134 11.479 18.3943 11.7946 18.3557 12.0255C18.3171 12.2563 18.1947 12.5758 18.0531 12.8842C17.9114 13.1925 17.7214 13.548 17.5195 13.8626C17.3177 14.1771 17.0565 14.5063 16.7954 14.7705C16.5343 15.0347 16.2182 15.289 15.894 15.477C15.5697 15.6651 15.2042 15.8165 14.8387 15.9011C14.4732 15.9858 14.0845 16.0186 13.6959 15.9844C13.3073 15.9502 12.8996 15.8606 12.5129 15.7181C12.1262 15.5756 11.7431 15.3777 11.4009 15.1458C11.0588 14.9139 10.7413 14.6329 10.485 14.3372C10.2286 14.0415 10.0214 13.7076 9.87599 13.3736C9.73057 13.0396 9.63992 12.6919 9.61139 12.3442C9.58286 11.9965 9.60926 11.6487 9.70014 11.2937C9.79102 10.9387 9.94455 10.5909 10.1488 10.2639C10.353 9.93694 10.6139 9.6245 10.9158 9.35831C11.2176 9.09213 11.5604 8.86833 11.9304 8.7009C12.3003 8.53348 12.698 8.41912 13.0956 8.37032C13.4933 8.32152 13.9054 8.33539 14.2954 8.41284L10.3856 10.5945C10.3856 10.5945 9.96921 10.8039 10.1692 11.1526C10.3692 11.5013 10.7438 11.2819 10.7438 11.2819L18.75 7.02252V12Z" fill="#1652F0"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.75 7.02246V12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421L18.75 7.02246Z" fill="#0052FF"/>
            </svg>
            <span className="text-sm font-medium text-blue-800">Base Sepolia</span>
          </div>
        </div>
      </div>

      {getAllTickets().length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg p-8">
          <p className="text-gray-600 mb-4">You don't have any NFT tickets yet</p>
          <Link
            to="/events"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getAllTickets().map((ticket) => (
            <TicketNFTCard key={`${ticket.event.id}-${ticket.id}`} ticket={ticket} />
          ))}
        </div>
      )}
      
      {/* Demo mode controls */}
      {isDemoMode && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
          <p className="text-purple-700 font-medium">Demo Mode Active</p>
          <p className="text-sm text-purple-600 mt-1">
            These are demo NFT tickets for testing and development purposes.
          </p>
          <button
            onClick={() => setIsDemoMode(false)}
            className="mt-2 text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            Exit Demo Mode
          </button>
        </div>
      )}
      
      {/* Toggle for demo mode */}
      {!isDemoMode && demoTickets.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => setIsDemoMode(true)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Show Demo NFT Tickets ({demoTickets.length})
          </button>
        </div>
      )}
    </div>
  );
}

export default MyTickets;