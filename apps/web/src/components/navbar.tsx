/**
 * Navbar Component
 * 
 * Persistent navigation bar with animated gradient logo,
 * page links, and wallet connection button.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from '@/components/wallet-button';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '⚡' },
  { href: '/mint', label: 'Mint Ticket', icon: '🎫' },
  { href: '/my-tickets', label: 'My Tickets', icon: '🎟️' },
  { href: '/verify', label: 'Verify', icon: '🔍' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass" id="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" id="navbar-logo">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)' }}>
              🎫
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">
              EventTicket NFT
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1" id="nav-links">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center gap-3" id="navbar-wallet">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-forge-border/50 px-2 pb-2 pt-1">
        <div className="flex items-center justify-around gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                pathname === item.href
                  ? 'text-accent-cyan bg-accent-cyan/10'
                  : 'text-forge-muted hover:text-forge-text'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
