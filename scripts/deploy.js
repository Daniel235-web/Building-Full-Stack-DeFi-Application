const { ethers, artifacts } = require("hardhat");
const fs = require("fs");
async function main() {
  const [deployer] = await ethers.getSigners();
  const contractList = [
    // "Contract Name ", "Contract Factory Name"
    ["Simple DeFi Token", "SimpleDeFiToken"],
    ["Meme Token", "MemeToken"],
    ["Pair Factory", "PairFactory"]

  ];

  //Deploying the smart contracts and safe  the contract to frontend
 
  for (const [name, factory] of contractList) {
    let contractFactory = await ethers.getContractFactory(factory);
    let contract = await contractFactory.deploy()
    console.log(`${name} Contract Address:`, contract.address);
    saveContractToFrontend(contract, factory);
  }


  console.log("Deployer's address", deployer.address);
  console.log("Deployer's ETH balance", (await deployer.provider.getBalance(deployer.address)).toString());
}
function saveContractToFrontend(contract, name) {
  const contractDir = __dirname + "/../src/frontend/contracts";

  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir);
  }
  fs.writeFileSync(
    contractDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  const contractArtifacts = artifacts.readArtifactSync(name);

  fs.writeFileSync(contractDir + `/${name}.json`, JSON.stringify(contractArtifacts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitcode = 1;
});
