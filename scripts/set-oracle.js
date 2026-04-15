require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== Set Oracle Updater in CentralBank ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const ORACLE_ADDRESS = "0x47816a48f90544f2fF964ec7f71D1e3C29049c2b";
    const CENTRAL_BANK_ADDRESS = "0xf8bea045952b3a095AbC10d93139f8D08095403a";
    
    // Read the deployed CentralBank artifact
    const centralBankArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, centralBankArtifact.abi, wallet);
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const txOptions = { gasPrice: gasPrice, gasLimit: 100000 };
    
    console.log("Oracle address:", ORACLE_ADDRESS);
    console.log("CentralBank:", CENTRAL_BANK_ADDRESS);
    console.log("Setting oracle updater...");
    
    const tx = await centralBank.setOracleUpdater(ORACLE_ADDRESS, txOptions);
    await tx.wait();
    console.log("Done! Tx:", tx.hash);
    
    // Verify
    const oracleAddr = await centralBank.oracleUpdater();
    console.log("Oracle updater set to:", oracleAddr);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
