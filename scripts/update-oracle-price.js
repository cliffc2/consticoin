require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== Update Oracle Price ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const ORACLE_ADDRESS = "0x47816a48f90544f2fF964ec7f71D1e3C29049c2b";
    
    const oracleArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ConstiOracle.sol', 'ConstiOracle.json')));
    const oracle = new ethers.Contract(ORACLE_ADDRESS, oracleArtifact.abi, wallet);
    
    // Current silver price ~$79/oz, store as 7900 (cents)
    const priceUSD = 7900;
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    console.log("Setting price to:", priceUSD, "cents ($79.00)");
    const tx = await oracle.updatePrice(priceUSD, { gasPrice, gasLimit: 100000 });
    await tx.wait();
    console.log("Done! Tx:", tx.hash);
    
    // Verify
    console.log("New price:", (await oracle.silverPriceUSD()).toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
