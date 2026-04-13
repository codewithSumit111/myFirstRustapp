# NFT Event Ticketing dApp Plan

Build a full-stack NFT-based event ticketing system on top of the existing Web3 infrastructure, extending the Rust/Stylus ERC721 contract with ticket-specific features.

## Architecture Overview

**Contracts (Rust/Stylus):**
- Extend existing ERC721 with ticket metadata and usage tracking
- Add `mintTicket()` function with event data
- Add `markTicketUsed()` for event staff verification
- Store ticket state: (eventId, eventName, eventDate, seatInfo, isUsed, usedAt)

**Frontend (Next.js + Tailwind):**
- Wallet connection (RainbowKit already configured)
- Ticket minting interface with mock event data
- "My Tickets" gallery showing owned NFTs
- QR code generation for each ticket (using `qrcode.react`)
- QR scanner for event staff verification (using `html5-qrcode`)
- Ticket verification status display

## Implementation Steps

### 1. Contract Extensions (contracts/erc721/)
- Modify `lib.rs` to add ticket-specific storage and methods
- Add Ticket struct and mapping (tokenId -> Ticket)
- Add `mint_ticket(event_id, event_name, event_date, seat_info)` 
- Add `mark_ticket_used(token_id)` with owner check
- Add `get_ticket_info(token_id)` view function
- Update `token_uri()` to return dynamic JSON with ticket status

### 2. Frontend Dependencies (apps/web/)
- Add `qrcode.react` for QR generation
- Add `html5-qrcode` for QR scanning

### 3. Smart Contract Types (apps/web/src/types/)
- Add Ticket interface
- Add contract ABI types

### 4. Contract Hooks (apps/web/src/lib/)
- Create `useTicketContract.ts` hook for contract interactions
- Add functions: mintTicket, getTicketInfo, markTicketUsed, getOwnedTickets

### 5. Page Components (apps/web/src/app/)
- **Mint Page** (`/mint`): Form to mint new ticket with mock event selection
- **My Tickets Page** (`/my-tickets`): Display owned tickets with QR codes
- **Verify Page** (`/verify`): QR scanner interface for event staff

### 6. UI Components (apps/web/src/components/)
- `TicketCard`: Display ticket info with QR code
- `EventSelector`: Mock event selection dropdown
- `QRScanner`: Camera-based QR scanner component
- `VerificationResult`: Show ticket validity and usage status

### 7. Contract ABI/Types
- Generate TypeScript ABIs from Rust contract
- Export contract configuration

### 8. Environment Setup
- Update `.env.example` with contract addresses
- Add deployment helper scripts

## Folder Structure

```
f:\myFirstRustapp/
├── contracts/erc721/
│   └── src/
│       ├── lib.rs (extended with ticket features)
│       └── erc721.rs (existing base)
├── apps/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx (home)
│   │   │   ├── mint/page.tsx
│   │   │   ├── my-tickets/page.tsx
│   │   │   └── verify/page.tsx
│   │   ├── components/
│   │   │   ├── ticket-card.tsx
│   │   │   ├── event-selector.tsx
│   │   │   ├── qr-scanner.tsx
│   │   │   └── verification-result.tsx
│   │   ├── lib/
│   │   │   ├── use-ticket-contract.ts
│   │   │   └── contracts/
│   │   │       └── ticket-nft.ts (ABI/config)
│   │   └── types/
│   │       └── ticket.ts
│   └── package.json (+ qrcode.react, html5-qrcode)
```

## Key Features

1. **Connect Wallet**: Use existing RainbowKit integration
2. **Mint NFT Ticket**: Select mock event → mint → receive NFT
3. **Display Tickets**: Grid view with metadata and QR codes
4. **Generate QR**: Each ticket displays a scannable QR (contains tokenId + event data)
5. **Verify via QR**: Staff scans → app decodes → checks blockchain → shows result
6. **Mark Used**: Successful verification updates `isUsed` on-chain
7. **Dynamic Metadata**: `tokenURI()` returns different JSON based on `isUsed` status

## Mock Event Data

```typescript
const mockEvents = [
  { id: 1, name: "Web3 Summit 2024", date: "2024-12-15", price: "0.01" },
  { id: 2, name: "Rust Conference", date: "2025-01-20", price: "0.02" },
  { id: 3, name: "ETH Global Hackathon", date: "2025-02-10", price: "0.015" }
];
```

## Technical Decisions

- **QR Library**: `qrcode.react` - lightweight, well-maintained, SVG-based
- **Scanner**: `html5-qrcode` - robust camera access, works on mobile/desktop
- **Contract**: Extend existing Rust/Stylus instead of rewriting in Solidity
- **State**: On-chain ticket usage tracking ensures single-use guarantee
- **Metadata**: Dynamic JSON based on `isUsed` flag for visual differentiation

## Beginner-Friendly Approach

- Modular components with clear separation of concerns
- Detailed comments in contract code
- Simple hook-based React patterns
- TypeScript for type safety
- Mock data so no external API dependencies
