import React from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface VoiceInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export function VoiceInput({ label, value, onChange, placeholder, type = 'text' }: VoiceInputProps) {
  const { isListening, startListening, stopListening, isSupported } = useVoiceInput();

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => onChange(text));
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative flex items-center">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none transition-all text-base"
        />
        {isSupported && (
          <button
            type="button"
            onClick={handleVoice}
            className={`absolute right-2 p-2 rounded-full transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-500 hover:bg-cricket-100 hover:text-cricket-600'
            }`}
            title={isListening ? 'Stop recording' : 'Start voice input'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>
        )}
      </div>
      {isListening && (
        <p className="text-xs text-red-500 mt-1 animate-pulse">Listening...</p>
      )}
    </div>
  );
}
