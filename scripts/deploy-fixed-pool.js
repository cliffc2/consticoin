require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 3000000 };
    
    // Get current ConstiCoin address
    const constiCoinAddr = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    
    // Deploy new LiquidityPool
    const artifactsPath = path.join(__dirname, '..', 'artifacts');
    const poolArtifact = JSON.parse(fs.readFileSync(path.join(artifactsPath, 'contracts', 'LiquidityPool.sol', 'LiquidityPool.json')));
    const LiquidityPool = new ethers.ContractFactory(poolArtifact.abi, poolArtifact.bytecode, wallet);
    
    console.log("Deploying new LiquidityPool...");
    const liquidityPool = await LiquidityPool.deploy(wallet.address, constiCoinAddr, deployOptions);
    await liquidityPool.waitForDeployment();
    const liquidityPoolAddr = await liquidityPool.getAddress();
    console.log("New LiquidityPool:", liquidityPoolAddr);
    
    // Mint some CONSTI to new pool
    const constiABI = ["function emergencyMint(address to, uint256 amount)"];
    const constiCoin = new ethers.Contract(constiCoinAddr, constiABI, wallet);
    await constiCoin.emergencyMint(liquidityPoolAddr, ethers.parseEther("1000"), deployOptions);
    console.log("Minted 1000 CONSTI to new pool");
    
    // Test swap
    console.log("\nTesting swap...");
    const tx = await liquidityPool.swapIKASForConsti({
        value: ethers.parseEther("1"),
        gasPrice: gasPrice,
        gasLimit: 300000
    });
    const receipt = await tx.wait();
    console.log("Swap success! Tx:", receipt.hash);
    
    // Check balances
    const balanceABI = ["function balanceOf(address) view returns (uint256)"];
    const consti = new ethers.Contract(constiCoinAddr, balanceABI, provider);
    const userBal = await consti.balanceOf(wallet.address);
    console.log("User CONSTI balance:", ethers.formatEther(userBal));
}

main().then(() => process.exit(0)).catch(console.error);