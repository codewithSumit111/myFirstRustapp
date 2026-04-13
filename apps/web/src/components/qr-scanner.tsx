/**
 * QRScanner Component
 * 
 * Camera-based QR code scanner for event staff to verify tickets.
 * Uses html5-qrcode for cross-browser camera access.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { QRPayload } from '@/types/ticket';

interface QRScannerProps {
  onScan: (payload: QRPayload) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export function QRScanner({ onScan, onError, isActive = true }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCode = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const handleScanSuccess = useCallback((decodedText: string) => {
    // Prevent duplicate scans of the same QR within 3 seconds
    if (decodedText === lastScanned) return;
    setLastScanned(decodedText);
    setTimeout(() => setLastScanned(null), 3000);

    try {
      const payload: QRPayload = JSON.parse(decodedText);

      // Validate payload structure
      if (!payload.tokenId || !payload.eventId || !payload.contractAddress) {
        onError?.('Invalid ticket QR code format');
        return;
      }

      onScan(payload);
    } catch {
      onError?.('Could not parse QR code data');
    }
  }, [lastScanned, onScan, onError]);

  useEffect(() => {
    if (!isActive || !scannerRef.current) return;

    let scanner: any = null;

    const initScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        scanner = new Html5Qrcode('qr-scanner-region');
        html5QrCode.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          () => {} // Ignore scan failures (continuous scanning)
        );

        setIsScanning(true);
        setCameraError(null);
      } catch (err: any) {
        console.error('Camera error:', err);
        setCameraError(
          err.message?.includes('Permission')
            ? 'Camera permission denied. Please allow camera access.'
            : 'Unable to access camera. Please check your device.'
        );
        setIsScanning(false);
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear();
      }
    };
  }, [isActive, handleScanSuccess]);

  return (
    <div className="w-full" id="qr-scanner-container">
      {cameraError ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-accent-coral mb-2">Camera Error</h3>
          <p className="text-sm text-forge-muted mb-6 max-w-sm mx-auto">{cameraError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            🔄 Try Again
          </button>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden">
          {/* Scanner region */}
          <div
            id="qr-scanner-region"
            ref={scannerRef}
            className="w-full"
            style={{ minHeight: '300px' }}
          />

          {/* Overlay with scanning frame */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Corner markers */}
              <div className="relative w-[250px] h-[250px]">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent-cyan rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent-cyan rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent-cyan rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent-cyan rounded-br-lg" />

                {/* Scan line */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent scan-line"
                  style={{ opacity: 0.7 }}
                />
              </div>
            </div>
          )}

          {/* Status indicator */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="glass-light rounded-full px-4 py-2 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-accent-lime animate-pulse-glow' : 'bg-accent-amber'}`} />
              <span className="text-xs font-medium text-forge-text">
                {isScanning ? 'Scanning for tickets...' : 'Initializing camera...'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
