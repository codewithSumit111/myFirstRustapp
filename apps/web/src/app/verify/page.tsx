/**
 * Verify Page
 * 
 * QR scanner interface for event staff to verify and check-in tickets.
 * Supports both camera scanning and manual token ID input.
 */

'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { QRScanner } from '@/components/qr-scanner';
import { VerificationResult } from '@/components/verification-result';
import { WalletButton } from '@/components/wallet-button';
import { useTicketContract } from '@/lib/use-ticket-contract';
import type { QRPayload, VerificationResult as VerificationResultType } from '@/types/ticket';

type VerifyMode = 'scan' | 'manual';

export default function VerifyPage() {
  const { isConnected } = useAccount();
  const { verifyTicket, markTicketUsed, isLoading } = useTicketContract();

  const [mode, setMode] = useState<VerifyMode>('scan');
  const [result, setResult] = useState<VerificationResultType | null>(null);
  const [manualTokenId, setManualTokenId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  const handleScan = async (payload: QRPayload) => {
    setScannerActive(false);
    setIsVerifying(true);

    const verificationResult = await verifyTicket(payload);
    setResult(verificationResult);
    setIsVerifying(false);
  };

  const handleManualVerify = async () => {
    if (!manualTokenId.trim()) return;

    setIsVerifying(true);
    const payload: QRPayload = {
      tokenId: manualTokenId,
      eventId: '0', // Will be validated against on-chain data
      eventName: '',
      contractAddress: '',
      chainId: 0,
    };

    // For manual entry, do a simplified verification
    const ticket = await verifyTicket(payload);
    setResult(ticket);
    setIsVerifying(false);
  };

  const handleMarkUsed = async (tokenId: bigint) => {
    setIsMarking(true);
    const success = await markTicketUsed(tokenId);
    if (success && result) {
      setResult({
        ...result,
        isValid: false,
        status: 'used',
        message: 'Ticket has been marked as used. Check-in complete!',
        ticket: result.ticket ? { ...result.ticket, isUsed: true } : null,
      });
    }
    setIsMarking(false);
  };

  const handleReset = () => {
    setResult(null);
    setScannerActive(true);
    setManualTokenId('');
  };

  return (
    <main className="min-h-screen pt-24 pb-16 px-4" id="verify-page">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="gradient-text">Verify Tickets</span>
          </h1>
          <p className="text-forge-muted text-sm max-w-lg mx-auto">
            Scan QR codes or enter token IDs to verify and check-in attendees.
          </p>
        </div>

        {/* Connect Wallet Gate */}
        {!isConnected ? (
          <div className="card text-center py-12" id="connect-prompt">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-white mb-2">Connect as Verifier</h2>
            <p className="text-sm text-forge-muted mb-6">
              Connect your wallet to verify and check-in tickets.
              You need verifier permissions to mark tickets as used.
            </p>
            <div className="flex justify-center">
              <WalletButton />
            </div>
          </div>
        ) : result ? (
          /* ── Verification Result ── */
          <div id="verification-result-section">
            <VerificationResult
              result={result}
              onMarkUsed={handleMarkUsed}
              onScanAnother={handleReset}
              isMarking={isMarking}
            />
          </div>
        ) : (
          /* ── Scanner / Manual Input ── */
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 glass-light rounded-lg p-1" id="verify-mode-toggle">
              <button
                onClick={() => { setMode('scan'); setScannerActive(true); }}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'scan'
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-forge-muted hover:text-forge-text'
                }`}
              >
                📷 Camera Scan
              </button>
              <button
                onClick={() => { setMode('manual'); setScannerActive(false); }}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-forge-muted hover:text-forge-text'
                }`}
              >
                ⌨️ Manual Entry
              </button>
            </div>

            {mode === 'scan' ? (
              /* ── QR Scanner ── */
              <div className="card p-0 overflow-hidden" id="scanner-section">
                {isVerifying ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin mb-4" />
                    <p className="text-sm text-forge-muted">Verifying ticket on-chain...</p>
                  </div>
                ) : (
                  <QRScanner
                    onScan={handleScan}
                    onError={(err) => setResult({
                      isValid: false,
                      ticket: null,
                      owner: null,
                      message: err,
                      status: 'error',
                    })}
                    isActive={scannerActive}
                  />
                )}
              </div>
            ) : (
              /* ── Manual Token ID ── */
              <div className="card" id="manual-section">
                <h3 className="text-sm font-semibold text-forge-muted uppercase tracking-wider mb-4">
                  Enter Token ID
                </h3>
                <div className="space-y-4">
                  <input
                    type="number"
                    value={manualTokenId}
                    onChange={(e) => setManualTokenId(e.target.value)}
                    placeholder="e.g., 0, 1, 2..."
                    className="input text-lg"
                    id="manual-token-input"
                    min="0"
                  />
                  <button
                    onClick={handleManualVerify}
                    disabled={!manualTokenId.trim() || isVerifying}
                    className="btn-primary w-full"
                    id="btn-manual-verify"
                  >
                    {isVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Verifying...
                      </span>
                    ) : (
                      '🔍 Verify Ticket'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="glass-light rounded-xl p-4 space-y-2" id="verify-instructions">
              <h4 className="text-xs font-semibold text-forge-muted uppercase tracking-wider">
                How to verify
              </h4>
              <ol className="text-xs text-forge-muted space-y-1.5 list-decimal list-inside">
                <li>Point camera at the ticket QR code, or enter the token ID manually</li>
                <li>The app checks the blockchain for ticket validity and usage status</li>
                <li>If the ticket is valid, click &quot;Mark as Used&quot; to complete check-in</li>
                <li>The ticket is permanently marked on-chain — no re-entry possible</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
