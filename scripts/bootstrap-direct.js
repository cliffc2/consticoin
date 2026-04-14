require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
    console.log("\n=== Direct Bootstrap ===\n");
    
    const provider = new ethers.JsonRpcProvider("https://galleon-testnet.igralabs.com:8545");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 200000 };
    
    const constiCoinAddr = "0xf654b3CBCE365062a35EEE758ace4f15Aa51B774";
    const liquidityPoolAddr = "0xe723Fb8b3841146a360A8cFa06090C7F3f41A032";
    
    // ConstiCoin ABI with mint function
    const constiABI = [
        "function mint(address to, uint256 amount) external",
        "function totalSupply() view returns (uint256)"
    ];
    
    const constiCoin = new ethers.Contract(constiCoinAddr, constiABI, wallet);
    
    // Check current supply
    const supply = await constiCoin.totalSupply();
    console.log("Current supply:", ethers.formatEther(supply));
    
    if (parseFloat(ethers.formatEther(supply)) === 0) {
        console.log("\nMinting 10000 CONSTI to liquidity pool...");
        const tx = await constiCoin.mint(liquidityPoolAddr, ethers.parseEther("10000"), deployOptions);
        console.log("Tx:", tx.hash);
        const receipt = await tx.wait();
        console.log("Confirmed in block:", receipt.blockNumber);
    }
    
    // Verify
    const newSupply = await constiCoin.totalSupply();
    console.log("\nNew supply:", ethers.formatEther(newSupply));
}

main()
    .then(() => process.exit(0))
    .catch(console.error);