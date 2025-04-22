/**
 * Utility functions for generating and displaying ticket NFTs
 */

// Generate a random pastel color
const generatePastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 80%)`;
};

// Generate background pattern style
const generatePatternStyle = (seed) => {
  const patterns = [
    'linear-gradient(45deg, #0001 25%, transparent 25%, transparent 50%, #0001 50%, #0001 75%, transparent 75%, transparent)',
    'repeating-linear-gradient(45deg, #0001 0, #0001 10px, transparent 10px, transparent 20px)',
    'radial-gradient(circle, transparent 20%, #0001 20%, #0001 80%, transparent 80%, transparent)',
    'repeating-radial-gradient(#0001 0, #0001 10px, transparent 10px, transparent 20px)',
    'linear-gradient(30deg, #0001 12%, transparent 12.5%, transparent 87%, #0001 87.5%, #0001), linear-gradient(150deg, #0001 12%, transparent 12.5%, transparent 87%, #0001 87.5%, #0001), linear-gradient(30deg, #0001 12%, transparent 12.5%, transparent 87%, #0001 87.5%, #0001), linear-gradient(150deg, #0001 12%, transparent 12.5%, transparent 87%, #0001 87.5%, #0001), linear-gradient(60deg, #00000010 25%, transparent 25.5%, transparent 75%, #00000010 75%, #00000010), linear-gradient(60deg, #00000010 25%, transparent 25.5%, transparent 75%, #00000010 75%, #00000010)'
  ];
  
  const index = Math.abs(seed.charCodeAt(0) + (seed.charCodeAt(1) || 0)) % patterns.length;
  return patterns[index];
};

// Safe base64 encoding function that can handle Unicode characters
const safeBase64Encode = (str) => {
  // Convert the string to UTF-8 bytes
  try {
    // Method 1: TextEncoder (modern browsers)
    if (typeof TextEncoder !== 'undefined') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(str);
      return btoa(String.fromCharCode.apply(null, bytes));
    }
    
    // Method 2: encodeURIComponent fallback
    // This works by percent-encoding UTF-8, then decoding percent encoding, 
    // then converting to base64
    return btoa(
      encodeURIComponent(str).replace(
        /%([0-9A-F]{2})/g, 
        (_, p1) => String.fromCharCode('0x' + p1)
      )
    );
  } catch (e) {
    console.error('Error encoding SVG to base64:', e);
    // Fallback to URL-encoded SVG if base64 fails
    return `data:image/svg+xml;utf8,${encodeURIComponent(str)}`;
  }
};

/**
 * Generate NFT metadata for a ticket
 * @param {Object} ticket - The ticket data
 * @param {Object} event - The event data
 * @returns {Object} The NFT metadata
 */
export const generateTicketNFTMetadata = (ticket, event) => {
  return {
    name: `${event.name} Ticket #${ticket.id}`,
    description: `Access pass for ${event.name}. Valid on ${new Date(Number(event.startTime) * 1000).toLocaleDateString()}`,
    image: generateTicketImageURL(ticket, event),
    attributes: [
      {
        trait_type: "Event",
        value: event.name
      },
      {
        trait_type: "Ticket ID",
        value: `#${ticket.id}`
      },
      {
        trait_type: "Date",
        value: new Date(Number(event.startTime) * 1000).toLocaleDateString()
      },
      {
        trait_type: "Status",
        value: ticket.isUsed ? "Used" : "Valid"
      },
      {
        trait_type: "Transferable",
        value: event.isSoulbound ? "No" : "Yes"
      }
    ],
    // These are mock properties to simulate OpenSea metadata
    external_url: `${window.location.origin}/events/${event.id}`,
    background_color: generatePastelColor().replace('hsl', '').replace('(', '').replace(')', '').replace(',', ''),
    animation_url: null
  };
};

/**
 * Generate a dynamic ticket image URL (this would typically be IPFS or similar in production)
 * For now, we use a data URI with SVG 
 */
export const generateTicketImageURL = (ticket, event) => {
  // Use event ID and ticket ID to create a unique but deterministic seed
  const seed = `${event.id}-${ticket.id}`;
  
  // Generate pastel colors for background and pattern
  const bgColor = generatePastelColor();
  const accentColor = generatePastelColor();
  const patternStyle = generatePatternStyle(seed);
  
  // Create SVG ticket
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <!-- Background -->
      <rect width="800" height="600" fill="${bgColor}" />
      
      <!-- Pattern overlay -->
      <rect width="800" height="600" fill="${accentColor}" opacity="0.2" 
            style="background: ${patternStyle}; background-size: 40px 40px;" />
      
      <!-- Ticket border -->
      <rect x="40" y="40" width="720" height="520" rx="20" ry="20" 
            fill="white" stroke="#000" stroke-width="2" opacity="0.9" />
      
      <!-- Ticket tear line -->
      <line x1="200" y1="40" x2="200" y2="560" stroke-dasharray="10,10" stroke="#000" stroke-width="2" />
      
      <!-- Event logo placeholder -->
      <circle cx="120" cy="120" r="60" fill="${accentColor}" />
      <text x="120" y="125" font-family="Arial" font-size="24" text-anchor="middle" font-weight="bold">NFT</text>
      
      <!-- Event Name -->
      <text x="400" y="100" font-family="Arial" font-size="32" text-anchor="middle" font-weight="bold">${event.name}</text>
      
      <!-- Date and time -->
      <text x="400" y="150" font-family="Arial" font-size="20" text-anchor="middle">
        ${new Date(Number(event.startTime) * 1000).toLocaleDateString()} - ${new Date(Number(event.startTime) * 1000).toLocaleTimeString()}
      </text>
      
      <!-- Ticket details -->
      <text x="400" y="220" font-family="Arial" font-size="28" text-anchor="middle" font-weight="bold">ADMIT ONE</text>
      <text x="400" y="260" font-family="Arial" font-size="18" text-anchor="middle">Ticket #${ticket.id}</text>
      
      <!-- Barcode/QR Code representation -->
      <rect x="300" y="300" width="200" height="100" fill="#000" />
      <rect x="310" y="310" width="180" height="80" fill="#fff" />
      <text x="400" y="360" font-family="Arial" font-size="16" text-anchor="middle" fill="#555">SCAN AT EVENT</text>
      
      <!-- Status marker -->
      ${ticket.isUsed ? `
        <g transform="translate(400, 450) rotate(-30)">
          <rect x="-150" y="-30" width="300" height="60" fill="red" opacity="0.7" rx="10" ry="10" />
          <text x="0" y="5" font-family="Arial" font-size="36" text-anchor="middle" fill="white" font-weight="bold">USED</text>
        </g>
      ` : `
        <g transform="translate(400, 450)">
          <rect x="-150" y="-30" width="300" height="60" fill="green" opacity="0.7" rx="10" ry="10" />
          <text x="0" y="5" font-family="Arial" font-size="36" text-anchor="middle" fill="white" font-weight="bold">VALID</text>
        </g>
      `}
      
      <!-- Footer with chain info -->
      <text x="400" y="520" font-family="Arial" font-size="14" text-anchor="middle">Base Sepolia NFT Ticket • ChainPass</text>
    </svg>
  `;
  
  // Use safe base64 encoding for SVG data URI 
  return `data:image/svg+xml;base64,${safeBase64Encode(svgContent)}`;
}; 