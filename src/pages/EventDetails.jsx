import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContractRead, useContractWrite } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: eventData } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [id],
  });

  const { write: writeContract } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'buyTicket',
  });

  useEffect(() => {
    if (eventData) {
      setEvent({
        id,
        ...eventData,
      });
      setLoading(false);
    }
  }, [eventData, id]);

  const handleBuyTicket = async () => {
    try {
      writeContract({
        args: [id],
        overrides: {
          value: event.ticketPrice,
        },
      });
    } catch (error) {
      console.error('Error buying ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Event not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <img
          src={event.imageUri}
          alt={event.name}
          className="w-full h-64 object-cover"
        />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
          <p className="text-gray-600 mb-6">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Event Details</h2>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-600">Start Time:</span>{' '}
                  {new Date(event.startTime * 1000).toLocaleString()}
                </li>
                <li>
                  <span className="text-gray-600">End Time:</span>{' '}
                  {new Date(event.endTime * 1000).toLocaleString()}
                </li>
                <li>
                  <span className="text-gray-600">Ticket Price:</span>{' '}
                  {event.ticketPrice / BigInt(1e18)} ETH
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Ticket Information</h2>
              <ul className="space-y-2">
                <li>
                  <span className="text-gray-600">Available Tickets:</span>{' '}
                  {event.maxTickets - event.ticketsSold} / {event.maxTickets}
                </li>
                <li>
                  <span className="text-gray-600">Tickets Sold:</span>{' '}
                  {event.ticketsSold}
                </li>
                <li>
                  <span className="text-gray-600">Soulbound:</span>{' '}
                  {event.isSoulbound ? 'Yes' : 'No'}
                </li>
              </ul>
            </div>
          </div>

          {event.isActive && new Date() < new Date(event.endTime * 1000) && (
            <button
              onClick={handleBuyTicket}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Buy Ticket
            </button>
          )}

          {!event.isActive && (
            <div className="text-center text-red-600">
              This event is no longer active
            </div>
          )}

          {new Date() >= new Date(event.endTime * 1000) && (
            <div className="text-center text-red-600">
              This event has ended
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails; 