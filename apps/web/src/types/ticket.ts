/**
 * Ticket Types for the NFT Event Ticketing dApp
 * 
 * These types map to the on-chain TicketData struct in the Rust/Stylus contract.
 */

/** Represents a ticket's on-chain data */
export interface Ticket {
  tokenId: bigint;
  eventId: bigint;
  eventName: string;
  eventDate: string;
  seatInfo: string;
  isUsed: boolean;
  usedAt: bigint;
  originalOwner: `0x${string}`;
}

/** Mock event for the mint interface */
export interface MockEvent {
  id: number;
  name: string;
  date: string;
  price: string;
  venue: string;
  description: string;
  image: string;
  totalTickets: number;
  soldTickets: number;
}

/** QR code payload structure */
export interface QRPayload {
  tokenId: string;
  eventId: string;
  eventName: string;
  contractAddress: string;
  chainId: number;
}

/** Verification result from scanning */
export interface VerificationResult {
  isValid: boolean;
  ticket: Ticket | null;
  owner: `0x${string}` | null;
  message: string;
  status: 'valid' | 'used' | 'not-found' | 'error';
}

/** Mint transaction status */
export type MintStatus = 'idle' | 'confirming' | 'minting' | 'success' | 'error';
