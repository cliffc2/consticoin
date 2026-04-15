require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const CENTRAL_BANK_ADDRESS = "0x45F208d9c22E2367c0eFc7C08a01DC3ef56D34f6";
    
    const centralBankArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'CentralBank.sol', 'CentralBank.json')));
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, centralBankArtifact.abi, wallet);
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    console.log("Submitting price (in dollars, not cents)...");
    const tx = await centralBank.submitPriceOwner(7900, { gasPrice, gasLimit: 100000 });
    await tx.wait();
    console.log("Done! Tx:", tx.hash);
    
    // Verify
    console.log("Price:", (await centralBank.currentSilverPrice()).toString());
    console.log("Target:", ethers.formatEther(await centralBank.getTargetPrice()), "iKAS");
}

main().then(() => process.exit(0)).catch(console.error);
