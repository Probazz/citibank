'use client';
import { maskCardNumber } from '@/lib/utils';
import { Wifi } from 'lucide-react';

interface BankCardProps {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: string;
  isFrozen?: boolean;
  variant?: 'blue' | 'dark';
}

export function BankCard({ cardNumber, cardHolder, expiryMonth, expiryYear, cardType, isFrozen, variant = 'blue' }: BankCardProps) {
  return (
    <div className={`relative w-full max-w-sm rounded-2xl p-6 overflow-hidden select-none ${variant === 'dark' ? 'bank-card-gold' : 'bank-card'} ${isFrozen ? 'opacity-60 grayscale' : ''}`}>
      {/* Background circles */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-12 -left-8 w-52 h-52 rounded-full bg-white/5" />

      {/* Top row */}
      <div className="flex justify-between items-start mb-8 mr-4 relative">
        <div>
          <div className="flex items-center ml-1 mb-0 mt-0">
            <img
              src="/citibank-logo1.png"
              alt="Citibank"
              className="w-20 h-3"
            />
          </div>

          <p className="text-white font-bold ml-2 text-sm">Priority Account</p>
        </div>
        <Wifi className="w-6 h-6 text-white/80 rotate-90" />
      </div>

      {/* Chip */}
      <div className="w-12 h-10 bg-gradient-to-br from-yellow-000 to-yellow-300 rounded-md flex items-center justify-center">
        <div className="flex items-center mb-0 mt-0">
            <img
              src="/card-chip.png"
              alt="Citibank"
              className="w-[90px] h-[50px]"
            />
          </div>
      </div>

      {/* Card number */}
      <p className="text-white font-mono text-lg tracking-widest mb-5">
        {maskCardNumber(cardNumber)}
      </p>

      {/* Bottom row */}
      <div className="flex justify-between items-end relative">
        <div>
          <p className="text-white/50 text-[10px] uppercase tracking-wide">Card Holder</p>
          <p className="text-white font-semibold text-sm mt-0.5 truncate max-w-[160px]">{cardHolder}</p>
        </div>
        <div className="text-right">
          <p className="text-white/50 text-[10px] uppercase tracking-wide">Expires</p>
          <p className="text-white font-semibold text-sm mt-0.5">{expiryMonth}/{expiryYear.slice(-2)}</p>
        </div>
        <div className="flex">
          <div className="w-8 h-8 bg-red-500/80 rounded-full -mr-3" />
          <div className="w-8 h-8 bg-yellow-500/80 rounded-full" />
        </div>
      </div>

      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
          <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">🔒 FROZEN</span>
        </div>
      )}
    </div>
  );
}