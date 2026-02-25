import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match, Tournament } from '../types';

export function Home() {
  const { data: matches } = useFetch<Match[]>(() => api.getMatches(), []);
  const { data: tournaments } = useFetch<Tournament[]>(() => api.getTournaments(), []);

  const live = matches?.filter(m => m.status === 'in_progress') || [];
  const recent = matches?.filter(m => m.status === 'completed').slice(0, 3) || [];
  const upcoming = tournaments?.filter(t => t.status === 'upcoming').slice(0, 3) || [];

  const s = { fontSize: '14px' } as const;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome to CricLive</h2>
        <p className="text-green-100 mb-3" style={s}>Gully cricket scoring & stats</p>
        <div className="flex gap-2">
          <Link to="/score/setup" className="bg-white text-green-700 px-4 py-2.5 rounded-lg font-semibold tap-target" style={s}>Start Scoring</Link>
          <Link to="/tournaments/create" className="bg-green-500 text-white px-4 py-2.5 rounded-lg font-semibold border border-green-400 tap-target" style={s}>New Tournament</Link>
        </div>
      </div>

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

      <section>
        <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[{to:'/score/setup',label:'New Match',color:'bg-green-100 text-green-700'},
            {to:'/tournaments/create',label:'New Tournament',color:'bg-purple-100 text-purple-700'},
            {to:'/players',label:'Players',color:'bg-blue-100 text-blue-700'},
            {to:'/records',label:'Records',color:'bg-orange-100 text-orange-700'}].map(a => (
            <Link key={a.to} to={a.to} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow text-center tap-target">
              <div className={`w-10 h-10 ${a.color} rounded-lg flex items-center justify-center mx-auto mb-1`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="font-medium text-gray-900" style={s}>{a.label}</p>
            </Link>
          ))}
        </div>
      </section>

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

      {upcoming.length > 0 && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Upcoming Tournaments</h3>
          <div className="space-y-2">{upcoming.map(t => (
            <Link key={t.id} to={`/tournaments/${t.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md">
              <p className="font-medium text-gray-900" style={s}>{t.name}</p>
              <p className="text-gray-500" style={{ fontSize: '12px' }}>{t.format} | {t.tournament_type} | {t.num_teams} teams</p>
            </Link>
          ))}</div>
        </section>
      )}
    </div>
  );
}
