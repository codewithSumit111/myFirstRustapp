/**
 * Home Page
 * 
 * Landing page for the NFT Event Ticketing dApp.
 * Shows hero section, feature cards, and quick stats.
 */

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16 md:py-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span className="text-sm text-accent-cyan">Powered by Arbitrum Sepolia</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-white">NFT Event</span>
            <br />
            <span className="gradient-text">Ticketing dApp</span>
          </h1>

          <p className="text-lg text-forge-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Mint verifiable NFT tickets, display them with QR codes,<br className="hidden sm:block" />
            and scan to validate at event entry — all on-chain.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/mint" className="btn-primary text-base px-8 py-4 rounded-2xl" id="cta-mint">
              🎫 Mint a Ticket
            </Link>
            <Link href="/verify" className="btn-secondary text-base px-8 py-4 rounded-2xl" id="cta-verify">
              🔍 Verify Tickets
            </Link>
          </div>
        </div>

        {/* ── Feature Cards ── */}
        <section className="mb-20" id="features-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mint */}
            <div className="card group stat-sparkle">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: 'rgba(0, 212, 255, 0.1)' }}>
                🎫
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mint NFT Tickets</h3>
              <p className="text-sm text-forge-muted leading-relaxed">
                Select from upcoming events and mint your ticket as a unique NFT on the Arbitrum network.
                Each ticket stores event data, seat info, and usage status on-chain.
              </p>
            </div>

            {/* Display */}
            <div className="card group stat-sparkle">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                🎟️
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">QR Code Gallery</h3>
              <p className="text-sm text-forge-muted leading-relaxed">
                View all your tickets in a beautiful gallery. Each ticket displays a scannable QR code
                containing the token ID and event verification data.
              </p>
            </div>

            {/* Verify */}
            <div className="card group stat-sparkle">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: 'rgba(192, 38, 211, 0.1)' }}>
                🔍
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">On-Chain Verification</h3>
              <p className="text-sm text-forge-muted leading-relaxed">
                Event staff scan QR codes to verify tickets in real-time. The smart contract ensures
                each ticket can only be used once — no counterfeits possible.
              </p>
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="mb-20" id="how-it-works">
          <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '🦊', title: 'Connect Wallet', desc: 'Link your MetaMask or any Web3 wallet' },
              { step: '02', icon: '🎫', title: 'Choose Event', desc: 'Browse events and select your tickets' },
              { step: '03', icon: '⛏️', title: 'Mint NFT', desc: 'Your ticket is minted as an ERC721 token' },
              { step: '04', icon: '📱', title: 'Scan & Verify', desc: 'Show QR at the door for instant check-in' },
            ].map((item) => (
              <div key={item.step} className="relative glass-light rounded-xl p-5 text-center group">
                <div className="text-xs font-mono text-accent-cyan mb-3 opacity-50">
                  STEP {item.step}
                </div>
                <div className="text-3xl mb-3 group-hover:animate-float">{item.icon}</div>
                <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-forge-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Stack ── */}
        <section className="text-center" id="tech-stack">
          <div className="glass-light rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="text-sm font-semibold text-forge-muted uppercase tracking-wider mb-4">
              Powered By
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              {[
                { name: 'Rust', color: '#f59e0b' },
                { name: 'Arbitrum Stylus', color: '#00d4ff' },
                { name: 'ERC-721', color: '#8b5cf6' },
                { name: 'Next.js', color: '#ffffff' },
                { name: 'RainbowKit', color: '#c026d3' },
                { name: 'wagmi', color: '#22c55e' },
              ].map((tech) => (
                <span key={tech.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: tech.color }} />
                  <span className="text-forge-text font-medium">{tech.name}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}