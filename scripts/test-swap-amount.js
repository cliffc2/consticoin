require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    
    const constiCoinAddr = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
    const liquidityPoolAddr = "0x3F3aAFF76fB6918Ad04A94FBfa212cde85749735";
    
    // Check pool state
    const erc20ABI = ["function balanceOf(address) view returns (uint256)"];
    const constiCoin = new ethers.Contract(constiCoinAddr, erc20ABI, provider);
    
    const poolConsti = await constiCoin.balanceOf(liquidityPoolAddr);
    console.log("Pool CONSTI balance:", ethers.formatEther(poolConsti));
    
    // Try the swap with a larger amount
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const poolABI = ["function swapIKASForConsti() payable"];
    const liquidityPool = new ethers.Contract(liquidityPoolAddr, poolABI, wallet);
    
    // Try with 10 iKAS instead of 1
    const gasPrice = ethers.parseUnits("2200", "gwei");
    console.log("\nTrying swap with 10 iKAS...");
    try {
        const tx = await liquidityPool.swapIKASForConsti({
            value: ethers.parseEther("10"),
            gasPrice: gasPrice,
            gasLimit: 300000
        });
        const receipt = await tx.wait();
        console.log("Success! Tx:", receipt.hash);
        
        const userBalance = await constiCoin.balanceOf(wallet.address);
        console.log("User CONSTI balance:", ethers.formatEther(userBalance));
    } catch(e) {
        console.log("Error:", e.message);
    }
}

main().then(() => process.exit(0)).catch(console.error);