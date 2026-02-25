import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match } from '../types';

export function Score() {
  const { data: matches, loading } = useFetch<Match[]>(() => api.getMatches(), []);
  const live = matches?.filter(m => m.status === 'in_progress') || [];
  const upcoming = matches?.filter(m => m.status === 'upcoming') || [];
  const completed = matches?.filter(m => m.status === 'completed') || [];
  const s = { fontSize: '14px' } as const;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Matches</h2>
        <Link to="/score/setup" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold tap-target" style={s}>+ New Match</Link>
      </div>
      {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}
      {live.length > 0 && (
        <section><h3 className="text-gray-500 uppercase font-semibold mb-2 flex items-center gap-2" style={{ fontSize: '12px' }}><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Live</h3>
          <div className="space-y-2">{live.map(m => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-xl border-2 border-green-200 p-3 hover:shadow-md">
              <div className="flex justify-between items-center">
                <div><p className="font-semibold text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p><p className="text-gray-500" style={{ fontSize: '12px' }}>{m.overs} ov</p></div>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium animate-pulse" style={{ fontSize: '12px' }}>LIVE</span>
              </div></Link>
          ))}</div></section>
      )}
      {upcoming.length > 0 && (
        <section><h3 className="text-gray-500 uppercase font-semibold mb-2" style={{ fontSize: '12px' }}>Upcoming</h3>
          <div className="space-y-2">{upcoming.map(m => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md">
              <div className="flex justify-between items-center">
                <div><p className="font-semibold text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p><p className="text-gray-500" style={{ fontSize: '12px' }}>{m.overs} ov | {m.venue || ''}</p></div>
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full" style={{ fontSize: '12px' }}>Upcoming</span>
              </div></Link>
          ))}</div></section>
      )}
      {completed.length > 0 && (
        <section><h3 className="text-gray-500 uppercase font-semibold mb-2" style={{ fontSize: '12px' }}>Completed</h3>
          <div className="space-y-2">{completed.map(m => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md">
              <div className="flex justify-between items-center">
                <div><p className="font-semibold text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p><p className="text-gray-500" style={{ fontSize: '12px' }}>{m.winner_name ? `${m.winner_name} won` : 'Tied'}</p></div>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full" style={{ fontSize: '12px' }}>Done</span>
              </div></Link>
          ))}</div></section>
      )}
      {!loading && (!matches || matches.length === 0) && (
        <div className="text-center py-12"><p className="text-gray-500 mb-3" style={s}>No matches yet</p>
          <Link to="/score/setup" className="text-green-600 font-semibold hover:underline" style={s}>Start your first match</Link></div>
      )}
    </div>
  );
}
