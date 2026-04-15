require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    
    const CENTRAL_BANK_ADDRESS = "0xe7cC1fF2319F698Cbffdd33d60da5769ab14ce7E";
    
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, [
      "function currentSilverPrice() view returns (uint256)",
      "function getTargetPrice() view returns (uint256)",
      "function oracleUpdater() view returns (address)",
      "function constiCoin() view returns (address)",
      "function liquidityPool() view returns (address)"
    ], provider);
    
    console.log("=== CentralBank Status ===");
    console.log("Address:", CENTRAL_BANK_ADDRESS);
    console.log("Current Silver Price:", (await centralBank.currentSilverPrice()).toString());
    console.log("Target Price (iKAS):", ethers.formatEther(await centralBank.getTargetPrice()));
    console.log("Oracle Updater:", await centralBank.oracleUpdater());
    console.log("ConstiCoin:", await centralBank.constiCoin());
    console.log("LiquidityPool:", await centralBank.liquidityPool());
}

main().catch(console.error);
