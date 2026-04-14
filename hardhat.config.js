require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  paths: {
    sources: "./contracts",
    cache: "./cache", 
    artifacts: "./artifacts"
  },
  
  networks: {
    galleonTestnet: {
      url: process.env.RPC_URL || "https://galleon-testnet.igralabs.com:8545",
      chainId: parseInt(process.env.CHAIN_ID) || 38836,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  
  etherscan: {
    apiKey: {
      galleonTestnet: "no-api-key-needed"
    },
    customChains: [
      {
        network: "galleonTestnet",
        chainId: 38836,
        urls: {
          apiURL: "https://explorer.galleon-testnet.igralabs.com/api",
          browserURL: "https://explorer.galleon-testnet.igralabs.com"
        }
      }
    ]
  }
};