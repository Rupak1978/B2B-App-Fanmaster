import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match } from '../types';

export function Score() {
  const { data: matches, loading } = useFetch<Match[]>(() => api.getMatches(), []);

  const liveMatches = matches?.filter((m) => m.status === 'in_progress') || [];
  const upcomingMatches = matches?.filter((m) => m.status === 'upcoming') || [];
  const completedMatches = matches?.filter((m) => m.status === 'completed') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Matches</h2>
        <Link
          to="/score/setup"
          className="bg-cricket-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cricket-600 transition-colors"
        >
          + New Match
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Live */}
      {liveMatches.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live
          </h3>
          <div className="space-y-2">
            {liveMatches.map((m) => (
              <Link
                key={m.id}
                to={`/score/${m.id}`}
                className="block bg-white rounded-xl border-2 border-green-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{m.team1_name} vs {m.team2_name}</p>
                    <p className="text-sm text-gray-500">{m.overs} overs</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium animate-pulse">LIVE</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingMatches.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Upcoming</h3>
          <div className="space-y-2">
            {upcomingMatches.map((m) => (
              <Link
                key={m.id}
                to={`/score/${m.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{m.team1_name} vs {m.team2_name}</p>
                    <p className="text-sm text-gray-500">{m.overs} overs &middot; {m.venue || ''}</p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Upcoming</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedMatches.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Completed</h3>
          <div className="space-y-2">
            {completedMatches.map((m) => (
              <Link
                key={m.id}
                to={`/score/${m.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{m.team1_name} vs {m.team2_name}</p>
                    <p className="text-sm text-gray-500">{m.winner_name ? `${m.winner_name} won` : 'Match tied'}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Done</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && (!matches || matches.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No matches yet</p>
          <Link to="/score/setup" className="text-cricket-600 font-semibold hover:underline">
            Start your first match
          </Link>
        </div>
      )}
    </div>
  );
}
