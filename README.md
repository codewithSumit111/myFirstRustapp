# 🎫 NFT Event Ticketing dApp

A full-stack, on-chain event ticketing system built with **Rust/Stylus** smart contracts on Arbitrum and a **Next.js** frontend. Attendees mint NFT tickets, view them with QR codes, and event staff scan to verify — all backed by immutable blockchain state.

![Arbitrum Stylus](https://img.shields.io/badge/Arbitrum-Stylus-blue?style=flat-square)
![ERC-721](https://img.shields.io/badge/Token-ERC--721-purple?style=flat-square)
![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square)
![Rust](https://img.shields.io/badge/Contract-Rust-orange?style=flat-square)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Mint NFT Tickets** | Select from upcoming events, choose a seat section, and mint a unique ERC-721 ticket |
| **QR Code Gallery** | View all owned tickets in a responsive grid — each ticket displays a scannable QR code |
| **On-Chain Verification** | Event staff scan QR codes or enter token IDs to verify ticket validity in real-time |
| **Single-Use Guarantee** | Smart contract marks tickets as used on-chain — no counterfeits, no re-entry |
| **Dynamic Metadata** | `tokenURI()` returns different JSON based on ticket status (VALID / USED) |
| **Wallet Connection** | RainbowKit + WalletConnect for seamless wallet integration |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ Mint Page│  │ My Tickets   │  │ Verify Page        │  │
│  │          │  │ (QR Gallery) │  │ (Camera + Manual)  │  │
│  └────┬─────┘  └──────┬───────┘  └─────────┬──────────┘  │
│       │               │                    │              │
│       └───────────────┼────────────────────┘              │
│                       │                                   │
│              useTicketContract Hook                       │
│                       │                                   │
│                wagmi / viem                               │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│            EventTicketNFT (Rust/Stylus)                  │
│                                                          │
│   mintTicket()  ─  getTicketInfo()  ─  markTicketUsed()  │
│   isTicketValid() ─ getTokensByOwner() ─ tokenUri()      │
│                                                          │
│   Storage: tokenId → { eventId, eventName, eventDate,    │
│             seatInfo, isUsed, usedAt, originalOwner }     │
│                                                          │
│              Deployed on Arbitrum Sepolia                 │
└──────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
myFirstRustapp/
├── contracts/erc721/              # Rust/Stylus smart contract
│   └── src/
│       ├── lib.rs                 # EventTicketNFT (ticket features)
│       └── erc721.rs              # Base ERC-721 implementation
├── apps/web/                      # Next.js frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Landing page
│       │   ├── layout.tsx         # Root layout with Navbar
│       │   ├── globals.css        # Design system (glassmorphism, gradients)
│       │   ├── mint/page.tsx      # Mint ticket page
│       │   ├── my-tickets/page.tsx# Ticket gallery with QR codes
│       │   └── verify/page.tsx    # QR scanner + manual verification
│       ├── components/
│       │   ├── navbar.tsx         # Navigation bar
│       │   ├── ticket-card.tsx    # Ticket display with QR code
│       │   ├── event-selector.tsx # Event picker with availability
│       │   ├── qr-scanner.tsx     # Camera-based QR scanner
│       │   ├── verification-result.tsx # Verification status display
│       │   └── wallet-button.tsx  # RainbowKit connect button
│       ├── lib/
│       │   ├── use-ticket-contract.ts  # Contract interaction hook
│       │   ├── contracts/
│       │   │   └── ticket-nft.ts       # ABI, mock events, config
│       │   ├── wagmi.ts           # Wagmi configuration
│       │   └── chains.ts          # Chain definitions
│       └── types/
│           └── ticket.ts          # TypeScript interfaces
├── docs/                          # Documentation
├── scripts/                       # Deploy / utility scripts
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **Rust** toolchain with `cargo-stylus` (for contract development)
- A Web3 wallet (MetaMask, Coinbase Wallet, etc.)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd <your-repo-name>

# Install frontend dependencies
cd apps/web
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and configure:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_NFT_ADDRESS` | Deployed EventTicketNFT contract address |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID ([get one here](https://cloud.walletconnect.com)) |
| `NEXT_PUBLIC_APP_NAME` | App name shown in wallet dialogs |

### 3. Run the Dev Server

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📱 Pages

### Home (`/`)
Landing page with hero section, feature cards, how-it-works steps, and tech stack badges.

### Mint (`/mint`)
- Connect wallet → select event → choose seat → mint NFT ticket
- Shows event availability bars, pricing, and a sticky configuration panel
- Displays the minted ticket with QR code on success

### My Tickets (`/my-tickets`)
- Responsive grid of all owned NFT tickets
- Filter by status: All / Valid / Used
- Each ticket shows event metadata, status badge, and scannable QR code

### Verify (`/verify`)
- **Camera mode**: Scan ticket QR codes using device camera
- **Manual mode**: Enter token ID directly
- Displays verification result with ticket details
- "Mark as Used" button for event staff check-in

## 🔧 Smart Contract

The `EventTicketNFT` contract extends ERC-721 with ticket-specific features:

| Function | Description |
|----------|-------------|
| `mintTicket(to, eventId, eventName, eventDate, seatInfo)` | Mint a new ticket NFT with event metadata |
| `getTicketInfo(tokenId)` | Read ticket data (event, seat, status) |
| `markTicketUsed(tokenId)` | Mark ticket as used (verifier/owner only) |
| `isTicketValid(tokenId)` | Check if ticket exists and hasn't been used |
| `getTokensByOwner(owner)` | Get all token IDs owned by an address |
| `tokenUri(tokenId)` | Dynamic JSON metadata based on usage status |
| `setVerifier(address, bool)` | Grant/revoke verifier role (owner only) |
| `setEventPrice(eventId, price)` | Set ticket price for an event (owner only) |

### Building the Contract

```bash
cd contracts/erc721
cargo build --release --target wasm32-unknown-unknown
```

### Deploying

```bash
cargo stylus deploy --endpoint https://sepolia-rollup.arbitrum.io/rpc --private-key <KEY>
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Rust, Stylus SDK, ERC-721 |
| Blockchain | Arbitrum Sepolia (testnet) |
| Frontend | Next.js 14, React 18, TypeScript |
| Wallet | RainbowKit, wagmi, viem |
| Styling | Tailwind CSS (dark theme, glassmorphism) |
| QR Generation | qrcode.react |
| QR Scanning | html5-qrcode |

## 📄 License

MIT

---

Built with [Rust](https://www.rust-lang.org/) + [Arbitrum Stylus](https://docs.arbitrum.io/stylus/stylus-gentle-introduction) + [Next.js](https://nextjs.org/) • Scaffolded with [[N]skills](https://www.nskills.xyz)
