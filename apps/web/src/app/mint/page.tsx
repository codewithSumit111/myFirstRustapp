/**
 * Mint Page
 * 
 * Form interface for minting new NFT tickets.
 * Users select an event, choose a seat section, and mint.
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { EventSelector } from '@/components/event-selector';
import { TicketCard } from '@/components/ticket-card';
import { WalletButton } from '@/components/wallet-button';
import { useTicketContract } from '@/lib/use-ticket-contract';
import { SEAT_SECTIONS } from '@/lib/contracts/ticket-nft';
import type { MockEvent, Ticket, MintStatus } from '@/types/ticket';

export default function MintPage() {
  const { isConnected } = useAccount();
  const { mintTicket, isLoading, error, clearError } = useTicketContract();

  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string>(SEAT_SECTIONS[0]);
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle');
  const [mintedTicket, setMintedTicket] = useState<Ticket | null>(null);

  const handleMint = async () => {
    if (!selectedEvent) return;

    setMintStatus('minting');
    clearError();

    const tokenId = await mintTicket(
      selectedEvent.id,
      selectedEvent.name,
      selectedEvent.date,
      selectedSeat,
    );

    if (tokenId !== null) {
      setMintStatus('success');
      setMintedTicket({
        tokenId,
        eventId: BigInt(selectedEvent.id),
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        seatInfo: selectedSeat,
        isUsed: false,
        usedAt: BigInt(0),
        originalOwner: '0x0000000000000000000000000000000000000000',
      });
    } else {
      setMintStatus('error');
    }
  };

  const handleReset = () => {
    setMintStatus('idle');
    setMintedTicket(null);
    setSelectedEvent(null);
    clearError();
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4" id="mint-page">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="gradient-text">Mint Your Ticket</span>
          </h1>
          <p className="text-forge-muted text-sm max-w-lg mx-auto">
            Select an event, choose your seat, and mint a unique NFT ticket on Arbitrum.
          </p>
        </div>

        {/* Connect Wallet Gate */}
        {!isConnected ? (
          <div className="card max-w-md mx-auto text-center py-12" id="connect-prompt">
            <div className="text-5xl mb-4">🦊</div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-forge-muted mb-6">
              You need a connected wallet to mint NFT tickets.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        ) : mintStatus === 'success' && mintedTicket ? (
          /* ── Success State ── */
          <div className="max-w-md mx-auto" id="mint-success">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-3"
                style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                ✓
              </div>
              <h2 className="text-xl font-semibold text-accent-lime mb-1">Ticket Minted!</h2>
              <p className="text-sm text-forge-muted">Your NFT ticket is ready.</p>
            </div>

            <TicketCard ticket={mintedTicket} />

            <div className="flex gap-3 mt-6">
              <button onClick={handleReset} className="btn-secondary flex-1" id="btn-mint-another">
                🎫 Mint Another
              </button>
              <a href="/my-tickets" className="btn-primary flex-1 text-center" id="btn-view-tickets">
                🎟️ View My Tickets
              </a>
            </div>
          </div>
        ) : (
          /* ── Mint Form ── */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left column: Event selection (3/5) */}
            <div className="lg:col-span-3">
              <EventSelector
                selectedEvent={selectedEvent}
                onSelect={setSelectedEvent}
              />
            </div>

            {/* Right column: Mint config (2/5) */}
            <div className="lg:col-span-2">
              <div className="card sticky top-24" id="mint-config">
                <h3 className="text-sm font-semibold text-forge-muted uppercase tracking-wider mb-4">
                  Ticket Details
                </h3>

                {selectedEvent ? (
                  <div className="space-y-5">
                    {/* Selected event summary */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                      <h4 className="font-semibold text-white text-sm mb-1">{selectedEvent.name}</h4>
                      <p className="text-xs text-forge-muted">
                        📅 {new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-forge-muted">📍 {selectedEvent.venue}</p>
                    </div>

                    {/* Seat selection */}
                    <div>
                      <label className="block text-xs font-medium text-forge-muted mb-2">
                        🪑 Seat Section
                      </label>
                      <select
                        value={selectedSeat}
                        onChange={(e) => setSelectedSeat(e.target.value)}
                        className="select"
                        id="seat-selector"
                      >
                        {SEAT_SECTIONS.map((seat) => (
                          <option key={seat} value={seat}>{seat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price display */}
                    <div className="flex items-center justify-between py-3 border-t border-forge-border">
                      <span className="text-sm text-forge-muted">Mint Price</span>
                      <span className="text-lg font-bold text-accent-purple">
                        {selectedEvent.price} ETH
                      </span>
                    </div>

                    {/* Error message */}
                    {error && (
                      <div className="rounded-lg p-3 text-xs text-accent-coral" style={{ background: 'rgba(244, 63, 94, 0.1)' }}>
                        ⚠️ {error}
                      </div>
                    )}

                    {/* Mint button */}
                    <button
                      onClick={handleMint}
                      disabled={isLoading || mintStatus === 'minting'}
                      className="btn-primary w-full text-base py-4"
                      id="btn-mint"
                    >
                      {mintStatus === 'minting' ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⟳</span>
                          Minting...
                        </span>
                      ) : (
                        <>⛏️ Mint Ticket NFT</>
                      )}
                    </button>

                    <p className="text-[10px] text-forge-muted text-center">
                      Transaction will be sent to Arbitrum Sepolia testnet
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-3xl mb-3 opacity-40">👈</div>
                    <p className="text-sm text-forge-muted">Select an event to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
