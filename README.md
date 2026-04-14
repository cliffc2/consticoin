# ConstiCoin - Algorithmic Stablecoin

Algorithmic stablecoin pegged to Constitutional Dollar (371.25 grains silver = 0.7734375 oz) deployed on Igra Galleon Testnet.

## Philosophy

- **Zero Pre-mine** - Cypherpunk philosophy, no privileged allocation
- **AI Protocol Control** - Autonomous agents manage the peg
- **Fee Flywheel** - Sustainable economics through trading fees

## Architecture

```
ConstiCoin (ERC20) ──► CentralBank (Peg Management)
                           │
                           ▼
                    LiquidityPool (AMM)
```

## Deployed Contracts (IGRA Galleon Testnet)

| Contract | Address |
|----------|---------|
| ConstiCoin | `0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC` |
| CentralBank | `0xf8bea045952b3a095AbC10d93139f8D08095403a` |
| LiquidityPool | `0xe07dC9125560b045377553d673b2b5a96f223F7f` |

## Network

- **Network**: IGRA Galleon Testnet
- **Chain ID**: 38836 (0x97B4)
- **RPC**: https://galleon-testnet.igralabs.com:8545
- **Explorer**: https://explorer.galleon-testnet.igralabs.com

## Peg

- **Target**: $1.00 USD = 371.25 grains silver = 0.7734375 oz silver
- **CONSTI Target Price**: Silver Price (USD/oz) × 0.7734375

## Development

```bash
cd consticoin
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network galleonTestnet
```

## Frontend

Serve over HTTP (not file://) for KasWare wallet injection:

```bash
cd consticoin
python3 -m http.server 8888
# Open http://localhost:8888/consti.html
```

## Smart Contracts

- `ConstiCoin.sol` - ERC20 token with fee distribution
- `CentralBank.sol` - Peg management and price feeds
- `LiquidityPool.sol` - AMM with swap fees

## License

MIT
