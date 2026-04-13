/**
 * TicketCard Component
 * 
 * Displays a single NFT ticket with holographic styling,
 * event metadata, QR code, and status badge.
 */

'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Ticket, QRPayload } from '@/types/ticket';
import { TICKET_NFT_ADDRESS, CHAIN_ID } from '@/lib/contracts/ticket-nft';

interface TicketCardProps {
  ticket: Ticket;
  showQR?: boolean;
  compact?: boolean;
}

export function TicketCard({ ticket, showQR = true, compact = false }: TicketCardProps) {
  const [showFullQR, setShowFullQR] = useState(false);

  // Build QR payload
  const qrPayload: QRPayload = {
    tokenId: ticket.tokenId.toString(),
    walletAddress: ticket.originalOwner,
    eventId: ticket.eventId.toString(),
    eventName: ticket.eventName,
    contractAddress: TICKET_NFT_ADDRESS,
    chainId: CHAIN_ID,
  };

  const qrData = JSON.stringify(qrPayload);

  return (
    <div
      className={`ticket-holographic rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
        ticket.isUsed ? 'opacity-70' : ''
      }`}
      style={{
        background: 'linear-gradient(160deg, rgba(20, 20, 32, 0.9) 0%, rgba(12, 12, 18, 0.95) 100%)',
        border: `1px solid ${ticket.isUsed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(0, 212, 255, 0.15)'}`,
      }}
      id={`ticket-card-${ticket.tokenId.toString()}`}
    >
      {/* Ticket header stripe */}
      <div
        className="h-1.5"
        style={{
          background: ticket.isUsed
            ? 'linear-gradient(90deg, #f43f5e, #ef4444, #f43f5e)'
            : 'linear-gradient(90deg, #00d4ff, #8b5cf6, #c026d3)',
        }}
      />

      <div className={`${compact ? 'p-4' : 'p-5'}`}>
        {/* Top row: Token ID + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-forge-muted">
              #{ticket.tokenId.toString().padStart(4, '0')}
            </span>
            <span className="text-xs text-forge-muted">•</span>
            <span className="text-xs font-mono text-forge-muted truncate max-w-[100px]">
              {ticket.originalOwner.slice(0, 6)}...{ticket.originalOwner.slice(-4)}
            </span>
          </div>
          <span className={`badge ${ticket.isUsed ? 'badge-used' : 'badge-valid'}`}>
            {ticket.isUsed ? '✕ Used' : '✓ Valid'}
          </span>
        </div>

        {/* Event name */}
        <h3 className={`font-bold mb-1 ${compact ? 'text-base' : 'text-lg'} ${
          ticket.isUsed ? 'text-forge-muted' : 'text-white'
        }`}>
          {ticket.eventName}
        </h3>

        {/* Event details */}
        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2 text-xs text-forge-muted">
            <span>📅</span>
            <span>{new Date(ticket.eventDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-forge-muted">
            <span>💺</span>
            <span>{ticket.seatInfo}</span>
          </div>
          {ticket.isUsed && (
            <div className="flex items-center gap-2 text-xs text-accent-coral">
              <span>⏱️</span>
              <span>Used at block timestamp: {ticket.usedAt.toString()}</span>
            </div>
          )}
        </div>

        {/* Dashed divider ─ mimics a tear-off ticket */}
        {showQR && (
          <>
            <div className="border-t border-dashed border-forge-border/50 my-4 relative">
              <div className="absolute -left-6 -top-[10px] w-5 h-5 rounded-full" style={{ background: 'var(--color-bg)' }} />
              <div className="absolute -right-6 -top-[10px] w-5 h-5 rounded-full" style={{ background: 'var(--color-bg)' }} />
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="p-3 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg"
                style={{ background: 'white' }}
                onClick={() => setShowFullQR(!showFullQR)}
              >
                <QRCodeSVG
                  value={qrData}
                  size={showFullQR ? 220 : (compact ? 100 : 140)}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#050508"
                />
              </div>
              <p className="text-[10px] text-forge-muted font-mono text-center">
                {showFullQR ? 'Click to minimize' : 'Scan to verify • Click to enlarge'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
