const ethers = require("ethers");

const RPC_URL = "https://galleon-testnet.igralabs.com:8545";
const POOL_ADDRESS = "0xe07dC9125560b045377553d673b2b5a96f223F7f";
const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";

const ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function iKASReserve() view returns (uint256)",
    "function getReserves() view returns (uint256, uint256)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const pool = new ethers.Contract(POOL_ADDRESS, ABI, provider);
    const consti = new ethers.Contract(CONSTI_ADDRESS, ABI, provider);
    
    const poolConsti = await consti.balanceOf(POOL_ADDRESS);
    const reserve = await pool.iKASReserve();
    const [ikasR, constiR] = await pool.getReserves();
    const poolBalance = await provider.getBalance(POOL_ADDRESS);
    
    console.log("Pool iKAS Reserve (tracked):", ethers.formatEther(reserve));
    console.log("Pool iKAS Balance (actual):", ethers.formatEther(poolBalance));
    console.log("getReserves(): iKAS=", ethers.formatEther(ikasR), "CONSTI=", ethers.formatEther(constiR));
    console.log("Pool CONSTI balance:", ethers.formatEther(poolConsti));
}

main().catch(console.error);
