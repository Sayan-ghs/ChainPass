import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useContractRead } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { readContract } from 'wagmi/actions';

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
            
            if (!eventData || !eventData.ticketContract) continue;
            
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
            
            // Check if user has any tickets for this event
            const balance = await readContract({
              address: eventData.ticketContract,
              abi: TicketNFTABI,
              functionName: 'balanceOf',
              args: [address],
            });
            
            if (Number(balance) > 0) {
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
    }
  }, [eventCount, address, isDemoMode]);

  // Function to merge real tickets with demo tickets
  const getAllTickets = () => {
    return [...tickets, ...demoTickets];
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
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

      {getAllTickets().length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg p-8">
          <p className="text-gray-600 mb-4">You don't have any tickets yet</p>
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
            <div
              key={`${ticket.event.id}-${ticket.id}`}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {ticket.qrCode && (
                <div className="bg-blue-50 p-2 text-center border-b">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Demo Ticket</span>
                </div>
              )}
              <img
                src={ticket.event.imageUri}
                alt={ticket.event.name}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80";
                }}
              />
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{ticket.event.name}</h2>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {ticket.event.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Date:</span>{' '}
                    {new Date(Number(ticket.event.startTime) * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(Number(ticket.event.startTime) * 1000).toLocaleTimeString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Ticket ID:</span> #{ticket.id}
                  </p>
                  {ticket.isUsed && (
                    <p className="text-sm text-orange-600 font-medium">
                      ⚠️ This ticket has been used
                    </p>
                  )}
                  {ticket.purchasedAt && (
                    <p className="text-sm">
                      <span className="font-medium">Purchased:</span>{' '}
                      {new Date(ticket.purchasedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {/* QR Code Display for Demo Tickets */}
                {ticket.qrCode && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Scan this QR code at the event</p>
                    <img 
                      src={ticket.qrCode} 
                      alt="Ticket QR Code" 
                      className="inline-block w-32 h-32"
                    />
                  </div>
                )}
                
                <div className="mt-4 flex justify-between">
                  <Link
                    to={`/events/${ticket.event.id}`}
                    className="inline-block text-blue-600 hover:text-blue-800"
                  >
                    View Event Details
                  </Link>
                  
                  {ticket.qrCode && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      Demo
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Demo mode controls */}
      {isDemoMode && (
        <div className="mt-8 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
          <p className="text-purple-700 font-medium">Demo Mode Active</p>
          <p className="text-sm text-purple-600 mt-1">
            These are demo tickets for testing and development purposes.
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
            Show Demo Tickets ({demoTickets.length})
          </button>
        </div>
      )}
    </div>
  );
}

export default MyTickets;