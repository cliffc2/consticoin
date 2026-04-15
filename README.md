# ConstiCoin - Algorithmic Stablecoin

Algorithmic stablecoin pegged to Constitutional Dollar (371.25 grains silver = 0.7734375 oz) deployed on Igra Galleon Testnet.

## Inspired by Dexy

This implementation is based on the **Dexy** algorithmic stablecoin protocol by Alexander Chepurnoy (kushti).

### Paper:
- **[Dexy: A Stablecoin](https://github.com/kushti/dexy-stable/blob/master/paper-lipics/dexy.pdf)** - Academic paper by Alexander Chepurnoy

Dexy is a crypto-backed algorithmic stablecoin with a novel approach to stability through reserve mechanisms. ConstiCoin adapts these principles for the IGRA/EVM ecosystem.

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
                           │
                           ▼
              ┌────────────────────────┐
              │   Kaspa L1 Covenants   │
              │  (SilverScript Vault)  │
              └────────────────────────┘
```

## Hybrid L1 + L2 Safety

This implementation includes **Kaspa L1 covenants** for ironclad security:

### Safety Rules Enforced by L1 Covenants

1. **Reserve Vault Covenant**
   - Reserves can only be spent for legitimate "contraction" (buyback) actions
   - Requires proof that L2 is under peg (>10% deviation)

2. **Emergency Unwind Covenant**
   - If peg deviation >10% for >48 hours, allows slow time-locked return to holders
   - Protects against complete protocol failure

3. **No Unauthorized Drain**
   - Any L1 spend must come from verified L2 bridge call + proof
   - Cannot be bypassed even if L2 contracts are exploited

### SilverScript Covenant (`contracts/covenants/ConstiReserveVault.silver`)

- Written in SilverScript (Kaspa smart contract language)
- Compiles to Kaspa script hash
- Locks reserves on Kaspa L1 with unbreakable rules

### L2 Bridge Integration (`CentralBank.sol`)

- `setBridge(address)` - Sets L2 bridge address
- `requestL1Contraction(amount)` - Requests L1 contraction when under peg
- `triggerEmergencyUnwind()` - Triggers emergency unwind after 48h delay
- `getDeviation()` - Returns current peg deviation in bps

## Deployed Contracts (IGRA Galleon Testnet)

| Contract | Address |
|----------|---------|
| ConstiCoin | `0x2a9E9C6a89fAb3C32946554AFF2BE9D3C2c2EFDC` |
| CentralBank | `0x45F208d9c22E2367c0eFc7C08a01DC3ef56D34f6` |
| LiquidityPool | `0xe07dC9125560b045377553d673b2b5a96f223F7f` |
| ConstiOracle | `0x47816a48f90544f2fF964ec7f71D1e3C29049c2b` |

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
- `CentralBank.sol` - Peg management with L1 bridge integration
- `LiquidityPool.sol` - AMM with swap fees
- `covenants/ConstiReserveVault.silver` - Kaspa L1 safety covenant

## Safety Rules

| Rule | Description | Threshold |
|------|-------------|------------|
| Circuit Breaker | Auto-pause if peg deviates | 10% (configurable) |
| Contraction Limit | Max burn per rebase | 2% of supply |
| Expansion Limit | Max mint per rebase | 2% of supply |
| Emergency Delay | Time before emergency unwind | 48 hours |
| Price Staleness | Max age of oracle price | 1 hour |

## License

MIT
