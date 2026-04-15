require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const ORACLE_ADDRESS = "0x47816a48f90544f2fF964ec7f71D1e3C29049c2b";
    const CENTRAL_BANK_ADDRESS = "0xf8bea045952b3a095AbC10d93139f8D08095403a";
    
    // Use the existing ABI with submitPrice
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, [
      "function submitPrice(uint256 _price)",
      "function currentSilverPrice() view returns (uint256)",
      "function getTargetPrice() view returns (uint256)",
      "function getPoolPrice() view returns (uint256)"
    ], wallet);
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    // Get price from oracle
    const oracle = new ethers.Contract(ORACLE_ADDRESS, ["function silverPriceUSD() view returns (uint256)"], provider);
    const oraclePrice = await oracle.silverPriceUSD();
    console.log("Oracle price (cents):", oraclePrice);
    
    // Submit to CentralBank (use oracle price directly)
    console.log("\nSubmitting price to CentralBank...");
    const tx = await centralBank.submitPrice(oraclePrice, { gasPrice, gasLimit: 100000 });
    await tx.wait();
    console.log("Done! Tx:", tx.hash);
    
    // Verify
    console.log("\nCentralBank currentSilverPrice:", (await centralBank.currentSilverPrice()).toString());
    console.log("Target price (iKAS):", ethers.formatEther(await centralBank.getTargetPrice()));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
