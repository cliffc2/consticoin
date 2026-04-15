require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    
    const ORACLE_ADDRESS = "0x47816a48f90544f2fF964ec7f71D1e3C29049c2b";
    
    const oracle = new ethers.Contract(ORACLE_ADDRESS, [
      "function silverPriceUSD() view returns (uint256)",
      "function lastUpdate() view returns (uint256)",
      "function isStale() view returns (bool)"
    ], provider);
    
    console.log("\n=== Oracle Status ===");
    console.log("Address:", ORACLE_ADDRESS);
    console.log("Price:", (await oracle.silverPriceUSD()).toString());
    console.log("Last Update:", (await oracle.lastUpdate()).toString());
    console.log("Is Stale:", await oracle.isStale());
}

main().catch(console.error);
