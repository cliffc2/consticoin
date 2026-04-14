require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 3000000 };
    
    const constiCoinAddr = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    
    // Deploy new LiquidityPool with fixed swap
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    const poolArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'LiquidityPool.sol', 'LiquidityPool.json')));
    const LiquidityPool = new ethers.ContractFactory(poolArtifact.abi, poolArtifact.bytecode, wallet);
    
    console.log("Deploying new LiquidityPool...");
    const liquidityPool = await LiquidityPool.deploy(wallet.address, constiCoinAddr, deployOptions);
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddr = await liquidityPool.getAddress();
    console.log("New LiquidityPool:", liquidityPoolAddr);
    
    // Seed with 1000 CONSTI and 100 iKAS (via deposit)
    const constiABI = ["function transfer(address to, uint256 amount)"];
    const constiCoin = new ethers.Contract(constiCoinAddr, constiABI, wallet);
    
    // Transfer CONSTI to pool
    await constiCoin.transfer(liquidityPoolAddr, ethers.parseEther("1000"), deployOptions);
    console.log("Transferred 1000 CONSTI to pool");
    
    // Send iKAS to pool
    await wallet.sendTransaction({
        to: liquidityPoolAddr,
        value: ethers.parseEther("100"),
        gasPrice: gasPrice,
        gasLimit: 50000
    });
    console.log("Sent 100 iKAS to pool");
    
    // Manually set the reserve to match actual balance (seedLiquidity function)
    // This requires calling seedLiquidity which should set both reserves
    try {
        // First try seedLiquidity with 0 to initialize reserves properly
        await liquidityPool.seedLiquidity(ethers.parseEther("0"), deployOptions);
    } catch(e) {
        console.log("seedLiquidity error (may be ok):", e.message);
    }
    
    // Now test swap
    console.log("\nTesting swap...");
    try {
        const tx = await liquidityPool.swapIKASForConsti({
            value: ethers.parseEther("1"),
            gasPrice: gasPrice,
            gasLimit: 300000
        });
        const receipt = await tx.wait();
        console.log("SUCCESS! Tx:", receipt.hash);
        
        // Check result
        const balABI = ["function balanceOf(address) view returns (uint256)"];
        const consti = new ethers.Contract(constiCoinAddr, balABI, provider);
        const userBal = await consti.balanceOf(wallet.address);
        console.log("User got:", ethers.formatEther(userBal), "CONSTI");
    } catch(e) {
        console.log("Swap error:", e.message);
    }
    
    // Save new address
    console.log("\n=== New Pool Address ===");
    console.log(liquidityPoolAddr);
}

main().then(() => process.exit(0)).catch(console.error);