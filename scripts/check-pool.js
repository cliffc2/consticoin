require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const lpAddress = "0xe07dC9125560b045377553d673b2b5a96f223F7f";
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    // Use deployed artifact
    const lpArtifact = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'artifacts', 'contracts', 'LiquidityPool.sol', 'LiquidityPool.json')));
    const lp = new ethers.Contract(lpAddress, lpArtifact.abi, wallet);
    
    const [ikas, consti] = await lp.getReserves();
    const owner = await lp.owner();
    const actualBalance = await provider.getBalance(lpAddress);
    
    console.log("Current pool state:");
    console.log("  iKAS reserve (tracked):", ethers.formatEther(ikas));
    console.log("  CONSTI:", ethers.formatEther(consti));
    console.log("  Owner:", owner);
    console.log("  Actual iKAS balance:", ethers.formatEther(actualBalance));
    console.log("  Delta:", ethers.formatEther(actualBalance - ikas), "iKAS");
    
    // Try to call syncReserve with gas estimation first
    console.log("\nCalling syncReserve...");
    try {
        const gasEstimate = await lp.syncReserve.estimateGas();
        console.log("Gas estimate:", gasEstimate.toString());
        
        const tx = await lp.syncReserve({ gasPrice, gasLimit: gasEstimate + 20000 });
        console.log("Tx:", tx.hash);
        await tx.wait();
        console.log("Synced!");
    } catch(e) {
        console.log("Error:", e.message);
        console.log("\nTrying with higher gas...");
        const tx = await lp.syncReserve({ gasPrice, gasLimit: 500000 });
        await tx.wait();
        console.log("Done!");
    }
    
    // Verify
    const [ikas2, consti2] = await lp.getReserves();
    console.log("\nAfter sync:");
    console.log("  iKAS reserve:", ethers.formatEther(ikas2));
}

main().then(() => process.exit(0)).catch(console.error);