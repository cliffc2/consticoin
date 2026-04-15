require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const constiAddress = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    const lpAddress = "0xe07dC9125560b045377553d673b2b5a96f223F7f";
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    const constiArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'ConstiCoin.sol', 'ConstiCoin.json')));
    const consti = new ethers.Contract(constiAddress, constiArtifact.abi, wallet);
    
    // Try emergencyMint (owner-only)
    console.log("Emergency minting CONSTI...");
    const amount = ethers.parseEther("5000");
    const mintTx = await consti.emergencyMint(lpAddress, amount, { gasPrice, gasLimit: 100000 });
    await mintTx.wait();
    console.log("Minted 5000 CONSTI to pool. Tx:", mintTx.hash);
    
    const lp = new ethers.Contract(lpAddress, ["function getReserves() view returns (uint256, uint256)"], provider);
    const [ikas, constiBal] = await lp.getReserves();
    console.log("\nPool reserves now:");
    console.log("  iKAS:", ethers.formatEther(ikas));
    console.log("  CONSTI:", ethers.formatEther(constiBal));
}

main().then(() => process.exit(0)).catch(console.error);