const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy EventManager
  const EventManager = await hre.ethers.getContractFactory("EventManager");
  const eventManager = await EventManager.deploy();
  await eventManager.waitForDeployment();
  console.log("EventManager deployed to:", await eventManager.getAddress());

  // Save deployed addresses
  const fs = require("fs");
  const path = require("path");
  const addresses = {
    eventManager: await eventManager.getAddress(),
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployed-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 