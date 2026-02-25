import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Player, Match } from '../types';

export function Records() {
  const [tab, setTab] = useState<'batting' | 'bowling' | 'matches'>('batting');
  const { data: players } = useFetch<Player[]>(() => api.getPlayers(), []);
  const { data: matches } = useFetch<Match[]>(() => api.getMatches(), []);

  const completedMatches = matches?.filter((m) => m.status === 'completed') || [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Records & Stats</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['batting', 'bowling', 'matches'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'batting' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">All Players</h3>
          </div>
          {!players || players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No player data available</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {players.map((p, i) => (
                <Link
                  key={p.id}
                  to={`/players/${p.id}`}
                  className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="w-6 text-sm text-gray-400">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{p.role} {p.team_name ? `- ${p.team_name}` : ''}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bowling' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Bowlers</h3>
          </div>
          {!players || players.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No player data available</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {players
                .filter((p) => p.role === 'bowler' || p.role === 'all-rounder')
                .map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/players/${p.id}`}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 text-sm text-gray-400">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{p.role} {p.team_name ? `- ${p.team_name}` : ''}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">Completed Matches ({completedMatches.length})</h3>
          </div>
          {completedMatches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No completed matches</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {completedMatches.map((m) => (
                <Link
                  key={m.id}
                  to={`/score/${m.id}`}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900 text-sm">{m.team1_name} vs {m.team2_name}</p>
                  <p className="text-xs text-gray-500">
                    {m.winner_name ? `${m.winner_name} won` : 'Match tied'} &middot; {m.overs} overs
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-cricket-600">{players?.length || 0}</p>
          <p className="text-xs text-gray-500">Players</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-cricket-600">{matches?.length || 0}</p>
          <p className="text-xs text-gray-500">Matches</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-cricket-600">{completedMatches.length}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>
    </div>
  );
}
