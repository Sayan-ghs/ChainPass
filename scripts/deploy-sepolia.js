import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts to Base Sepolia with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  try {
    // Deploy EventManager
    const EventManager = await ethers.getContractFactory("EventManager");
    console.log("Deploying EventManager...");
    const eventManager = await EventManager.deploy();
    
    // Wait for deployment to complete (works with both older and newer hardhat versions)
    console.log("Waiting for deployment transaction to be mined...");
    if (eventManager.deployTransaction) {
      // Older hardhat version
      await eventManager.deployTransaction.wait();
    } else {
      // Newer hardhat version
      await eventManager.deployed();
    }
    
    let eventManagerAddress;
    try {
      // Try both methods to get the address
      eventManagerAddress = await eventManager.getAddress();
    } catch (e) {
      // Fallback for older versions
      eventManagerAddress = eventManager.address;
    }
    
    console.log("EventManager deployed to:", eventManagerAddress);

    // Save deployed addresses
    const addresses = {
      eventManager: eventManagerAddress,
    };

    fs.writeFileSync(
      path.join(__dirname, "../deployed-addresses-sepolia.json"),
      JSON.stringify(addresses, null, 2)
    );

    console.log("Contract addresses saved to deployed-addresses-sepolia.json");

    // Also update .env file
    try {
      const envPath = path.join(__dirname, "../.env");
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace the line with VITE_EVENT_MANAGER_ADDRESS or add it if it doesn't exist
      if (envContent.includes('VITE_EVENT_MANAGER_ADDRESS=')) {
        envContent = envContent.replace(
          /VITE_EVENT_MANAGER_ADDRESS=.*/,
          `VITE_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`
        );
      } else {
        envContent += `\nVITE_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(".env file updated with new contract address");
    } catch (err) {
      console.warn("Could not update .env file:", err.message);
      console.log("Please manually update your .env file with:");
      console.log(`VITE_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`);
    }
  } catch (error) {
    console.error("Deployment failed:", error);
    console.error(error.stack);
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 