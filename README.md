# ChainPass - Decentralized Event Access System

ChainPass is a full-stack decentralized event access system that allows users to mint NFT tickets, check-in to events, and claim rewards on the Base network.

## Features

- Smart Wallet login using OnchainKit
- NFT ticket minting (with soulbound option)
- On-chain event check-in
- Reward claiming (NFTs, tokens, POAPs)
- Event organizer dashboard
- Gasless transactions

## Tech Stack

- Frontend: React + Tailwind + Wagmi + Ethers
- Smart Wallets: OnchainKit + Base
- Backend/Contract: Solidity (EventManager, TicketNFT, CheckIn logic)
- Storage: IPFS/Pinata for event metadata and NFT images

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/chainpass.git
cd chainpass
```

2. Install dependencies
```bash
npm install
```

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

## Development

1. Start the development server
```bash
npm run dev
```

2. Run tests
```bash
npm test
```

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