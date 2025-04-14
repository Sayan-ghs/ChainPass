import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractWrite } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';

function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUri: '',
    startTime: '',
    endTime: '',
    ticketPrice: '',
    maxTickets: '',
    isSoulbound: false,
  });

  const { write: writeContract } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'createEvent',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const startTimeUnix = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const endTimeUnix = Math.floor(new Date(formData.endTime).getTime() / 1000);

      writeContract({
        args: [
          formData.name,
          formData.description,
          formData.imageUri,
          startTimeUnix,
          endTimeUnix,
          BigInt(formData.ticketPrice * 1e18), // Convert ETH to Wei
          BigInt(formData.maxTickets),
          formData.isSoulbound,
        ],
      });

      navigate('/events');
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Event Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input
            type="url"
            name="imageUri"
            value={formData.imageUri}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ticket Price (ETH)</label>
            <input
              type="number"
              name="ticketPrice"
              value={formData.ticketPrice}
              onChange={handleChange}
              step="0.001"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Maximum Tickets</label>
            <input
              type="number"
              name="maxTickets"
              value={formData.maxTickets}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="isSoulbound"
            checked={formData.isSoulbound}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Make tickets soulbound (non-transferable)
          </label>
        </div>

        <div className="pt-5">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEvent; 