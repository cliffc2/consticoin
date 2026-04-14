require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    
    // Current pool
    const poolAddr = "0x3F3aAFF76fB6918Ad04A94FBfa212cde85749735";
    const poolABI = ["function getReserves() view returns (uint256, uint256)"];
    const pool = new ethers.Contract(poolAddr, poolABI, provider);
    
    // Add iKAS directly to pool via receive() - this will increase reserves
    console.log("Sending iKAS to pool...");
    const tx = await wallet.sendTransaction({
        to: poolAddr,
        value: ethers.parseEther("100"), // Add 100 iKAS to pool
        gasPrice: gasPrice,
        gasLimit: 50000
    });
    await tx.wait();
    console.log("Sent 100 iKAS to pool");
    
    // Check new reserves
    const [ikas, consti] = await pool.getReserves();
    console.log("New iKAS reserve:", ethers.formatEther(ikas));
    console.log("CONSTI reserve:", ethers.formatEther(consti));
}

main().then(() => process.exit(0)).catch(console.error);