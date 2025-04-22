import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { generateTicketNFTMetadata } from '../utils/ticketNFTUtils';

// Base logo for chain display
const BaseLogoSmall = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="#0052FF"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0ZM18.75 12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421C17.3077 7.53556 17.7692 8.14386 18.098 8.82213C18.4268 9.5004 18.618 10.2339 18.6604 10.9841C18.7028 11.7343 18.5955 12.486 18.345 13.1927C18.0944 13.8995 17.7057 14.547 17.2019 15.0983C16.698 15.6496 16.0886 16.0936 15.4121 16.407C14.7357 16.7203 14.0046 16.8965 13.2556 16.9254C12.5066 16.9542 11.7642 16.8351 11.0655 16.5751C10.3667 16.3151 9.7269 15.9196 9.18748 15.4114C8.64806 14.9031 8.2179 14.2927 7.92303 13.6146C7.62816 12.9365 7.47487 12.2046 7.47487 11.4646C7.47487 10.7246 7.62816 9.99273 7.92303 9.31463C8.2179 8.63652 8.64806 8.02614 9.18748 7.51787C9.7269 7.0096 10.3667 6.61409 11.0655 6.35408C11.7642 6.09408 12.5066 5.975 13.2556 6.00378C13.7562 6.02373 14.2508 6.10983 14.7281 6.25956C15.2054 6.40929 15.6598 6.62097 16.0764 6.88834C16.493 7.15572 16.8667 7.47574 17.1848 7.83944C17.5028 8.20313 17.761 8.60647 17.9503 9.03824L10.4415 13.0974C10.4415 13.0974 10.0356 13.3239 10.2184 13.6554C10.4011 13.9869 10.7925 13.7761 10.7925 13.7761L18.2284 9.76142C18.3324 10.1908 18.3903 10.6305 18.401 11.0726C18.4134 11.479 18.3943 11.7946 18.3557 12.0255C18.3171 12.2563 18.1947 12.5758 18.0531 12.8842C17.9114 13.1925 17.7214 13.548 17.5195 13.8626C17.3177 14.1771 17.0565 14.5063 16.7954 14.7705C16.5343 15.0347 16.2182 15.289 15.894 15.477C15.5697 15.6651 15.2042 15.8165 14.8387 15.9011C14.4732 15.9858 14.0845 16.0186 13.6959 15.9844C13.3073 15.9502 12.8996 15.8606 12.5129 15.7181C12.1262 15.5756 11.7431 15.3777 11.4009 15.1458C11.0588 14.9139 10.7413 14.6329 10.485 14.3372C10.2286 14.0415 10.0214 13.7076 9.87599 13.3736C9.73057 13.0396 9.63992 12.6919 9.61139 12.3442C9.58286 11.9965 9.60926 11.6487 9.70014 11.2937C9.79102 10.9387 9.94455 10.5909 10.1488 10.2639C10.353 9.93694 10.6139 9.6245 10.9158 9.35831C11.2176 9.09213 11.5604 8.86833 11.9304 8.7009C12.3003 8.53348 12.698 8.41912 13.0956 8.37032C13.4933 8.32152 13.9054 8.33539 14.2954 8.41284L10.3856 10.5945C10.3856 10.5945 9.96921 10.8039 10.1692 11.1526C10.3692 11.5013 10.7438 11.2819 10.7438 11.2819L18.75 7.02252V12Z" fill="#1652F0"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM18.75 7.02246V12C18.75 15.7279 15.7279 18.75 12 18.75C8.27208 18.75 5.25 15.7279 5.25 12C5.25 8.27208 8.27208 5.25 12 5.25C12.7382 5.25 13.4506 5.3699 14.1186 5.5916C14.3357 5.65646 14.5482 5.73132 14.7548 5.81701L14.7548 5.81702C15.4936 6.10352 16.1645 6.51286 16.7361 7.02421L18.75 7.02246Z" fill="#0052FF"/>
  </svg>
);

const TicketNFTCard = ({ ticket }) => {
  const [showFullNFT, setShowFullNFT] = useState(false);
  const metadata = generateTicketNFTMetadata(ticket, ticket.event);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      {/* NFT Marketplace-style header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <BaseLogoSmall />
          <span className="text-xs font-medium text-gray-600">Base Sepolia NFT</span>
        </div>
        {ticket.isDemo && (
          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">
            Demo
          </span>
        )}
      </div>
      
      {/* NFT Image */}
      <div 
        className="relative overflow-hidden cursor-pointer" 
        onClick={() => setShowFullNFT(true)}
      >
        <div className="aspect-square w-full">
          <img
            src={metadata.image}
            alt={metadata.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80";
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <h3 className="text-white font-bold truncate">{metadata.name}</h3>
        </div>
        
        {/* Overlay for viewing NFT details */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200"
        >
          <button className="bg-white/90 hover:bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            View NFT
          </button>
        </div>
      </div>
      
      {/* Ticket Info */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2 truncate">{ticket.event.name}</h2>
        
        {/* NFT Properties - in a grid like OpenSea */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {metadata.attributes.slice(0, 4).map((attr, index) => (
            <div key={index} className="bg-blue-50 p-2 rounded-md">
              <p className="text-xs text-blue-500 uppercase font-medium">{attr.trait_type}</p>
              <p className="text-sm font-medium truncate">{attr.value}</p>
            </div>
          ))}
        </div>
        
        {/* View and Check-in buttons */}
        <div className="flex items-center justify-between mt-2">
          <Link
            to={`/events/${ticket.event.id}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Event
          </Link>
          
          <button
            className={`text-xs font-medium px-3 py-1.5 rounded-full ${
              ticket.isUsed
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
            disabled={ticket.isUsed}
          >
            {ticket.isUsed ? 'Used' : 'Check-in'}
          </button>
        </div>
      </div>
      
      {/* Full NFT Modal */}
      {showFullNFT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowFullNFT(false)}>
          <div className="bg-white rounded-lg overflow-hidden max-w-2xl w-full max-h-[90vh] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">{metadata.name}</h3>
              <button onClick={() => setShowFullNFT(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[70vh]">
              {/* NFT Image */}
              <div className="p-4 border-b">
                <img 
                  src={metadata.image} 
                  alt={metadata.name}
                  className="w-full rounded-lg shadow-md" 
                />
              </div>
              
              {/* NFT Description */}
              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-500 mb-2">Description</h4>
                <p className="text-sm">{metadata.description}</p>
              </div>
              
              {/* NFT Properties */}
              <div className="p-4">
                <h4 className="font-medium text-gray-500 mb-2">Properties</h4>
                <div className="grid grid-cols-3 gap-3">
                  {metadata.attributes.map((attr, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-md text-center">
                      <p className="text-xs text-blue-500 uppercase font-medium">{attr.trait_type}</p>
                      <p className="text-sm font-medium truncate">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Chain Information */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <BaseLogoSmall />
                  <span>Base Sepolia</span>
                  <span className="text-gray-300 mx-1">•</span>
                  <span>Token ID: {ticket.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketNFTCard; 