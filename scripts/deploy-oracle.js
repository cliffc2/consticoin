require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== ConstiOracle Deployment ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log("Deployer:", wallet.address);
    console.log("Network: IGRA Galleon Testnet (38836)\n");
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = {
        gasPrice: gasPrice,
        gasLimit: 500000
    };
    
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    const oracleArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'ConstiOracle.sol', 'ConstiOracle.json')));
    const Oracle = new ethers.ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
    
    console.log("Deploying ConstiOracle...");
    const oracle = await Oracle.deploy(deployOptions);
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("ConstiOracle:", oracleAddress);
    
    console.log("\n=== Deployment Complete ===\n");
    console.log("Oracle:", oracleAddress);
    console.log("\nExplorer: https://explorer.galleon-testnet.igralabs.com");
    
    // Update deployment.json
    const deploymentPath = path.join(__dirname, '..', 'deployments', 'deployment.json');
    if (fs.existsSync(deploymentPath)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath));
        deploymentInfo.contracts.constiOracle = oracleAddress;
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\nUpdated deployments/deployment.json");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
