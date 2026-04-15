const ethers = require("ethers");

const RPC_URL = "https://galleon-testnet.igralabs.com:8545";
const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const lpAddress = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

const ABI = [
    "function getReserves() view returns (uint256, uint256)",
    "function owner() view returns (address)",
    "function syncReserve()"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    const pool = new ethers.Contract(lpAddress, ABI, wallet);
    
    const [ikas, consti] = await pool.getReserves();
    const owner = await pool.owner();
    const actualBalance = await provider.getBalance(lpAddress);
    
    console.log("=== Pool Status ===");
    console.log("iKAS tracked:", ethers.formatEther(ikas));
    console.log("CONSTI:", ethers.formatEther(consti));
    console.log("Actual iKAS:", ethers.formatEther(actualBalance));
    console.log("Mismatch:", ethers.formatEther(actualBalance - ikas));
    console.log("Owner:", owner);
    console.log("");
    
    console.log("Syncing reserve...");
    try {
        const tx = await pool.syncReserve({ 
            gasLimit: 100000, 
            gasPrice: ethers.parseUnits("2200", "gwei") 
        });
        console.log("Tx:", tx.hash);
        await tx.wait();
        console.log("Synced!");
    } catch (e) {
        console.log("Error:", e.message);
        return;
    }
    
    const [ikas2, consti2] = await pool.getReserves();
    console.log("\nAfter sync:");
    console.log("iKAS tracked:", ethers.formatEther(ikas2));
}

main().catch(console.error);