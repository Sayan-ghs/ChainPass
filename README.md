# ChainPass - Decentralized Event Access System

ChainPass is a full-stack decentralized event access system that allows users to mint NFT tickets, check-in to events, and claim rewards on the Base network.

![ChainPass Logo](https://assets.reown.com/reown-profile-pic.png)

## Features

- **Smart Wallet Integration** - Seamless login using WalletConnect and OnchainKit
- **NFT Ticket Minting** - Create and purchase event tickets as NFTs (with soulbound option)
- **On-chain Event Check-in** - Secure and verifiable attendance tracking
- **Event Management** - Create, edit, and manage events with an intuitive interface
- **Reward Claiming** - Distribute NFTs, tokens, and POAPs to attendees
- **Mobile Responsive UI** - Beautiful interface that works on all devices

## Tech Stack

- **Frontend**: React, TailwindCSS, Wagmi, Ethers.js
- **Smart Contracts**: Solidity (EventManager, TicketNFT, CheckIn)
- **Blockchain**: Base Network (Sepolia testnet and mainnet)
- **Wallet Integration**: WalletConnect, MetaMask, Coinbase Wallet
- **Storage**: IPFS/Pinata for event metadata and NFT images

## Prerequisites

- Node.js v16+ and npm
- MetaMask or another Ethereum wallet
- Base Sepolia testnet ETH (for testing)

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/chainpass.git
cd chainpass
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file by copying the example
```bash
cp .env.example .env
```

4. Fill in your environment variables in the `.env` file:
```
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here
ALCHEMY_API_KEY_BASE=your_alchemy_api_key_here
WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_PUBLIC_ONCHAINKIT_API_KEY=your_onchainkit_api_key
VITE_EVENT_MANAGER_ADDRESS=your_deployed_contract_address
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
3. Create a `.env` file
```bash
cp .env.example .env
```
Fill in your environment variables in the `.env` file.

4. Compile contracts
```bash
npm run compile
```

5. Deploy contracts
```bash
npm run deploy
```

## How to Create an Event

1. Navigate to the Create Event page in your application
2. Fill in the event details:
   - Event name and description
   - Date and time
   - Location
   - Ticket price (in ETH)
   - Total supply of tickets
   - Upload an event image
3. Click the "Create Event" button
4. Confirm the transaction in your wallet when prompted
5. Once the transaction is complete, navigate to the Events page
6. Your new event should now appear in the list!

## Development

1. Start the development server
```bash
npm run dev
```

2. Run tests
```bash
npm test
```

3. Build for production
```bash
npm run build
```

4. Preview the production build
```bash
npm run preview
```

## Contract Deployment

1. Compile the smart contracts
```bash
npm run compile
```

2. Deploy to Base Sepolia testnet
```bash
npm run deploy
```

3. For mainnet deployment:
```bash
npx hardhat run scripts/deploy.ts --network base
```

## Project Structure

```
chainpass/
├── contracts/              # Smart contracts
│   ├── EventManager.sol    # Main event management contract
│   ├── TicketNFT.sol       # NFT ticket contract
│   └── CheckInManager.sol  # Check-in and rewards contract
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages
│   ├── services/           # API and wallet services
│   ├── contracts/          # Contract ABIs
│   └── mocks/              # Mock data and services
├── scripts/                # Deployment scripts
└── test/                   # Contract tests
```

## Smart Contract Architecture

- **EventManager.sol**: Central contract that manages events, creates ticket contracts, and handles event lifecycle
- **TicketNFT.sol**: ERC-721 contract for NFT tickets with optional soulbound functionality
- **CheckInManager.sol**: Manages event check-ins and distributes rewards to attendees

## Troubleshooting

### Common Issues

1. **Wallet Connection Errors**
   - Make sure you have the correct WalletConnect project ID
   - Try using Incognito mode to avoid extension conflicts
   - Ensure your wallet is connected to the Base network

2. **Contract Interaction Failures**
   - Verify you have enough ETH for gas fees
   - Make sure the contract addresses in your .env file are correct
   - Check that you're on the right network (Sepolia testnet or Base mainnet)

3. **Build/Deployment Errors**
   - Clear the cache and node_modules, then reinstall: `rm -rf node_modules && npm install`
   - Make sure your environment variables are set correctly
   - Update Hardhat to the latest version

## Deployment

ChainPass can be deployed to various platforms:

- **Vercel**: Most straightforward option, supports automatic deployments
- **Netlify**: Great for continuous integration
- **AWS Amplify**: Provides additional backend capabilities
- **GitHub Pages**: Simple option for static hosting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- The Base team for providing the blockchain infrastructure
- WalletConnect for the wallet integration
- OpenZeppelin for secure contract templates
## Smart Contract Architecture

- `EventManager.sol`: Main contract for event creation and management
- `TicketNFT.sol`: ERC-721 contract for NFT tickets
- `CheckInManager.sol`: Handles event check-ins and rewards

## Frontend Structure

- `/src/components`: Reusable UI components
- `/src/pages`: Main application pages
- `/src/hooks`: Custom React hooks for blockchain interactions
- `/src/context`: React context providers
- `/src/utils`: Utility functions and helpers

## License

MIT 
