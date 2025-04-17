// Direct deployment without hardhat
const ethers = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the contract ABI and bytecode
const EventManagerJSON = require('../artifacts/contracts/EventManager.sol/EventManager.json');

async function main() {
  try {
    // Connect to Base Sepolia
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    // Your private key from .env
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("Missing PRIVATE_KEY in .env file");
    }
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("Deploying contracts with account:", wallet.address);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance));
    
    if (balance < ethers.parseEther("0.01")) {
      console.warn("WARNING: Low account balance. You may need more ETH to deploy.");
    }
    
    // Deploy the contract
    console.log("Deploying EventManager contract...");
    const factory = new ethers.ContractFactory(
      EventManagerJSON.abi,
      EventManagerJSON.bytecode,
      wallet
    );
    
    const contract = await factory.deploy();
    console.log("Deployment transaction hash:", contract.deploymentTransaction().hash);
    
    // Wait for deployment to finish
    console.log("Waiting for contract to be deployed...");
    await contract.waitForDeployment();
    
    // Get the contract address
    const eventManagerAddress = await contract.getAddress();
    console.log("EventManager deployed to:", eventManagerAddress);
    
    // Save deployed addresses
    const addresses = {
      eventManager: eventManagerAddress,
    };
    
    fs.writeFileSync(
      path.join(__dirname, "../deployed-addresses-base.json"),
      JSON.stringify(addresses, null, 2)
    );
    console.log("Contract addresses saved to deployed-addresses-base.json");
    
    // Update .env file
    try {
      const envPath = path.join(__dirname, "../.env");
      let envContent = fs.readFileSync(envPath, 'utf8');
      
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
      console.warn("Could not update .env file automatically:", err.message);
      console.log("Please manually update your .env file with:");
      console.log(`VITE_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`);
    }
    
    console.log("\nSUCCESS: Contract deployed and environment updated!");
  } catch (error) {
    console.error("Deployment failed:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 