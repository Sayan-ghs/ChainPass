import React, { useState, useEffect } from 'react';
import { useContractEvent } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { Link } from 'react-router-dom';

function EventHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;

  // Load stored events from localStorage on component mount
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem('eventHistory');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load stored events:', err);
      setLoading(false);
    }
  }, []);

  // Watch for EventCreated events from the contract
  useContractEvent({
    address: eventManagerAddress,
    abi: EventManagerABI,
    eventName: 'EventCreated',
    listener(log) {
      console.log('New event created:', log);
      const eventData = {
        eventId: Number(log[0].args.eventId),
        name: log[0].args.name,
        organizer: log[0].args.organizer,
        ticketContract: log[0].args.ticketContract,
        checkInContract: log[0].args.checkInContract,
        blockNumber: Number(log[0].blockNumber),
        transactionHash: log[0].transactionHash,
        timestamp: new Date().toISOString(),
      };
      
      // Add the new event to our list
      setEvents(prev => {
        const updated = [eventData, ...prev];
        // Store in localStorage for persistence
        localStorage.setItem('eventHistory', JSON.stringify(updated));
        return updated;
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Event History</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-700">
          This page shows events created on the blockchain that have been detected since you started using the application.
          New events will appear automatically as they are created.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading event history...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg p-10">
          <p className="text-gray-600">No events have been detected yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organizer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Block
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={`${event.eventId}-${event.blockNumber}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">#{event.eventId}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{event.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{event.blockNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link to={`/events/${event.eventId}`} className="text-blue-600 hover:text-blue-900 mr-4">
                      View Details
                    </Link>
                    <a 
                      href={`https://sepolia.basescan.org/tx/${event.transactionHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-900"
                    >
                      View Transaction
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventHistory; 