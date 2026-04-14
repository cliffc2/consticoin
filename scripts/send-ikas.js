const ethers = require("ethers");

const PRIV_KEY = process.env.PRIVATE_KEY || "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = process.env.RPC_URL || "https://galleon-testnet.igralabs.com:8545";

const POOL = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    console.log("Wallet:", wallet.address);
    console.log("Sending 1 iKAS to pool...");
    
    const tx = await wallet.sendTransaction({
        to: POOL,
        value: ethers.parseEther("1"),
        gasLimit: 21000,
        gasPrice: ethers.parseUnits("2000", "gwei")
    });
    
    console.log("Tx:", tx.hash);
    await tx.wait();
    console.log("✅ Done!");
    
    const balance = await provider.getBalance(POOL);
    console.log("Pool balance:", ethers.formatEther(balance), "iKAS");
}

main().catch(e => console.log("Error:", e.message));
