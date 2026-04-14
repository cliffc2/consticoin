const ethers = require("ethers");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const OLD_POOL = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

const ABI = ["function syncReserve()"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const pool = new ethers.Contract(OLD_POOL, ABI, wallet);
    
    console.log("Calling syncReserve() on existing pool...");
    
    try {
        const tx = await pool.syncReserve({ gasLimit: 100000, gasPrice: ethers.parseUnits("2200", "gwei") });
        console.log("Tx:", tx.hash);
        await tx.wait();
        console.log("✅ Reserve synced!");
    } catch (e) {
        console.log("Error:", e.message);
    }
}

main().catch(console.error);
