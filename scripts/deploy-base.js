// CommonJS version
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  try {
    // Deploy EventManager
    console.log("Deploying EventManager contract...");
    const EventManager = await hre.ethers.getContractFactory("EventManager");
    const eventManager = await EventManager.deploy();
    await eventManager.waitForDeployment();
    
    const eventManagerAddress = await eventManager.getAddress();
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
      console.warn("Could not update .env file automatically");
      console.log("Please manually update your .env file with:");
      console.log(`VITE_EVENT_MANAGER_ADDRESS=${eventManagerAddress}`);
    }
  } catch (error) {
    console.error("Deployment failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 