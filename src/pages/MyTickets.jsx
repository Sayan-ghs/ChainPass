import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useContractRead } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { readContract } from 'wagmi/actions';

function MyTickets() {
  const { address } = useAccount();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (address) {
      fetchTickets();
    }
  }, [eventCount, address]);

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

      {tickets.length === 0 ? (
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
          {tickets.map((ticket) => (
            <div
              key={`${ticket.event.id}-${ticket.id}`}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <img
                src={ticket.event.imageUri}
                alt={ticket.event.name}
                className="w-full h-48 object-cover"
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
                </div>
                <Link
                  to={`/events/${ticket.event.id}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                >
                  View Event Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTickets; 