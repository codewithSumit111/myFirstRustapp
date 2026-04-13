/**
 * EventTicketNFT Contract ABI & Configuration
 * 
 * ABI generated from the Rust/Stylus contract in contracts/erc721/src/lib.rs.
 * The contract extends ERC721 with ticket-specific storage and methods.
 */

import type { Address } from 'viem';

// Contract address from environment variable
export const TICKET_NFT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

// Chain ID for Arbitrum Sepolia testnet
export const CHAIN_ID = 421614;

// RPC endpoint
export const RPC_ENDPOINT = 'https://sepolia-rollup.arbitrum.io/rpc';

/**
 * ABI for the EventTicketNFT contract.
 * Includes both inherited ERC721 functions and ticket-specific extensions.
 */
export const TICKET_NFT_ABI = [
  // ──────────────────────────────────────────────
  // Ticket-specific functions
  // ──────────────────────────────────────────────

  // Initialize contract (sets deployer as owner)
  {
    type: 'function',
    name: 'initialize',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Set event price (owner only)
  {
    type: 'function',
    name: 'setEventPrice',
    inputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Add/remove verifier (owner only)
  {
    type: 'function',
    name: 'setVerifier',
    inputs: [
      { name: 'verifier', type: 'address' },
      { name: 'authorized', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Mint a ticket with event data
  {
    type: 'function',
    name: 'mintTicket',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'eventId', type: 'uint256' },
      { name: 'eventName', type: 'bytes' },
      { name: 'eventDate', type: 'bytes' },
      { name: 'seatInfo', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },

  // Get ticket information
  {
    type: 'function',
    name: 'getTicketInfo',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'eventId', type: 'uint256' },
      { name: 'eventName', type: 'bytes' },
      { name: 'eventDate', type: 'bytes' },
      { name: 'seatInfo', type: 'bytes' },
      { name: 'isUsed', type: 'bool' },
      { name: 'usedAt', type: 'uint256' },
      { name: 'originalOwner', type: 'address' },
    ],
    stateMutability: 'view',
  },

  // Mark ticket as used (verifier/owner only)
  {
    type: 'function',
    name: 'markTicketUsed',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // Check if ticket is valid
  {
    type: 'function',
    name: 'isTicketValid',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  // Get dynamic token URI
  {
    type: 'function',
    name: 'tokenUri',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },

  // Get global statistics
  {
    type: 'function',
    name: 'getGlobalStats',
    inputs: [],
    outputs: [
      { name: 'totalMinted', type: 'uint256' },
      { name: 'totalUsed', type: 'uint256' },
    ],
    stateMutability: 'view',
  },

  // Get tokens owned by address
  {
    type: 'function',
    name: 'getTokensByOwner',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
  },

  // ──────────────────────────────────────────────
  // Inherited ERC721 functions
  // ──────────────────────────────────────────────

  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'mint',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mintTo',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ──────────────────────────────────────────────
  // Events
  // ──────────────────────────────────────────────
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const;

/**
 * Mock event data for the minting interface.
 * In production, this would come from an API or on-chain event registry.
 */
export const MOCK_EVENTS = [
  {
    id: 1,
    name: 'Web3 Summit 2024',
    date: '2024-12-15',
    price: '0.01',
    venue: 'Berlin Convention Center',
    description: 'The premier Web3 conference bringing together builders, researchers, and enthusiasts from around the world.',
    image: '/events/web3-summit.jpg',
    totalTickets: 500,
    soldTickets: 342,
  },
  {
    id: 2,
    name: 'Rust Conference',
    date: '2025-01-20',
    price: '0.02',
    venue: 'San Francisco Moscone Center',
    description: 'Deep dive into Rust programming with talks from core team members and industry leaders.',
    image: '/events/rust-conf.jpg',
    totalTickets: 300,
    soldTickets: 187,
  },
  {
    id: 3,
    name: 'ETH Global Hackathon',
    date: '2025-02-10',
    price: '0.015',
    venue: 'Online + NYC Hub',
    description: 'Build the future of Ethereum in 48 hours. Prizes, mentorship, and networking opportunities.',
    image: '/events/eth-global.jpg',
    totalTickets: 1000,
    soldTickets: 756,
  },
  {
    id: 4,
    name: 'DeFi Summit Tokyo',
    date: '2025-03-05',
    price: '0.025',
    venue: 'Tokyo International Forum',
    description: 'Explore the cutting edge of decentralized finance with top DeFi protocols and researchers.',
    image: '/events/defi-tokyo.jpg',
    totalTickets: 400,
    soldTickets: 298,
  },
  {
    id: 5,
    name: 'NFT Art Basel',
    date: '2025-04-18',
    price: '0.03',
    venue: 'Miami Beach Convention Center',
    description: 'Where digital art meets blockchain. Featuring exhibitions, live mints, and artist panels.',
    image: '/events/nft-art.jpg',
    totalTickets: 600,
    soldTickets: 425,
  },
];

/** Seat sections for ticket minting */
export const SEAT_SECTIONS = [
  'General Admission',
  'VIP Front Row',
  'VIP Balcony',
  'Floor Standing',
  'Reserved Seating - Section A',
  'Reserved Seating - Section B',
  'Reserved Seating - Section C',
  'Backstage Pass',
];
