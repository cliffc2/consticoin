const ethers = require("ethers");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const NEW_POOL = "0xEb2a2660f0D3979786071DBE28Acf3d1f9334DB0";
const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    const feeData = await provider.getFeeData();
    
    const consti = new ethers.Contract(CONSTI_ADDRESS, [
        "function updateLiquidityPool(address _lp)"
    ], wallet);
    
    console.log("Updating ConstiCoin liquidityPool to new pool...");
    try {
        const tx = await consti.updateLiquidityPool(NEW_POOL, {
            nonce: nonce,
            gasPrice: feeData.gasPrice,
            gasLimit: 50000
        });
        console.log("Tx:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Confirmed! Block:", receipt.blockNumber);
    } catch (e) {
        console.log("Error:", e.message);
    }
}

main().catch(console.error);
