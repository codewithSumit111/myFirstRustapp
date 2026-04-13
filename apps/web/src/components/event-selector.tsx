/**
 * EventSelector Component
 * 
 * A rich card-based event picker showing event details,
 * availability, pricing, and a selection indicator.
 */

'use client';

import { useState } from 'react';
import type { MockEvent } from '@/types/ticket';
import { MOCK_EVENTS } from '@/lib/contracts/ticket-nft';

interface EventSelectorProps {
  selectedEvent: MockEvent | null;
  onSelect: (event: MockEvent) => void;
}

export function EventSelector({ selectedEvent, onSelect }: EventSelectorProps) {
  return (
    <div className="space-y-3" id="event-selector">
      <h3 className="text-sm font-semibold text-forge-muted uppercase tracking-wider mb-4">
        Select an Event
      </h3>

      <div className="grid gap-3">
        {MOCK_EVENTS.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          const availability = ((event.totalTickets - event.soldTickets) / event.totalTickets) * 100;
          const spotsLeft = event.totalTickets - event.soldTickets;

          return (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              id={`event-option-${event.id}`}
              className={`w-full text-left rounded-xl p-4 transition-all duration-300 group ${
                isSelected
                  ? 'border-gradient glow-cyan'
                  : 'border border-forge-border hover:border-forge-muted'
              }`}
              style={{
                background: isSelected
                  ? 'rgba(0, 212, 255, 0.05)'
                  : 'var(--color-surface)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Event name */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold text-sm truncate ${
                      isSelected ? 'text-accent-cyan' : 'text-forge-text group-hover:text-white'
                    }`}>
                      {event.name}
                    </h4>
                    {isSelected && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-cyan/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-accent-cyan" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Date & Venue */}
                  <p className="text-xs text-forge-muted mb-2">
                    📅 {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {' • '}
                    📍 {event.venue}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-forge-muted/70 line-clamp-2 mb-3">
                    {event.description}
                  </p>

                  {/* Availability bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-forge-border overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(event.soldTickets / event.totalTickets) * 100}%`,
                          background: availability > 30
                            ? 'linear-gradient(90deg, #22c55e, #00d4ff)'
                            : availability > 10
                              ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                              : 'linear-gradient(90deg, #f43f5e, #ef4444)',
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${
                      availability > 30 ? 'text-accent-lime' : availability > 10 ? 'text-accent-amber' : 'text-accent-coral'
                    }`}>
                      {spotsLeft} left
                    </span>
                  </div>
                </div>

                {/* Price tag */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-forge-muted mb-0.5">Price</div>
                  <div className="text-sm font-bold text-accent-purple">
                    {event.price} ETH
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
