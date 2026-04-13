/**
 * VerificationResult Component
 * 
 * Displays the result of scanning and verifying a ticket QR code.
 * Shows validity status, ticket details, and allows marking as used.
 */

'use client';

import type { VerificationResult as VerificationResultType } from '@/types/ticket';

interface VerificationResultProps {
  result: VerificationResultType;
  onMarkUsed?: (tokenId: bigint) => void;
  onScanAnother?: () => void;
  isMarking?: boolean;
}

export function VerificationResult({
  result,
  onMarkUsed,
  onScanAnother,
  isMarking = false,
}: VerificationResultProps) {
  const statusConfig = {
    valid: {
      icon: '✓',
      title: 'Ticket Valid',
      color: '#22c55e',
      bgGlow: 'rgba(34, 197, 94, 0.08)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    used: {
      icon: '✕',
      title: 'Already Used',
      color: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.08)',
      borderColor: 'rgba(244, 63, 94, 0.3)',
    },
    'not-found': {
      icon: '?',
      title: 'Not Found',
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    error: {
      icon: '!',
      title: 'Error',
      color: '#f43f5e',
      bgGlow: 'rgba(244, 63, 94, 0.08)',
      borderColor: 'rgba(244, 63, 94, 0.3)',
    },
  };

  const config = statusConfig[result.status];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-500 animate-in"
      style={{
        background: config.bgGlow,
        border: `1px solid ${config.borderColor}`,
      }}
      id="verification-result"
    >
      <div className="p-6">
        {/* Status icon */}
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3"
            style={{
              background: `${config.color}15`,
              color: config.color,
              boxShadow: `0 0 30px ${config.color}20`,
            }}
          >
            {config.icon}
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: config.color }}
          >
            {config.title}
          </h2>
          <p className="text-sm text-forge-muted mt-1">{result.message}</p>
        </div>

        {/* Ticket details */}
        {result.ticket && (
          <div className="space-y-3 mb-6">
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(12, 12, 18, 0.5)' }}
            >
              <DetailRow label="Event" value={result.ticket.eventName} />
              <DetailRow label="Date" value={result.ticket.eventDate} />
              <DetailRow label="Seat" value={result.ticket.seatInfo} />
              <DetailRow
                label="Token ID"
                value={`#${result.ticket.tokenId.toString().padStart(4, '0')}`}
                mono
              />
              {result.owner && (
                <DetailRow
                  label="Owner"
                  value={`${result.owner.slice(0, 6)}...${result.owner.slice(-4)}`}
                  mono
                />
              )}
              {result.ticket.isUsed && (
                <DetailRow
                  label="Used At"
                  value={`Block timestamp: ${result.ticket.usedAt.toString()}`}
                  highlight="coral"
                />
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          {result.isValid && onMarkUsed && result.ticket && (
            <button
              onClick={() => onMarkUsed(result.ticket!.tokenId)}
              disabled={isMarking}
              className="btn-primary w-full flex items-center justify-center gap-2"
              id="btn-mark-used"
            >
              {isMarking ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Marking as Used...
                </>
              ) : (
                <>
                  ✓ Mark as Used (Check-in)
                </>
              )}
            </button>
          )}

          {onScanAnother && (
            <button
              onClick={onScanAnother}
              className="btn-secondary w-full"
              id="btn-scan-another"
            >
              📷 Scan Another Ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Helper component for detail rows */
function DetailRow({
  label,
  value,
  mono = false,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: 'coral' | 'lime' | 'cyan';
}) {
  const highlightColors: Record<string, string> = {
    coral: '#f43f5e',
    lime: '#22c55e',
    cyan: '#00d4ff',
  };

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-forge-muted">{label}</span>
      <span
        className={`${mono ? 'font-mono' : 'font-medium'} truncate ml-4 max-w-[200px]`}
        style={{ color: highlight ? highlightColors[highlight] : 'var(--color-text)' }}
      >
        {value}
      </span>
    </div>
  );
}
