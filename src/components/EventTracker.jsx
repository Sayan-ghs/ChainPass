import React, { useState, useEffect } from 'react';
import { useContractEvent } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import { Link } from 'react-router-dom';

// Component to track and display recent blockchain events
function EventTracker() {
  const [recentEvents, setRecentEvents] = useState([]);
  const eventManagerAddress = import.meta.env.VITE_EVENT_MANAGER_ADDRESS;
  
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
        timestamp: new Date().toISOString(),
      };
      
      // Add the new event to our list
      setRecentEvents(prev => {
        // Limit to 5 most recent events
        const updated = [eventData, ...prev].slice(0, 5);
        // Store in localStorage for persistence
        localStorage.setItem('recentEvents', JSON.stringify(updated));
        return updated;
      });
    },
  });

  // Load previous events from localStorage on component mount
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem('recentEvents');
      if (storedEvents) {
        setRecentEvents(JSON.parse(storedEvents));
      }
    } catch (err) {
      console.error('Failed to load stored events:', err);
    }
  }, []);

  if (recentEvents.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 w-80 max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Recent Events</h3>
        <button 
          onClick={() => setRecentEvents([])} 
          className="text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
      
      <div className="space-y-3">
        {recentEvents.map((event, index) => (
          <div key={`${event.eventId}-${index}`} className="bg-blue-50 p-3 rounded-md">
            <div className="flex justify-between">
              <span className="font-medium text-blue-700">{event.name}</span>
              <span className="text-xs text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">
              Created by: {event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}
            </p>
            <Link 
              to={`/events/${event.eventId}`}
              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EventTracker; 