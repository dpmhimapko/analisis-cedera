import React from 'react';

export const Mascot = ({ className = "w-24 h-24" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Head */}
    <circle cx="100" cy="60" r="40" fill="#FFE0BD" stroke="black" strokeWidth="4"/>
    {/* Headband (Iket) */}
    <path d="M60 45C60 45 80 35 100 35C120 35 140 45 140 45L145 55H55L60 45Z" fill="#000" stroke="black" strokeWidth="2"/>
    {/* Eyes */}
    <circle cx="85" cy="60" r="5" fill="black"/>
    <circle cx="115" cy="60" r="5" fill="black"/>
    {/* Smile */}
    <path d="M85 80C85 80 95 90 100 90C105 90 115 80 115 80" stroke="black" strokeWidth="3" strokeLinecap="round"/>
    {/* Body (Baju Silat) */}
    <rect x="70" y="100" width="60" height="70" rx="10" fill="black" stroke="black" strokeWidth="4"/>
    {/* Belt (Sabuk) */}
    <rect x="70" y="140" width="60" height="10" fill="#FFD700" stroke="black" strokeWidth="2"/>
    {/* Arms (Kick Pose) */}
    <path d="M70 110L40 100" stroke="black" strokeWidth="8" strokeLinecap="round"/>
    <path d="M130 110L160 100" stroke="black" strokeWidth="8" strokeLinecap="round"/>
    {/* Legs (Front Kick) */}
    <path d="M85 170V190" stroke="black" strokeWidth="8" strokeLinecap="round"/>
    <path d="M115 170L160 150L180 150" stroke="black" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

export const CameraIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

export const HudCornerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 20V2H20" stroke="currentColor" strokeWidth="4" strokeLinecap="square"/>
  </svg>
);

export const TargetIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5"/>
    <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="1"/>
    <path d="M50 0V20M50 80V100M0 50H20M80 50H100" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const ScannerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10H30M10 10V30M70 10H90M90 10V30M10 90H30M10 70V90M70 90H90M90 70V90" stroke="currentColor" strokeWidth="4"/>
    <rect x="20" y="48" width="60" height="4" fill="currentColor">
      <animate attributeName="y" values="20;80;20" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);
