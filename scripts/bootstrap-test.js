require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("\n=== ConstiCoin Bootstrap Test ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Contract addresses
    const constiCoinAddr = "0xf654b3CBCE365062a35EEE758ace4f15Aa51B774";
    const liquidityPoolAddr = "0xe723Fb8b3841146a360A8cFa06090C7F3f41A032";
    const centralBankAddr = "0x24707881b0b3033e9D04DD1C9D3DbA738C6C8341";
    
    // ABI
    const constiABI = ["function balanceOf(address) view returns (uint256)", "function totalSupply() view returns (uint256)"];
    const poolABI = ["function getReserves() view returns (uint256, uint256)", "function getPrice() view returns (uint256)"];
    const bankABI = ["function getTargetPrice() view returns (uint256)", "function currentSilverPrice() view returns (uint256)"];
    
    const constiCoin = new ethers.Contract(constiCoinAddr, constiABI, provider);
    const liquidityPool = new ethers.Contract(liquidityPoolAddr, poolABI, provider);
    const centralBank = new ethers.Contract(centralBankAddr, bankABI, provider);
    
    // Check total supply
    const totalSupply = await constiCoin.totalSupply();
    console.log("CONSTI Total Supply:", ethers.formatEther(totalSupply));
    
    // Check pool reserves
    const [ikasReserve, constiReserve] = await liquidityPool.getReserves();
    console.log("\nLiquidity Pool:");
    console.log("  iKAS Reserve:", ethers.formatEther(ikasReserve));
    console.log("  CONSTI Reserve:", ethers.formatEther(constiReserve));
    
    // Check pool price
    try {
        const poolPrice = await liquidityPool.getPrice();
        console.log("  Pool Price:", ethers.formatEther(poolPrice), "iKAS/CONSTI");
    } catch(e) {
        console.log("  Pool Price: Error -", e.message);
    }
    
    // Check central bank
    try {
        const silverPrice = await centralBank.currentSilverPrice();
        console.log("\nCentral Bank:");
        console.log("  Silver Price:", silverPrice.toString());
        const targetPrice = await centralBank.getTargetPrice();
        console.log("  Target Price:", ethers.formatEther(targetPrice), "iKAS");
    } catch(e) {
        console.log("\nCentral Bank: Not initialized");
    }
    
    // Check deployer balance
    const deployerBalance = await constiCoin.balanceOf(wallet.address);
    console.log("\nDeployer CONSTI Balance:", ethers.formatEther(deployerBalance));
    
    console.log("\n=== Bootstrap Status ===");
    if (parseFloat(ethers.formatEther(constiReserve)) === 0) {
        console.log("❌ Pool has 0 CONSTI - swaps won't work");
        console.log("\nSolutions:");
        console.log("1. Add CONSTI to pool (transfer to pool address)");
        console.log("2. Or submit silver price + trigger rebase");
    } else {
        console.log("✅ Pool has CONSTI - swaps should work");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });