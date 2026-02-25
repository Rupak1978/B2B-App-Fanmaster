import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match, Tournament } from '../types';

export function Home() {
  const { data: matches } = useFetch<Match[]>(() => api.getMatches(), []);
  const { data: tournaments } = useFetch<Tournament[]>(() => api.getTournaments(), []);

  const liveMatches = matches?.filter((m) => m.status === 'in_progress') || [];
  const recentMatches = matches?.filter((m) => m.status === 'completed').slice(0, 3) || [];
  const upcomingTournaments = tournaments?.filter((t) => t.status === 'upcoming').slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-cricket-600 to-cricket-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to CricLive</h2>
        <p className="text-cricket-100 mb-4">Track every ball, every run, every wicket.</p>
        <div className="flex gap-3">
          <Link
            to="/score/setup"
            className="bg-white text-cricket-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-cricket-50 transition-colors"
          >
            Start Scoring
          </Link>
          <Link
            to="/tournaments/create"
            className="bg-cricket-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-cricket-400 transition-colors border border-cricket-400"
          >
            New Tournament
          </Link>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Now
          </h3>
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <Link
                key={match.id}
                to={`/score/${match.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{match.team1_name} vs {match.team2_name}</p>
                    <p className="text-sm text-gray-500">{match.overs} overs &middot; {match.venue || 'TBD'}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">LIVE</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/score/setup" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-center">
            <div className="w-10 h-10 bg-cricket-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cricket-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">New Match</p>
          </Link>
          <Link to="/tournaments/create" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">New Tournament</p>
          </Link>
          <Link to="/players" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Players</p>
          </Link>
          <Link to="/records" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Records</p>
          </Link>
        </div>
      </section>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Results</h3>
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <Link
                key={match.id}
                to={`/score/${match.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{match.team1_name} vs {match.team2_name}</p>
                    <p className="text-sm text-gray-500">{match.winner_name ? `${match.winner_name} won` : 'Completed'}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Completed</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Tournaments</h3>
          <div className="space-y-2">
            {upcomingTournaments.map((t) => (
              <Link
                key={t.id}
                to={`/tournaments/${t.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.format} &middot; {t.tournament_type} &middot; {t.num_teams} teams</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
