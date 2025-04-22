import React, { useState, useEffect } from 'react';
import { useContractEvent } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { Link } from 'react-router-dom';

function EventHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;

  console.log("EventHistory - Contract Address:", eventManagerAddress);

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
      console.log('EventHistory - Event detected:', log);
      
      try {
        // Match the successful implementation in EventTracker
        const eventData = {
          eventId: Number(log[0].args.eventId),
          name: log[0].args.name,
          organizer: log[0].args.organizer,
          ticketContract: log[0].args.ticketContract || "0x",
          checkInContract: log[0].args.checkInContract || "0x",
          blockNumber: Number(log[0].blockNumber),
          transactionHash: log[0].transactionHash,
          timestamp: new Date().toISOString(),
        };
        
        console.log('EventHistory - Processed event data:', eventData);
        
        // Add the new event to our list
        setEvents(prev => {
          // Check if we already have this event
          const exists = prev.some(e => 
            e.eventId === eventData.eventId && 
            e.transactionHash === eventData.transactionHash
          );
          
          if (exists) return prev;
          
          const updated = [eventData, ...prev];
          // Store in localStorage for persistence
          localStorage.setItem('eventHistory', JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.error('Error processing event log:', err, log);
      }
    },
  });

  // Debug button to clear event history
  const clearEventHistory = () => {
    localStorage.removeItem('eventHistory');
    setEvents([]);
    console.log('Event history cleared');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Event History</h1>
        <button 
          onClick={clearEventHistory}
          className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
        >
          Clear History
        </button>
      </div>
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-700 font-medium">Contract Connected</p>
        <p className="text-green-700 text-sm mt-1">
          Connected to blockchain. Event history will update automatically when new events are created.
        </p>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div className="text-blue-700">
          <p className="mb-2">
            This page shows blockchain events detected during your session.
          </p>
          <p className="text-sm">
            Status: {eventManagerAddress ? "Connected to blockchain" : "Not connected"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading event history...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg p-10">
          <p className="text-gray-600">No events have been detected yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Try creating a new event to see it appear here.
          </p>
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
              {events.map((event, index) => (
                <tr key={`${event.eventId}-${index}`}>
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