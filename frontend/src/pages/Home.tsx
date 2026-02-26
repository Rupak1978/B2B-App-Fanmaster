import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match } from '../types';

export function Home() {
  const { data: matches } = useFetch<Match[]>(() => api.getMatches(), []);
  const live = matches?.filter(m => m.status === 'in_progress') || [];
  const recent = matches?.filter(m => m.status === 'completed').slice(0, 3) || [];
  const s = { fontSize: '14px' } as const;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-5 text-white text-center">
        <h2 className="text-xl font-bold mb-1">CricLive</h2>
        <p className="text-green-100 mb-5" style={s}>Start scoring your match</p>

        {/* 3 Mode Buttons */}
        <div className="space-y-3">
          <Link to="/score/setup" className="block w-full bg-white text-green-700 py-4 rounded-xl font-bold tap-target text-center shadow-lg hover:shadow-xl transition-shadow" style={{ fontSize: '18px' }}>
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12a4 4 0 018 0" /></svg>
              Single Match
            </div>
          </Link>
          <Link to="/tournaments/create" className="block w-full bg-green-500 border-2 border-green-400 text-white py-4 rounded-xl font-bold tap-target text-center hover:bg-green-400 transition-colors" style={{ fontSize: '18px' }}>
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Series
            </div>
          </Link>
          <Link to="/tournaments/create" className="block w-full bg-green-500 border-2 border-green-400 text-white py-4 rounded-xl font-bold tap-target text-center hover:bg-green-400 transition-colors" style={{ fontSize: '18px' }}>
            <div className="flex items-center justify-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Tournament
            </div>
          </Link>
        </div>
      </div>

      {/* Live Matches */}
      {live.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2" style={{ fontSize: '16px' }}><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Live Now</h3>
          <div className="space-y-2">{live.map(m => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div><p className="font-semibold text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p><p className="text-gray-500" style={s}>{m.overs} ov</p></div>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium" style={{ fontSize: '12px' }}>LIVE</span>
              </div>
            </Link>
          ))}</div>
        </section>
      )}

      {/* Recent Results */}
      {recent.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Recent Results</h3>
          <div className="space-y-2">{recent.map(m => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div><p className="font-medium text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p><p className="text-gray-500" style={{ fontSize: '12px' }}>{m.winner_name ? `${m.winner_name} won` : 'Completed'}</p></div>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full" style={{ fontSize: '12px' }}>Done</span>
              </div>
            </Link>
          ))}</div>
        </section>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/players" className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md text-center tap-target">
          <p className="font-medium text-gray-900" style={s}>Players</p>
        </Link>
        <Link to="/records" className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md text-center tap-target">
          <p className="font-medium text-gray-900" style={s}>Records</p>
        </Link>
      </div>
    </div>
  );
}
