const ethers = require("ethers");

const RPC_URL = "https://galleon-testnet.igralabs.com:8545";
const lpAddress = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

const lpABI = [
    "function getReserves() view returns (uint256, uint256)",
    "function getPrice() view returns (uint256)",
    "function SWAP_FEE() view returns (uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pool = new ethers.Contract(lpAddress, lpABI, provider);
    
    const [ikas, consti] = await pool.getReserves();
    const price = await pool.getPrice();
    const fee = await pool.SWAP_FEE();
    
    console.log("=== LP Analysis ===");
    console.log("Tracked iKAS:", ethers.formatEther(ikas));
    console.log("CONSTI:", ethers.formatEther(consti));
    console.log("Price:", ethers.formatEther(price), "iKAS/CONSTI");
    console.log("Swap fee:", fee.toString(), "bps (0.3%)");
    console.log("");
    
    // Calculate output for 200 iKAS swap
    const input = ethers.parseEther("200");
    const feeAmount = (input * fee) / 10000n;
    const netIn = input - feeAmount;
    
    // Formula: constiOut = (netIn * constiBal) / baseReserve
    // baseReserve = max(iKASReserve, 0.1 iKAS)
    const baseReserve = ikas > ethers.parseEther("0.1") ? ikas : ethers.parseEther("0.1");
    const constiOut = (netIn * consti) / baseReserve;
    
    console.log("Swap 200 iKAS:");
    console.log("  Fee:", ethers.formatEther(feeAmount));
    console.log("  Net in:", ethers.formatEther(netIn));
    console.log("  Would get:", ethers.formatEther(constiOut), "CONSTI");
    console.log("");
    console.log("Pool can fill this:", constiOut <= consti ? "YES" : "NO");
    console.log("");
    
    // Check if the issue is the tracked reserve
    console.log("=== Issue Analysis ===");
    console.log("Using", ethers.formatEther(baseReserve), "as base reserve");
    console.log("If base reserve = actual balance:", ethers.formatEther(ethers.parseEther("2597.68")));
    const actualOut = (netIn * consti) / ethers.parseEther("2597.68");
    console.log("  Output would be:", ethers.formatEther(actualOut), "CONSTI");
}

main().catch(console.error);