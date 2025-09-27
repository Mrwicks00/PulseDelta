# PulseDelta - Dual Revenue Prediction Market

<div align="center">
    <img width="400px" src="https://blockdag.network/images/presskit/Logo.svg" align="center" alt="BlockDAG" />
    <br>
    <h3>Creator + LP Rewards Prediction Market Platform</h3>
</div>

## Overview

PulseDelta is a decentralized prediction market platform built on BlockDAG that enables users to create, trade, and provide liquidity for prediction markets. The platform features a unique dual revenue model where both market creators and liquidity providers earn rewards from trading fees.

## Key Features

### 🎯 **Dual Revenue Model**

- **Creator Rewards**: Market creators earn 30% of trading fees from their markets
- **LP Rewards**: Liquidity providers earn 40% of trading fees from markets they support
- **Protocol Revenue**: 30% of fees go to protocol development

### 📊 **Market Types**

- **Binary Markets**: Yes/No prediction markets
- **Multi-Outcome Markets**: Multiple choice predictions
- **Scalar Markets**: Range-based predictions

### 💰 **Trading System**

- **wDAG Collateral**: Native DAG wrapped as ERC20 for trading
- **AMM Pricing**: Automated market maker with dynamic pricing
- **Real-time P&L**: Track potential profits from smart contract events
- **Sports Betting UX**: Focus on potential winnings, not losses

### 🏦 **Liquidity System**

- **LP Tokens**: ERC20 tokens representing liquidity pool shares
- **Fee Distribution**: Automatic fee accrual to LP token holders
- **Add/Remove Liquidity**: Simple interface for liquidity management

## Architecture Flow

### Market Creation Flow

```
User → BinaryMarketFactory → MarketBinary Contract
  ↓
1. User sends DAG for initial liquidity
2. Factory converts DAG → wDAG
3. Creates MarketBinary with initial liquidity
4. Deploys YES/NO outcome tokens
5. Deploys LP token for liquidity providers
6. Market becomes tradeable
```

### Trading Flow

```
Trader → Market Contract → Outcome Tokens
  ↓
1. Trader converts BDAG → wDAG
2. Approves market to spend wDAG
3. Calls buy() with outcome choice
4. Market calculates cost using AMM formula
5. Charges 1% fee (split: 30% protocol, 30% creator, 40% LP)
6. Mints outcome tokens to trader
7. Updates reserves (reduces supply, increases price)
8. Emits Bought event for tracking
```

### Liquidity Provider Flow

```
LP → Market Contract → LP Tokens
  ↓
1. LP sends DAG to addLiquidity()
2. Market converts DAG → wDAG
3. Mints LP tokens proportional to pool share
4. LP tokens accrue fees from trading
5. LP can removeLiquidity() to burn tokens
6. Receives wDAG + accumulated fees
```

### Fee Distribution Flow

```
Trading Fee (1%) → FeeRouter → Multiple Recipients
  ↓
├── 30% → Protocol Treasury
├── 30% → Market Creator
└── 40% → LP Pool (distributed to LP token holders)
```

### Market Resolution Flow

```
Oracle → Market Contract → Winners
  ↓
1. Market reaches endTime
2. Oracle provides final outcome
3. Market finalizes with winning outcome
4. Winners call redeem() to claim winnings
5. Winning tokens burned, wDAG distributed from pool
6. LP tokens retain value from accumulated fees
```

## Smart Contracts

### Core Contracts

#### **MarketBinary.sol**

- Main prediction market contract
- Handles trading, pricing, and resolution
- Manages YES/NO outcome tokens
- Implements AMM pricing model
- Tracks participant count and volume

#### **BinaryMarketFactory.sol**

- Factory for creating binary markets
- Handles initial liquidity setup
- Manages market registration
- Provides market discovery functions

#### **wDAG.sol**

- Wrapped DAG token (ERC20)
- 1:1 conversion with native DAG
- Used as collateral for all markets
- Supports deposit/withdraw functions

#### **LPToken.sol**

- ERC20 token representing LP shares
- Tracks liquidity pool ownership
- Accrues fees from trading activity
- Enables add/remove liquidity functions

#### **FeeRouter.sol**

- Centralized fee distribution system
- Routes fees to creators, LPs, and protocol
- Tracks lifetime earnings per creator
- Manages fee claiming functions

### Supporting Contracts

#### **OutcomeTokenFactory.sol**

- Factory for creating outcome tokens
- Ensures unique token addresses
- Manages token metadata

#### **Oracle Adapters**

- **OptimisticCryptoOracleAdapter.sol**: Crypto price feeds
- **SportsOptimisticOracleAdapter.sol**: Sports event results
- **TrendsOptimisticOracleAdapter.sol**: Social trends data

#### **Curation.sol**

- Market quality control system
- Community-driven market approval
- Prevents spam and low-quality markets

## Frontend Architecture

### Key Components

#### **Trading System**

- **TradeWidget.tsx**: Main trading interface
- **useTrading.ts**: Trading logic and state management
- **useTradingHistory.ts**: Fetches trade history from contract events
- **ProfitLossDisplay.tsx**: Shows potential profits (sports betting UX)

#### **Market Management**

- **MarketCard.tsx**: Market display component
- **MarketList.tsx**: Market browsing interface
- **MarketCreationWizard.tsx**: Market creation flow
- **useFactory.ts**: Factory contract interactions

#### **Liquidity System**

- **LiquidityPanel.tsx**: LP management interface
- **useLiquidity.ts**: Liquidity provision logic
- **lpDashboard.tsx**: LP portfolio view

#### **User Experience**

- **HeroCarousel.tsx**: Landing page carousel
- **Navigation.tsx**: Main navigation
- **WDAGBalance.tsx**: Balance display
- **ThemeToggle.tsx**: Dark/light mode

### State Management

- **Wagmi**: Web3 state management
- **TanStack Query**: Data fetching and caching
- **React Context**: Theme and global state
- **Local Storage**: User preferences

### Key Hooks

- **useMarket.ts**: Market data fetching
- **useFactory.ts**: Factory interactions
- **useTrading.ts**: Trading operations
- **useLiquidity.ts**: Liquidity management
- **useTradingHistory.ts**: Trade history from events
- **usePayouts.ts**: Payout calculations

## Technology Stack

### Blockchain

- **BlockDAG**: Native blockchain
- **Solidity**: Smart contract language
- **Hardhat**: Development environment
- **OpenZeppelin**: Security libraries

### Frontend

- **Next.js**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Wagmi**: Web3 integration
- **Viem**: Ethereum library

### Infrastructure

- **Supabase**: Metadata storage
- **WalletConnect**: Wallet integration
- **React Toastify**: Notifications

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn or npm
- BlockDAG wallet
- WalletConnect Project ID

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd PulseDelta
```

2. **Install dependencies**

```bash
# Frontend
cd frontend
yarn install

# Smart contracts
cd ../contracts/hardhat
yarn install
```

3. **Environment setup**

```bash
# Frontend (.env.local)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Smart contracts (.env)
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

4. **Start development**

```bash
# Frontend
cd frontend
yarn dev

# Smart contracts
cd contracts/hardhat
npx hardhat compile
npx hardhat test
```

### Deployment

1. **Deploy smart contracts**

```bash
cd contracts/hardhat
npx hardhat run scripts/deploy.ts --network primordial
```

2. **Update contract addresses**

```bash
# Update frontend/src/lib/abiAndAddress.ts
# Update contract addresses after deployment
```

3. **Build frontend**

```bash
cd frontend
yarn build
yarn start
```

## Usage Guide

### Creating a Market

1. Navigate to `/create`
2. Select market type (Binary/Multi/Scalar)
3. Enter market details and outcomes
4. Set end time and resolution deadline
5. Provide initial liquidity (DAG)
6. Submit for creation

### Trading

1. Browse markets at `/markets`
2. Select a market to view details
3. Choose outcome and amount
4. Convert BDAG to wDAG (automatic)
5. Approve market to spend wDAG
6. Execute trade

### Providing Liquidity

1. Navigate to market details page
2. Go to Liquidity Panel
3. Enter amount to add
4. Receive LP tokens
5. Earn fees from trading activity
6. Remove liquidity anytime

### Claiming Rewards

1. **Creators**: Claim fees from created markets
2. **LPs**: Fees automatically accrue to LP tokens
3. **Traders**: Claim winnings after market resolution

## Economic Model

### Fee Structure

- **Trading Fee**: 1% of trade value
- **Protocol Share**: 30% (0.3%)
- **Creator Share**: 30% (0.3%)
- **LP Share**: 40% (0.4%)

### Revenue Streams

1. **Market Creators**: Earn from trading fees on their markets
2. **Liquidity Providers**: Earn from providing liquidity
3. **Protocol**: Sustainable development funding
4. **Traders**: Profit from correct predictions

### Token Economics

- **wDAG**: Utility token for trading
- **LP Tokens**: Represent liquidity pool shares
- **Outcome Tokens**: Represent market positions

## Security Features

### Smart Contract Security

- **OpenZeppelin**: Battle-tested libraries
- **Access Control**: Role-based permissions
- **Reentrancy Protection**: Prevents attack vectors
- **Input Validation**: Comprehensive checks

### Frontend Security

- **Type Safety**: TypeScript throughout
- **Input Sanitization**: XSS prevention
- **Wallet Integration**: Secure connection
- **Error Handling**: Graceful failures

## Roadmap

### Phase 1: Core Platform ✅

- [x] Binary market implementation
- [x] Trading system
- [x] LP system
- [x] Fee distribution
- [x] Frontend interface

### Phase 2: Enhanced Features 🚧

- [x] Multi-outcome markets
- [x] Scalar markets
- [ ] Advanced trading features
- [ ] Mobile app
- [ ] API documentation

### Phase 3: Ecosystem Growth 📋

- [ ] Governance token
- [ ] Staking rewards
- [ ] Cross-chain support
- [ ] Institutional features
- [ ] Analytics dashboard

## Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards

- **Solidity**: Follow OpenZeppelin patterns
- **TypeScript**: Strict type checking
- **React**: Functional components with hooks
- **Testing**: Comprehensive test coverage

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [docs.pulsedelta.com](https://docs.pulsedelta.com)
- **Discord**: [discord.gg/pulsedelta](https://discord.gg/pulsedelta)
- **Twitter**: [@PulseDelta](https://twitter.com/pulsedelta)
- **GitHub**: [github.com/pulsedelta](https://github.com/pulsedelta)

## Acknowledgments

- **BlockDAG**: For the underlying blockchain
- **OpenZeppelin**: For security libraries
- **Wagmi**: For Web3 integration
- **Community**: For feedback and contributions

---

<div align="center">
    <p>Built with ❤️ on BlockDAG</p>
    <p>© 2024 PulseDelta. All rights reserved.</p>
</div>
