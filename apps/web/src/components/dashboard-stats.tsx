/**
 * DashboardStats Component
 * 
 * Fetches and displays global ticketing statistics from the smart contract.
 * Shows total minted, total accessed (used), and remaining.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTicketContract } from '@/lib/use-ticket-contract';

export function DashboardStats() {
  const { getGlobalStats } = useTicketContract();
  
  const [stats, setStats] = useState<{ totalMinted: number, totalUsed: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getGlobalStats();
        if (data) {
          setStats(data);
        } else {
          // Fallback if contract call fails (e.g., incorrect network)
          setStats({ totalMinted: 0, totalUsed: 0 });
        }
      } catch (e) {
        setStats({ totalMinted: 0, totalUsed: 0 });
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [getGlobalStats]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-light rounded-2xl p-6 h-24" />
        ))}
      </div>
    );
  }

  // Calculate remaining tickets to be scanned
  const totalMinted = stats?.totalMinted || 0;
  const totalUsed = stats?.totalUsed || 0;
  const awaitingCheckIn = totalMinted - totalUsed;
  
  // Progress bar percentage
  const progressPercent = totalMinted > 0 ? (totalUsed / totalMinted) * 100 : 0;

  return (
    <div className="card w-full max-w-4xl mx-auto mb-16 p-8 relative overflow-hidden" id="global-dashboard">
      <div className="absolute top-0 left-0 right-0 h-1 bg-forge-border">
        <div 
          className="h-full bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-magenta transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-sm font-semibold text-forge-muted uppercase tracking-wider flex items-center justify-center gap-2">
          Live Event Statistics
          {useTicketContract().isSimulated && (
            <span className="px-2 py-0.5 rounded-full bg-accent-amber/10 text-accent-amber text-[10px] border border-accent-amber/20">
              Simulation Mode
            </span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-forge-border/50">
        
        {/* Total Minted */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-bold text-white mb-2">
            {totalMinted}
          </div>
          <div className="text-sm font-medium text-forge-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-cyan" />
            Total Tickets Minted
          </div>
        </div>

        {/* Tickets Used */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-bold text-accent-lime mb-2">
            {totalUsed}
          </div>
          <div className="text-sm font-medium text-forge-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-lime" />
            Attendees Checked In
          </div>
        </div>

        {/* Tickets Remaining */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="text-4xl font-bold text-accent-amber mb-2">
            {awaitingCheckIn}
          </div>
          <div className="text-sm font-medium text-forge-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-amber" />
            Awaiting Entry
          </div>
        </div>

      </div>
    </div>
  );
}
