const ethers = require("ethers");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
const CENTRAL_BANK_ADDRESS = "0xf8bea045952b3a095AbC10d93139f8D08095403a";
const NEW_POOL_ADDRESS = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

const CONSTI_ABI = [
    "function setLiquidityPool(address _lp)"
];

const CENTRAL_BANK_ABI = [
    "function setLiquidityPool(address _lp)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    console.log("Setting liquidity pool references...\n");
    
    const constiCoin = new ethers.Contract(CONSTI_ADDRESS, CONSTI_ABI, wallet);
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, CENTRAL_BANK_ABI, wallet);
    
    const gasPrice = ethers.parseUnits("2200", "gwei");
    const deployOptions = { gasPrice: gasPrice, gasLimit: 100000 };
    
    console.log("1. Setting ConstiCoin.liquidityPool...");
    try {
        const tx1 = await constiCoin.setLiquidityPool(NEW_POOL_ADDRESS, deployOptions);
        console.log("   Tx:", tx1.hash);
        await tx1.wait();
        console.log("   ✅ Done!");
    } catch (e) {
        console.log("   ❌ Error:", e.message);
    }
    
    console.log("\n2. Setting CentralBank.liquidityPool...");
    try {
        const tx2 = await centralBank.setLiquidityPool(NEW_POOL_ADDRESS, deployOptions);
        console.log("   Tx:", tx2.hash);
        await tx2.wait();
        console.log("   ✅ Done!");
    } catch (e) {
        console.log("   ❌ Error:", e.message);
    }
    
    console.log("\nDone! Pool references updated.");
}

main().catch(console.error);
