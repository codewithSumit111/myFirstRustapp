/**
 * useTicketContract Hook
 * 
 * React hook for interacting with the EventTicketNFT contract.
 * Provides functions for minting, viewing, and verifying tickets.
 */

'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useState, useCallback } from 'react';
import { type Address, parseEther, toBytes, hexToBytes, bytesToHex } from 'viem';
import { TICKET_NFT_ABI, TICKET_NFT_ADDRESS, MOCK_EVENTS, SEAT_SECTIONS } from '@/lib/contracts/ticket-nft';
import type { Ticket, MockEvent, QRPayload, VerificationResult } from '@/types/ticket';

// Helper to convert string to bytes for contract calls
const stringToBytes = (str: string): `0x${string}` => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return bytesToHex(bytes) as `0x${string}`;
};

// Helper to convert bytes to string
const bytesToString = (hex: `0x${string}`): string => {
  try {
    const bytes = hexToBytes(hex);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return '';
  }
};

export function useTicketContract() {
  const { address, isConnected } = useAccount();
  const [pendingTokenId, setPendingTokenId] = useState<bigint | null>(null);

  // Write functions
  const { 
    writeContract, 
    isPending: isWritePending, 
    error: writeError,
    data: hash 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Read functions
  const { data: ownedTokens, refetch: refetchOwnedTokens } = useReadContract({
    address: TICKET_NFT_ADDRESS,
    abi: TICKET_NFT_ABI,
    functionName: 'getTokensByOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Mint a new ticket
  const mintTicket = useCallback(async (
    event: MockEvent,
    seatInfo: string
  ): Promise<bigint | null> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    const eventId = BigInt(event.id);
    const eventNameBytes = stringToBytes(event.name);
    const eventDateBytes = stringToBytes(event.date);
    const seatInfoBytes = stringToBytes(seatInfo);
    const price = parseEther(event.price);

    try {
      const txHash = await writeContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'mintTicket',
        args: [address, eventId, eventNameBytes, eventDateBytes, seatInfoBytes],
        value: price,
      });

      // Return the expected token ID (total supply before mint)
      return null; // Will need to get actual token ID from events
    } catch (error) {
      console.error('Mint failed:', error);
      throw error;
    }
  }, [address, isConnected, writeContract]);

  // Get ticket info
  const getTicketInfo = useCallback(async (tokenId: bigint): Promise<Ticket | null> => {
    try {
      const result = await fetch(`/api/ticket-info?tokenId=${tokenId.toString()}&contract=${TICKET_NFT_ADDRESS}`).then(r => r.json());
      
      if (!result.success) return null;

      return {
        tokenId,
        eventId: BigInt(result.eventId),
        eventName: result.eventName,
        eventDate: result.eventDate,
        seatInfo: result.seatInfo,
        isUsed: result.isUsed,
        usedAt: BigInt(result.usedAt || 0),
        originalOwner: result.originalOwner as `0x${string}`,
      };
    } catch (error) {
      console.error('Failed to get ticket info:', error);
      return null;
    }
  }, []);

  // Check if ticket is valid
  const checkTicketValid = useCallback(async (tokenId: bigint): Promise<boolean> => {
    try {
      const response = await fetch(`/api/ticket-valid?tokenId=${tokenId.toString()}&contract=${TICKET_NFT_ADDRESS}`);
      const result = await response.json();
      return result.valid;
    } catch {
      return false;
    }
  }, []);

  // Mark ticket as used (only for verifiers)
  const markTicketUsed = useCallback(async (tokenId: bigint): Promise<void> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    await writeContract({
      address: TICKET_NFT_ADDRESS,
      abi: TICKET_NFT_ABI,
      functionName: 'markTicketUsed',
      args: [tokenId],
    });
  }, [address, isConnected, writeContract]);

  // Get all tickets for current user
  const getOwnedTickets = useCallback(async (): Promise<Ticket[]> => {
    if (!ownedTokens || !address) return [];

    const tickets: Ticket[] = [];
    for (const tokenId of ownedTokens) {
      const ticket = await getTicketInfo(tokenId);
      if (ticket) tickets.push(ticket);
    }
    return tickets;
  }, [ownedTokens, address, getTicketInfo]);

  // Generate QR payload for a ticket
  const generateQRPayload = useCallback((ticket: Ticket): QRPayload => {
    return {
      tokenId: ticket.tokenId.toString(),
      eventId: ticket.eventId.toString(),
      eventName: ticket.eventName,
      contractAddress: TICKET_NFT_ADDRESS,
      chainId: 421614, // Arbitrum Sepolia
    };
  }, []);

  // Verify a ticket from QR scan
  const verifyTicket = useCallback(async (payload: QRPayload): Promise<VerificationResult> => {
    try {
      const tokenId = BigInt(payload.tokenId);
      
      // Check if ticket is valid on-chain
      const isValid = await checkTicketValid(tokenId);
      
      if (!isValid) {
        // Could be invalid because used or doesn't exist
        const ticket = await getTicketInfo(tokenId);
        if (!ticket) {
          return {
            isValid: false,
            ticket: null,
            owner: null,
            message: 'Ticket not found',
            status: 'not-found',
          };
        }
        if (ticket.isUsed) {
          return {
            isValid: false,
            ticket,
            owner: ticket.originalOwner,
            message: `Ticket already used on ${new Date(Number(ticket.usedAt) * 1000).toLocaleString()}`,
            status: 'used',
          };
        }
      }

      const ticket = await getTicketInfo(tokenId);
      if (!ticket) {
        return {
          isValid: false,
          ticket: null,
          owner: null,
          message: 'Ticket not found',
          status: 'not-found',
        };
      }

      return {
        isValid: true,
        ticket,
        owner: ticket.originalOwner,
        message: 'Valid ticket - ready to verify',
        status: 'valid',
      };
    } catch (error) {
      return {
        isValid: false,
        ticket: null,
        owner: null,
        message: 'Error verifying ticket',
        status: 'error',
      };
    }
  }, [checkTicketValid, getTicketInfo]);

  return {
    // State
    isConnected,
    address,
    isWritePending,
    isConfirming,
    isSuccess,
    hash,
    writeError,
    
    // Actions
    mintTicket,
    getTicketInfo,
    getOwnedTickets,
    markTicketUsed,
    checkTicketValid,
    generateQRPayload,
    verifyTicket,
    refetchOwnedTokens,
    
    // Constants
    mockEvents: MOCK_EVENTS,
    seatSections: SEAT_SECTIONS,
  };
}
