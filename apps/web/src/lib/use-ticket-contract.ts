/**
 * useTicketContract Hook
 * 
 * Custom React hook providing all contract interaction functions for the
 * EventTicketNFT smart contract. Uses wagmi hooks for wallet-connected
 * transactions and viem for read-only calls.
 */

'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { encodeFunctionData, decodeFunctionResult, toHex, fromHex, type Address } from 'viem';
import { TICKET_NFT_ABI, TICKET_NFT_ADDRESS, CHAIN_ID } from '@/lib/contracts/ticket-nft';
import type { Ticket, QRPayload, VerificationResult } from '@/types/ticket';

/**
 * Hook for interacting with the EventTicketNFT contract.
 * Provides mint, verify, and query functions.
 */
export function useTicketContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mint a new ticket NFT with event data
   */
  const mintTicket = useCallback(async (
    eventId: number,
    eventName: string,
    eventDate: string,
    seatInfo: string,
  ): Promise<bigint | null> => {
    if (!walletClient || !address || !publicClient) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Encode string parameters as bytes
      const eventNameBytes = toHex(new TextEncoder().encode(eventName));
      const eventDateBytes = toHex(new TextEncoder().encode(eventDate));
      const seatInfoBytes = toHex(new TextEncoder().encode(seatInfo));

      const hash = await walletClient.writeContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'mintTicket',
        args: [
          address,
          BigInt(eventId),
          eventNameBytes,
          eventDateBytes,
          seatInfoBytes,
        ],
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Extract token ID from Transfer event logs
      const transferEvent = receipt.logs.find(
        (log: any) => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );

      if (transferEvent && transferEvent.topics[3]) {
        const tokenId = BigInt(transferEvent.topics[3]);
        return tokenId;
      }

      return null;
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.shortMessage || err.message || 'Failed to mint ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, publicClient]);

  /**
   * Get ticket information by token ID
   */
  const getTicketInfo = useCallback(async (tokenId: bigint): Promise<Ticket | null> => {
    if (!publicClient) return null;

    try {
      const result = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'getTicketInfo',
        args: [tokenId],
      }) as [bigint, `0x${string}`, `0x${string}`, `0x${string}`, boolean, bigint, Address];

      const decoder = new TextDecoder();

      return {
        tokenId,
        eventId: result[0],
        eventName: decoder.decode(fromHex(result[1], 'bytes')),
        eventDate: decoder.decode(fromHex(result[2], 'bytes')),
        seatInfo: decoder.decode(fromHex(result[3], 'bytes')),
        isUsed: result[4],
        usedAt: result[5],
        originalOwner: result[6],
      };
    } catch (err: any) {
      console.error('getTicketInfo error:', err);
      return null;
    }
  }, [publicClient]);

  /**
   * Mark a ticket as used (verifier/owner only)
   */
  const markTicketUsed = useCallback(async (tokenId: bigint): Promise<boolean> => {
    if (!walletClient || !publicClient) {
      setError('Wallet not connected');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const hash = await walletClient.writeContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'markTicketUsed',
        args: [tokenId],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      return true;
    } catch (err: any) {
      console.error('markTicketUsed error:', err);
      setError(err.shortMessage || err.message || 'Failed to mark ticket as used');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, publicClient]);

  /**
   * Check if a ticket is valid (exists and not used)
   */
  const isTicketValid = useCallback(async (tokenId: bigint): Promise<boolean> => {
    if (!publicClient) return false;

    try {
      const result = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'isTicketValid',
        args: [tokenId],
      });

      return result as boolean;
    } catch {
      return false;
    }
  }, [publicClient]);

  /**
   * Get all token IDs owned by an address
   */
  const getOwnedTickets = useCallback(async (owner?: Address): Promise<Ticket[]> => {
    if (!publicClient) return [];
    const targetOwner = owner || address;
    if (!targetOwner) return [];

    try {
      const tokenIds = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'getTokensByOwner',
        args: [targetOwner],
      }) as bigint[];

      // Fetch ticket info for each token
      const tickets: Ticket[] = [];
      for (const tokenId of tokenIds) {
        const ticket = await getTicketInfo(tokenId);
        if (ticket) tickets.push(ticket);
      }

      return tickets;
    } catch (err: any) {
      console.error('getOwnedTickets error:', err);
      return [];
    }
  }, [publicClient, address, getTicketInfo]);

  /**
   * Verify a ticket from QR payload data
   */
  const verifyTicket = useCallback(async (payload: QRPayload): Promise<VerificationResult> => {
    if (!publicClient) {
      return { isValid: false, ticket: null, owner: null, message: 'Not connected to network', status: 'error' };
    }

    try {
      const tokenId = BigInt(payload.tokenId);

      // Get ticket info
      const ticket = await getTicketInfo(tokenId);
      if (!ticket) {
        return { isValid: false, ticket: null, owner: null, message: 'Ticket not found on-chain', status: 'not-found' };
      }

      // Get current owner
      const owner = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      }) as Address;

      // Check if already used
      if (ticket.isUsed) {
        return { isValid: false, ticket, owner, message: 'Ticket has already been used', status: 'used' };
      }

      // Verify ownership
      if (payload.walletAddress && owner.toLowerCase() !== payload.walletAddress.toLowerCase()) {
        return { isValid: false, ticket, owner, message: 'Ownership mismatch (Invalid Ticket)', status: 'error' };
      }

      // Verify event data matches
      if (ticket.eventId.toString() !== payload.eventId) {
        return { isValid: false, ticket, owner, message: 'Event data mismatch', status: 'error' };
      }

      return {
        isValid: true,
        ticket,
        owner,
        message: 'Ticket is valid and ready for check-in',
        status: 'valid',
      };
    } catch (err: any) {
      console.error('verifyTicket error:', err);
      return { isValid: false, ticket: null, owner: null, message: err.message || 'Verification failed', status: 'error' };
    }
  }, [publicClient, getTicketInfo]);

  /**
   * Generate a QR payload for a ticket
   */
  const generateQRPayload = useCallback((ticket: Ticket): QRPayload => {
    return {
      tokenId: ticket.tokenId.toString(),
      walletAddress: address || ticket.originalOwner,
      eventId: ticket.eventId.toString(),
      eventName: ticket.eventName,
      contractAddress: TICKET_NFT_ADDRESS,
      chainId: CHAIN_ID,
    };
  }, [address]);

  /**
   * Get global smart contract statistics
   */
  const getGlobalStats = useCallback(async (): Promise<{ totalMinted: number, totalUsed: number } | null> => {
    if (!publicClient) return null;

    try {
      const result = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'getGlobalStats',
      }) as [bigint, bigint];

      return {
        totalMinted: Number(result[0]),
        totalUsed: Number(result[1]),
      };
    } catch (err) {
      console.error('getGlobalStats error:', err);
      return null;
    }
  }, [publicClient]);

  return {
    // State
    address,
    isConnected,
    isLoading,
    error,

    // Actions
    mintTicket,
    getTicketInfo,
    markTicketUsed,
    isTicketValid,
    getOwnedTickets,
    verifyTicket,
    generateQRPayload,
    getGlobalStats,

    // Utilities
    clearError: () => setError(null),
  };
}
