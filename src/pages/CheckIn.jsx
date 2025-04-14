import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { EventManagerABI } from '../contracts/EventManagerABI';
import QRCode from 'qrcode.react';

function CheckIn() {
  const { eventId } = useParams();
  const { address } = useAccount();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInCode, setCheckInCode] = useState('');

  const { data: eventData } = useContractRead({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'getEvent',
    args: [eventId],
  });

  const { write: writeContract } = useContractWrite({
    address: import.meta.env.VITE_EVENT_MANAGER_ADDRESS,
    abi: EventManagerABI,
    functionName: 'checkIn',
  });

  useEffect(() => {
    if (eventData) {
      setEvent({
        id: eventId,
        ...eventData,
      });
      setLoading(false);
    }
  }, [eventData, eventId]);

  useEffect(() => {
    if (address && event) {
      // Generate a unique check-in code based on the event ID and user's address
      const code = `${event.id}-${address}`;
      setCheckInCode(code);
    }
  }, [address, event]);

  const handleCheckIn = async (code) => {
    try {
      const [eventId, userAddress] = code.split('-');
      writeContract({
        args: [eventId, userAddress],
      });
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Please connect your wallet to check in</div>
      </div>
    );
  }

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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Check In: {event.name}</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              Show this QR code to the event organizer to check in
            </p>
            <div className="inline-block p-4 bg-white rounded-lg shadow-md">
              <QRCode value={checkInCode} size={200} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">Check-in Code:</p>
            <p className="font-mono text-lg">{checkInCode}</p>
          </div>

          {event.isActive ? (
            <div className="mt-8 text-center text-green-600">
              Event is active and ready for check-in
            </div>
          ) : (
            <div className="mt-8 text-center text-red-600">
              Event is not active
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckIn; 