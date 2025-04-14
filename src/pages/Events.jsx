import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContractRead, useContractReads } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Use a fixed maximum number to try instead of relying on getEventCount
  const MAX_EVENTS_TO_TRY = 10;
  
  // Generate contract calls for event IDs 1 through MAX_EVENTS_TO_TRY
  const contracts = Array.from({ length: MAX_EVENTS_TO_TRY }, (_, i) => ({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [i + 1],
  }));

  const { data: eventsData } = useContractReads({
    contracts,
  });

  useEffect(() => {
    if (!eventsData) return;

    const eventsList = eventsData
      .map((result, index) => {
        // Only include successful reads where the event exists
        // We can detect if an event exists by checking if it has a non-zero id or name
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

    setEvents(eventsList);
    setLoading(false);
  }, [eventsData]);

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return event.startTime > Date.now() / 1000;
    if (filter === 'past') return event.endTime < Date.now() / 1000;
    return true;
  });

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
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
                    {event.ticketPrice} ETH
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

export default Events; 