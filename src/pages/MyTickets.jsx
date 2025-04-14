import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useContractRead } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { readContract } from 'wagmi/actions';

function MyTickets() {
  const { address } = useAccount();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: ticketCount } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getTicketCount',
    args: [address],
  });

  useEffect(() => {
    const fetchTickets = async () => {
      if (!ticketCount || !address) return;

      const ticketsList = [];
      for (let i = 0; i < ticketCount; i++) {
        const ticketData = await readContract({
          address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
          abi: EventManagerABI,
          functionName: 'getTicketByIndex',
          args: [address, i],
        });

        const eventData = await readContract({
          address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
          abi: EventManagerABI,
          functionName: 'getEvent',
          args: [ticketData.eventId],
        });

        ticketsList.push({
          id: i,
          ...ticketData,
          event: {
            id: ticketData.eventId,
            ...eventData,
          },
        });
      }

      setTickets(ticketsList);
      setLoading(false);
    };

    fetchTickets();
  }, [ticketCount, address]);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please connect your wallet to view your tickets</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading your tickets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

      {tickets.length === 0 ? (
        <div className="text-center py-8">
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
                    {new Date(ticket.event.startTime * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(ticket.event.startTime * 1000).toLocaleTimeString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Ticket ID:</span> #{ticket.id}
                  </p>
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