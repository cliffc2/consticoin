require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== Deploy Updated CentralBank ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice, gasLimit: 2000000 };
    
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    
    const centralBankArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const CentralBank = new ethers.ContractFactory(centralBankArtifact.abi, centralBankArtifact.bytecode, wallet);
    
    console.log("Deploying CentralBank...");
    const centralBank = await CentralBank.deploy(deployOptions);
    await centralBank.waitForDeployment();
    const centralBankAddress = await centralBank.getAddress();
    console.log("New CentralBank:", centralBankAddress);
    
    const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    const LIQUIDITY_POOL_ADDRESS = "0xe07dC9125560b045377553d673b2b5a96f223F7f";
    const ORACLE_ADDRESS = "0x47816a48f90544f2fF964ec7f71D1e3C29049c2b";
    
    console.log("\nSetting references...");
    await centralBank.setConstiCoin(CONSTI_ADDRESS, deployOptions);
    await centralBank.setLiquidityPool(LIQUIDITY_POOL_ADDRESS, deployOptions);
    await centralBank.setOracleUpdater(ORACLE_ADDRESS, deployOptions);
    
    console.log("Syncing price...");
    const priceTx = await centralBank.submitPriceOwner(7900, deployOptions);
    await priceTx.wait();
    
    const price = await centralBank.currentSilverPrice();
    const target = await centralBank.getTargetPrice();
    console.log("Price:", price.toString());
    console.log("Target:", ethers.formatEther(target), "iKAS");
    
    console.log("\n=== Deployment Complete ===");
    console.log("CentralBank:", centralBankAddress);
}

main().then(() => process.exit(0)).catch(console.error);
