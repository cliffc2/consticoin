const ethers = require("ethers");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const NEW_POOL = "0xEb2a2660f0D3979786071DBE28Acf3d1f9334DB0";
const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
const CENTRAL_BANK = "0xf8bea045952b3a095AbC10d93139f8D08095403a";

const CONSTI_ABI2 = ["function setLiquidityPool(address _lp)"];
const CENTRAL_ABI = ["function setLiquidityPool(address _lp)"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const balance = await provider.getBalance(wallet.address);
    console.log("Wallet balance:", ethers.formatEther(balance), "iKAS");
    
    console.log("Setting references...");
    const consti = new ethers.Contract(CONSTI_ADDRESS, CONSTI_ABI2, wallet);
    const central = new ethers.Contract(CENTRAL_BANK, CENTRAL_ABI, wallet);
    
    const gasPrice = ethers.parseUnits("2000", "gwei");
    
    const tx2 = await consti.setLiquidityPool(NEW_POOL, { gasPrice });
    await tx2.wait();
    console.log("✅ ConstiCoin liquidityPool set");
    
    const tx3 = await central.setLiquidityPool(NEW_POOL, { gasPrice });
    await tx3.wait();
    console.log("✅ CentralBank liquidityPool set");
    
    console.log("\nDone! New pool:", NEW_POOL);
}

main().catch(console.error);
