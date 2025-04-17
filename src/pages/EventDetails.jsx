import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContractRead, useContractWrite, useAccount } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function EventDetails() {
  const { id } = useParams();
  const { address } = useAccount();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: eventData, isError: isEventError, error: eventError } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [id],
    enabled: !!id,
  });

  const { write: writeContract } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'buyTicket',
  });

  useEffect(() => {
    if (isEventError && eventError) {
      console.error('Error fetching event:', eventError);
      setError('Failed to load event details. Please try again later.');
      setLoading(false);
    } else if (eventData) {
      // Process the event data, ensuring all values are properly formatted
      try {
        setEvent({
          id: Number(id),
          name: eventData.name,
          description: eventData.description,
          imageUri: eventData.imageUri || 'https://images.unsplash.com/photo-1639322537228-f710d846310a',
          organizer: eventData.organizer,
          ticketPrice: eventData.ticketPrice,
          maxTickets: Number(eventData.maxTickets),
          startTime: Number(eventData.startTime),
          endTime: Number(eventData.endTime),
          ticketContract: eventData.ticketContract,
          checkInContract: eventData.checkInContract,
          isActive: eventData.isActive,
          // Since ticketsSold might not be in the contract, default to 0
          ticketsSold: eventData.ticketsSold ? Number(eventData.ticketsSold) : 0,
        });
      } catch (err) {
        console.error('Error processing event data:', err);
        setError('Error processing event data');
      } finally {
        setLoading(false);
      }
    }
  }, [eventData, isEventError, eventError, id]);

  const handleBuyTicket = async () => {
    if (!address) {
      alert('Please connect your wallet to buy a ticket');
      return;
    }
    
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
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading event details...</p>
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

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p className="text-yellow-700">Event not found</p>
        </div>
      </div>
    );
  }

  // Format dates safely
  const formatDate = (timestamp) => {
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch (err) {
      return 'Invalid date';
    }
  };
  
  // Format ETH amount safely
  const formatEth = (wei) => {
    try {
      // BigInt is not directly dividable by a number, convert to string first
      return Number(wei) / 1e18;
    } catch (err) {
      return 'Unknown';
    }
  };

  // Helper to determine if event is ended
  const isEventEnded = () => {
    try {
      return new Date() >= new Date(event.endTime * 1000);
    } catch (err) {
      return false;
    }
  };

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
                  {formatDate(event.startTime)}
                </li>
                <li>
                  <span className="text-gray-600">End Time:</span>{' '}
                  {formatDate(event.endTime)}
                </li>
                <li>
                  <span className="text-gray-600">Ticket Price:</span>{' '}
                  {formatEth(event.ticketPrice)} ETH
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

          {event.isActive && !isEventEnded() && (
            <button
              onClick={handleBuyTicket}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!address}
            >
              {address ? 'Buy Ticket' : 'Connect Wallet to Buy Ticket'}
            </button>
          )}

          {!event.isActive && (
            <div className="text-center text-red-600 p-3 bg-red-50 rounded-lg">
              This event is no longer active
            </div>
          )}

          {isEventEnded() && (
            <div className="text-center text-orange-600 p-3 bg-orange-50 rounded-lg">
              This event has ended
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetails; 