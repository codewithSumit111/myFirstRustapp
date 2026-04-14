/**
 * useTicketContract Hook
 * 
 * Custom React hook providing all contract interaction functions for the
 * EventTicketNFT smart contract. 
 * 
 * SIMULATION MODE: If the contract address is zero (0x0...0), it automatically
 * enters simulation mode using localStorage to allow for demo purposes
 * without a deployed contract.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { toHex, fromHex } from 'viem/utils';
import type { Address } from 'abitype';
import { TICKET_NFT_ABI, TICKET_NFT_ADDRESS, CHAIN_ID } from '@/lib/contracts/ticket-nft';
import type { Ticket, QRPayload, VerificationResult } from '@/types/ticket';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const STORAGE_KEY = 'mock_nft_tickets';

export function useTicketContract() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    setIsSimulated(TICKET_NFT_ADDRESS === ZERO_ADDRESS);
  }, []);

  // --- Simulation Helpers ---
  
  const getSimulatedTickets = useCallback((): Ticket[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }, []);

  const saveSimulatedTicket = useCallback((ticket: Ticket) => {
    if (typeof window === 'undefined') return;
    const tickets = getSimulatedTickets();
    tickets.push(ticket);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));
  }, [getSimulatedTickets]);

  const updateSimulatedTicket = useCallback((tokenId: bigint, updates: Partial<Ticket>) => {
    if (typeof window === 'undefined') return;
    const tickets = getSimulatedTickets();
    const index = tickets.findIndex(t => BigInt(t.tokenId) === tokenId);
    if (index !== -1) {
      tickets[index] = { ...tickets[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value
      ));
    }
  }, [getSimulatedTickets]);

  /**
   * Mint a new ticket NFT with event data
   */
  const mintTicket = useCallback(async (
    eventId: number,
    eventName: string,
    eventDate: string,
    seatInfo: string,
  ): Promise<bigint | null> => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    setIsLoading(true);
    setError(null);

    // Simulation Mode
    if (isSimulated) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate chain delay
      const tokenId = BigInt(Math.floor(Math.random() * 1000000));
      
      const newTicket: Ticket = {
        tokenId,
        eventId: BigInt(eventId),
        eventName,
        eventDate,
        seatInfo,
        isUsed: false,
        usedAt: BigInt(0),
        originalOwner: address,
      };

      saveSimulatedTicket(newTicket);
      setIsLoading(false);
      return tokenId;
    }

    // On-Chain Mode
    try {
      if (!walletClient || !publicClient) throw new Error('Client not ready');
      
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

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const transferEvent = receipt.logs.find(
        (log: any) => log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
      );

      if (transferEvent && transferEvent.topics[3]) {
        return BigInt(transferEvent.topics[3]);
      }
      return null;
    } catch (err: any) {
      console.error('Mint error:', err);
      setError(err.shortMessage || err.message || 'Failed to mint ticket');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [walletClient, address, publicClient, isSimulated, isConnected, saveSimulatedTicket]);

  /**
   * Get ticket information by token ID
   */
  const getTicketInfo = useCallback(async (tokenId: bigint): Promise<Ticket | null> => {
    if (isSimulated) {
      const tickets = getSimulatedTickets();
      const ticket = tickets.find(t => BigInt(t.tokenId) === tokenId);
      if (!ticket) return null;
      return {
        ...ticket,
        tokenId: BigInt(ticket.tokenId),
        eventId: BigInt(ticket.eventId),
        usedAt: BigInt(ticket.usedAt)
      };
    }

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
  }, [publicClient, isSimulated, getSimulatedTickets]);

  /**
   * Mark a ticket as used
   */
  const markTicketUsed = useCallback(async (tokenId: bigint): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    if (isSimulated) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateSimulatedTicket(tokenId, { isUsed: true, usedAt: BigInt(Math.floor(Date.now() / 1000)) });
      setIsLoading(false);
      return true;
    }

    if (!walletClient || !publicClient) {
      setError('Wallet not connected');
      setIsLoading(false);
      return false;
    }

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
  }, [walletClient, publicClient, isSimulated, updateSimulatedTicket]);

  /**
   * Check if a ticket is valid
   */
  const isTicketValid = useCallback(async (tokenId: bigint): Promise<boolean> => {
    if (isSimulated) {
      const tickets = getSimulatedTickets();
      const ticket = tickets.find(t => BigInt(t.tokenId) === tokenId);
      return !!ticket && !ticket.isUsed;
    }

    if (!publicClient) return false;
    try {
      return await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'isTicketValid',
        args: [tokenId],
      }) as boolean;
    } catch {
      return false;
    }
  }, [publicClient, isSimulated, getSimulatedTickets]);

  /**
   * Get all token IDs owned by an address
   */
  const getOwnedTickets = useCallback(async (owner?: Address): Promise<Ticket[]> => {
    const targetOwner = owner || address;
    if (!targetOwner) return [];

    if (isSimulated) {
      const tickets = getSimulatedTickets();
      return tickets
        .filter(t => t.originalOwner.toLowerCase() === targetOwner.toLowerCase())
        .map(t => ({
          ...t,
          tokenId: BigInt(t.tokenId),
          eventId: BigInt(t.eventId),
          usedAt: BigInt(t.usedAt)
        }));
    }

    if (!publicClient) return [];
    try {
      const tokenIds = await publicClient.readContract({
        address: TICKET_NFT_ADDRESS,
        abi: TICKET_NFT_ABI,
        functionName: 'getTokensByOwner',
        args: [targetOwner],
      }) as bigint[];

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
  }, [publicClient, address, getTicketInfo, isSimulated, getSimulatedTickets]);

  /**
   * Verify a ticket from QR payload
   */
  const verifyTicket = useCallback(async (payload: QRPayload): Promise<VerificationResult> => {
    try {
      const tokenId = BigInt(payload.tokenId);
      const ticket = await getTicketInfo(tokenId);
      
      if (!ticket) {
        return { isValid: false, ticket: null, owner: null, message: 'Ticket not found', status: 'not-found' };
      }

      const owner = ticket.originalOwner;

      if (ticket.isUsed) {
        return { isValid: false, ticket, owner, message: 'Ticket already used', status: 'used' };
      }

      if (payload.walletAddress && owner.toLowerCase() !== payload.walletAddress.toLowerCase()) {
        return { isValid: false, ticket, owner, message: 'Ownership mismatch', status: 'error' };
      }

      return {
        isValid: true,
        ticket,
        owner,
        message: 'Ticket is valid',
        status: 'valid',
      };
    } catch (err: any) {
      return { isValid: false, ticket: null, owner: null, message: 'Verification failed', status: 'error' };
    }
  }, [getTicketInfo]);

  /**
   * Generate QR payload
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
   * Get global stats
   */
  const getGlobalStats = useCallback(async (): Promise<{ totalMinted: number, totalUsed: number } | null> => {
    if (isSimulated) {
      const tickets = getSimulatedTickets();
      return {
        totalMinted: tickets.length,
        totalUsed: tickets.filter(t => t.isUsed).length
      };
    }

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
      return { totalMinted: 0, totalUsed: 0 };
    }
  }, [publicClient, isSimulated, getSimulatedTickets]);

  return {
    address,
    isConnected,
    isLoading,
    error,
    isSimulated,
    mintTicket,
    getTicketInfo,
    markTicketUsed,
    isTicketValid,
    getOwnedTickets,
    verifyTicket,
    generateQRPayload,
    getGlobalStats,
    clearError: () => setError(null),
  };
}
