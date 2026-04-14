const ethers = require("ethers");
const fs = require("fs");

const PRIV_KEY = "7039957ecf9fa672aa553f31445a336589bbf490cdd02007b21539ea5f4b098e";
const RPC_URL = "https://galleon-testnet.igralabs.com:8545";

const CONSTI_ADDRESS = "0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC";
const CENTRAL_BANK_ADDRESS = "0xf8bea045952b3a095AbC10d93139f8D08095403a";
const NEW_POOL_ADDRESS = "0xe07dC9125560b045377553d673b2b5a96f223F7f";

const CONSTI_ABI = [
    "function liquidityPool() view returns (address)",
    "function centralBank() view returns (address)",
    "function pendingRewards(address) view returns (uint256)"
];

const CENTRAL_BANK_ABI = [
    "function liquidityPool() view returns (address)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIV_KEY, provider);
    
    console.log("Checking contract references...\n");
    
    const constiCoin = new ethers.Contract(CONSTI_ADDRESS, CONSTI_ABI, provider);
    const centralBank = new ethers.Contract(CENTRAL_BANK_ADDRESS, CENTRAL_BANK_ABI, provider);
    
    const constiLP = await constiCoin.liquidityPool();
    const constiCB = await constiCoin.centralBank();
    const centralBankLP = await centralBank.liquidityPool();
    
    console.log("ConstiCoin.liquidityPool:", constiLP);
    console.log("ConstiCoin.centralBank:", constiCB);
    console.log("CentralBank.liquidityPool:", centralBankLP);
    console.log("\nExpected pool:", NEW_POOL_ADDRESS);
    
    if (constiLP.toLowerCase() !== NEW_POOL_ADDRESS.toLowerCase()) {
        console.log("\n⚠️ MISMATCH! ConstiCoin points to old pool");
    }
    if (centralBankLP.toLowerCase() !== NEW_POOL_ADDRESS.toLowerCase()) {
        console.log("⚠️ MISMATCH! CentralBank points to old pool");
    }
}

main().catch(console.error);
