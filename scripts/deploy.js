const {ethers, artifacts} = require("hardhat");
const fs = require("fs");
async function main()  {
    const [deployer] =  await ethers.getSigners();
    const tokenContractFactory = await ethers.getContractFactory("SimpleDeFiToken");
    const token  = await tokenContractFactory.deploy();

    console.log("Simple DeFi token contract address: ", token.address);
    console.log("Deployer's address", deployer.address);
    console.log("Deployer's ETH balance", (await deployer.provider.getBalance(deployer.address)).toString());
   
   saveContractToFrontend(token, 'SimpleDeFiToken');

}
function saveContractToFrontend(contract, name) {
    const contractDir = __dirname + "/../src/frontend/contracts";    
 
    if (!fs.existsSync(contractDir)){
        fs.mkdirSync(contractDir);
    }
    fs.writeFileSync(
        contractDir + `/${name}-address.json`,
        JSON.stringify({address: contract.address}, undefined, 2)
    );
    const contractArtifacts = artifacts.readArtifactSync(name);
    
    fs.writeFileSync(
        contractDir + `/${name}.json`, JSON.stringify(contractArtifacts, null, 2)
    )
}

main().catch((error) => {
    console.error(error);
    process.exitcode = 1;
});