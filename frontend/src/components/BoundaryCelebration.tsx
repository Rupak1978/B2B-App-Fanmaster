import React from 'react';

interface BoundaryCelebrationProps {
  value: 4 | 6;
  onClose: () => void;
}

export function BoundaryCelebration({ value, onClose }: BoundaryCelebrationProps) {
  const is6 = value === 6;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div className="text-center animate-boundary-pop">
        <div
          className={`w-36 h-36 rounded-full flex items-center justify-center mx-auto mb-4 ${
            is6 ? 'bg-purple-500 boundary-glow-purple' : 'bg-blue-500 boundary-glow-blue'
          }`}
        >
          <span className="text-7xl font-black text-white animate-boundary-bounce">
            {value}
          </span>
        </div>
        <p className="text-white text-2xl font-bold animate-boundary-bounce">
          {is6 ? 'SIXER!' : 'FOUR!'}
        </p>
        <div className="mt-2 flex justify-center gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-3 h-3 rounded-full animate-boundary-sparkle ${
                is6 ? 'bg-purple-300' : 'bg-blue-300'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
