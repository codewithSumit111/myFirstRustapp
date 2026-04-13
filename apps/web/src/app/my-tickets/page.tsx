/**
 * My Tickets Page
 * 
 * Displays all NFT tickets owned by the connected wallet.
 * Shows tickets in a grid with QR codes and status badges.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TicketCard } from '@/components/ticket-card';
import { WalletButton } from '@/components/wallet-button';
import { useTicketContract } from '@/lib/use-ticket-contract';
import type { Ticket } from '@/types/ticket';
import Link from 'next/link';

export default function MyTicketsPage() {
  const { isConnected, address } = useAccount();
  const { getOwnedTickets } = useTicketContract();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'valid' | 'used'>('all');

  // Fetch tickets when connected
  useEffect(() => {
    if (!isConnected || !address) {
      setTickets([]);
      return;
    }

    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const owned = await getOwnedTickets();
        setTickets(owned);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [isConnected, address, getOwnedTickets]);

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    if (filter === 'valid') return !t.isUsed;
    if (filter === 'used') return t.isUsed;
    return true;
  });

  const validCount = tickets.filter((t) => !t.isUsed).length;
  const usedCount = tickets.filter((t) => t.isUsed).length;

  return (
    <main className="min-h-screen pt-24 pb-16 px-4" id="my-tickets-page">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="gradient-text">My Tickets</span>
          </h1>
          <p className="text-forge-muted text-sm max-w-lg mx-auto">
            View and manage your NFT event tickets. Each ticket has a unique QR code.
          </p>
        </div>

        {/* Connect Wallet Gate */}
        {!isConnected ? (
          <div className="card max-w-md mx-auto text-center py-12" id="connect-prompt">
            <div className="text-5xl mb-4">🦊</div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-forge-muted mb-6">
              Connect your wallet to see your NFT tickets.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        ) : isLoading ? (
          /* ── Loading State ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tickets-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <div className="h-1.5 animate-shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-20 rounded animate-shimmer" />
                  <div className="h-6 w-3/4 rounded animate-shimmer" />
                  <div className="h-3 w-1/2 rounded animate-shimmer" />
                  <div className="h-3 w-2/3 rounded animate-shimmer" />
                  <div className="h-px w-full border-t border-dashed border-forge-border my-4" />
                  <div className="flex justify-center">
                    <div className="w-[140px] h-[140px] rounded-xl animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* ── Empty State ── */
          <div className="card max-w-md mx-auto text-center py-12" id="no-tickets">
            <div className="text-5xl mb-4">🎫</div>
            <h2 className="text-xl font-semibold text-white mb-2">No Tickets Yet</h2>
            <p className="text-sm text-forge-muted mb-6">
              You don&apos;t have any NFT tickets. Mint your first one!
            </p>
            <Link href="/mint" className="btn-primary inline-block" id="btn-go-mint">
              ⛏️ Mint a Ticket
            </Link>
          </div>
        ) : (
          <>
            {/* ── Stats & Filters ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="glass-light rounded-lg px-4 py-2">
                  <span className="text-xs text-forge-muted">Total</span>
                  <span className="text-lg font-bold text-white ml-2">{tickets.length}</span>
                </div>
                <div className="glass-light rounded-lg px-4 py-2">
                  <span className="text-xs text-forge-muted">Valid</span>
                  <span className="text-lg font-bold text-accent-lime ml-2">{validCount}</span>
                </div>
                <div className="glass-light rounded-lg px-4 py-2">
                  <span className="text-xs text-forge-muted">Used</span>
                  <span className="text-lg font-bold text-accent-coral ml-2">{usedCount}</span>
                </div>
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-1 glass-light rounded-lg p-1" id="ticket-filters">
                {(['all', 'valid', 'used'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      filter === f
                        ? 'bg-accent-cyan/20 text-accent-cyan'
                        : 'text-forge-muted hover:text-forge-text'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'valid' ? '✓ Valid' : '✕ Used'}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Ticket Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tickets-grid">
              {filteredTickets.map((ticket) => (
                <TicketCard key={ticket.tokenId.toString()} ticket={ticket} />
              ))}
            </div>

            {filteredTickets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-forge-muted">No {filter} tickets found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
