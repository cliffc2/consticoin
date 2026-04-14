require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 300000 };
    
    const constiCoinAddr = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    const liquidityPoolAddr = "0x3F3aAFF76fB6918Ad04A94FBfa212cde85749735";
    
    // Check pool
    const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
    const constiCoin = new ethers.Contract(constiCoinAddr, erc20ABI, provider);
    const poolBalance = await constiCoin.balanceOf(liquidityPoolAddr);
    console.log("CONSTI balance of pool:", ethers.formatEther(poolBalance));
    
    // Try swap
    const poolABI = ["function swapIKASForConsti() payable"];
    const liquidityPool = new ethers.Contract(liquidityPoolAddr, poolABI, wallet);
    
    console.log("\nTrying swap: 1 iKAS -> CONSTI");
    try {
        const tx = await liquidityPool.swapIKASForConsti({
            value: ethers.parseEther("1"),
            gasPrice: gasPrice,
            gasLimit: 300000
        });
        const receipt = await tx.wait();
        console.log("Tx:", receipt.hash);
        console.log("Status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
        
        const userBalance = await constiCoin.balanceOf(wallet.address);
        console.log("\nUser CONSTI balance:", ethers.formatEther(userBalance));
    } catch(e) {
        console.log("Error:", e.message);
    }
}

main().then(() => process.exit(0)).catch(console.error);