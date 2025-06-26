# WalkScape Frontend

A mobile-first social exploration game built on Starknet where users collect real-world locations, grow digital biomes, and participate in social colonies.

## Features

### Core Game Mechanics
- **Touch Grass**: Check-in at outdoor locations to earn XP and maintain streaks
- **Scan & Discover**: Claim location-based artifacts (Mushrooms, Fossils, Graffiti, Pixel Plants)
- **Digital Pets**: Mint, feed, and evolve pets in your personal biome
- **Social Colonies**: Join or create colonies with other players
- **Growth Staking**: Stake tokens to grow legendary pets with special traits

### Technical Features
- **Starknet Integration**: Full smart contract interaction via Starknet wallets
- **Mobile-First Design**: Responsive UI optimized for mobile exploration
- **Professional UI**: Clean design with green, white, and gray color scheme
- **Real-time Updates**: Live stats and game state synchronization

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Starknet wallet (ArgentX or Braavos)
- WalkScape smart contract deployed on Starknet

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed contract address
   - `NEXT_PUBLIC_RPC_URL`: Starknet RPC endpoint

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open app**: Navigate to [http://localhost:3000](http://localhost:3000)

## How to Play

### Getting Started
1. **Connect Wallet**: Connect your Starknet wallet (ArgentX/Braavos)
2. **Register Player**: Complete one-time registration on the blockchain
3. **Touch Grass**: Use location services to verify outdoor presence
4. **Scan Locations**: Claim artifacts at different locations

### Growing Your Biome
- **Mint Pets**: Spend 100 XP to mint new digital companions
- **Feed & Care**: Maintain pet happiness with good nutrition
- **Evolution**: Watch pets evolve as they level up

### Social Features
- **Create Colony**: Start your own exploration community
- **Join Colony**: Connect with other players for shared XP benefits
- **Leaderboards**: Compete in weekly challenges

### Advanced Features
- **Staking**: Lock tokens to grow legendary pets with special traits
- **Artifact Trading**: Collect rare location-based NFTs
- **Streak Building**: Maintain daily check-ins for bonus rewards

## Architecture

### Smart Contract Integration
```typescript
// Contract interaction example
import { getContract } from '@/lib/starknet';

const contract = getContract(account);
await contract.touch_grass_checkin(locationHash);
```

### Component Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx   # Player stats and overview
│   ├── ArtifactScanner.tsx  # Location scanning
│   ├── Garden.tsx      # Pet and artifact management
│   ├── Colony.tsx      # Social features
│   └── Staking.tsx     # Growth staking
├── contexts/           # React contexts
│   └── WalletContext.tsx    # Wallet state management
├── lib/               # Utilities
│   └── starknet.ts    # Starknet configuration
└── app/               # Next.js app directory
```

### Key Technologies
- **Next.js 15**: React framework with Turbopack
- **Tailwind CSS 4**: Utility-first styling
- **Starknet.js**: Blockchain interaction
- **get-starknet**: Wallet connection
- **Lucide React**: Icon library

## Design System

### Color Palette
- **Forest Dark**: Primary background (#1a2f1a)
- **Slate Grays**: UI elements and cards
- **Green Accents**: Primary actions and success states
- **Nature Colors**: Artifact and element-specific colors

### Component Classes
```css
.btn-primary        /* Green primary buttons */
.btn-secondary      /* Secondary actions */
.card              /* Basic card layout */
.card-forest       /* Nature-themed cards */
.stat-card         /* Statistics display */
.artifact-card     /* Artifact display */
.pet-card          /* Pet management */
```

## Mobile Optimization

- **Responsive Design**: Optimized for 375px+ screens
- **Touch-Friendly**: Large tap targets and gestures
- **Location Services**: GPS integration for real-world mechanics
- **Offline Support**: Cached data for intermittent connectivity

## Configuration

### Contract ABI
The contract ABI is defined in `src/lib/starknet.ts` and includes all WalkScape game functions:
- Player management (register, stats, XP updates)
- Artifact claiming and ownership
- Pet minting, feeding, and evolution
- Colony creation and management
- Staking and reward systems

### Environment Variables
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...  # Deployed contract
NEXT_PUBLIC_RPC_URL=https://...     # Starknet RPC endpoint
```

## Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
```bash
npm run build
npm start
```

## 🧪 Testing

The frontend is designed to work with the WalkScape smart contract test suite. Ensure your contract is properly deployed and all functions are working before frontend testing.

### Contract Functions Used
- `register_player()` - Player onboarding
- `touch_grass_checkin()` - Location check-ins  
- `claim_artifact()` - Artifact collection
- `mint_pet()` - Pet creation
- `feed_pet()` - Pet care
- `create_colony()` / `join_colony()` - Social features
- `stake_for_growth()` / `harvest_growth_reward()` - Staking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes following the design system
4. Test with the smart contract
5. Submit a pull request

## 📄 License

This project is part of the WalkScape ecosystem. See the main repository for license details.

## 🔗 Links

- [Smart Contract Repository](../walkscape/)
- [Starknet Documentation](https://docs.starknet.io/)
- [Next.js Documentation](https://nextjs.org/docs)
