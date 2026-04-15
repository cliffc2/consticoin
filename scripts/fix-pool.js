const ethers = require("ethers");

const RPC_URL = "https://galleon-testnet.igralabs.com:8545";
const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";

const lpAddress = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    // Try to call with explicit gas settings
    console.log("Sending iKAS to pool to trigger receive...");
    
    // First just send iKAS to the pool 
    const tx = await wallet.sendTransaction({
        to: lpAddress,
        value: ethers.parseEther("1"), // smallest amount
        gasLimit: 50000,
        gasPrice: ethers.parseUnits("2200", "gwei")
    });
    await tx.wait();
    console.log("Sent 1 iKAS. Let's see if receive() updates reserve...");
    
    // The pool should auto-update on receive() in many implementations but let's debug
    const pool = new ethers.Contract(lpAddress, [
        "function getReserves() view returns (uint256, uint256)",
        "receive() external payable"
    ], provider);
    
    const [ikas, consti] = await pool.getReserves();
    console.log("\nAfter send:");
    console.log("iKAS:", ethers.formatEther(ikas));
}

main().catch(console.error);