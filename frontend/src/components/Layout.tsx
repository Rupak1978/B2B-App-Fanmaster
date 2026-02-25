import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cricket-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12a4 4 0 018 0" fill="none" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">CricLive</h1>
          </div>
          <span className="text-xs text-gray-400 font-medium">Live Scoring & Stats</span>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
