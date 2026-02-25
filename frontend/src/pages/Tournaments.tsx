import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Tournament } from '../types';

export function Tournaments() {
  const { data: tournaments, loading } = useFetch<Tournament[]>(() => api.getTournaments(), []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Tournaments</h2>
        <Link
          to="/tournaments/create"
          className="bg-cricket-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cricket-600 transition-colors"
        >
          + New Tournament
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (!tournaments || tournaments.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No tournaments yet</p>
          <Link to="/tournaments/create" className="text-cricket-600 font-semibold hover:underline">
            Create your first tournament
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {tournaments?.map((t) => (
          <Link
            key={t.id}
            to={`/tournaments/${t.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t.format} &middot; {t.tournament_type} &middot; {t.num_teams} teams
                </p>
                {t.venue && <p className="text-sm text-gray-400 mt-0.5">{t.venue}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                t.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                t.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                'bg-blue-100 text-blue-700'
              }`}>
                {t.status === 'in_progress' ? 'Live' : t.status === 'completed' ? 'Done' : 'Upcoming'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, loading } = useFetch(() => api.getTournament(Number(id)), [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) return <p className="text-center text-gray-500 py-12">Tournament not found</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xl font-bold text-gray-900">{tournament.name}</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs bg-cricket-100 text-cricket-700 px-2 py-1 rounded-full">{tournament.format}</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{tournament.tournament_type}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            tournament.status === 'in_progress' ? 'bg-green-100 text-green-700' :
            tournament.status === 'completed' ? 'bg-gray-100 text-gray-600' :
            'bg-blue-100 text-blue-700'
          }`}>
            {tournament.status}
          </span>
        </div>
        {tournament.venue && <p className="text-sm text-gray-500 mt-2">{tournament.venue}</p>}
        {tournament.start_date && <p className="text-sm text-gray-400">{new Date(tournament.start_date).toLocaleDateString()}</p>}
      </div>

      {/* Teams */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Teams ({tournament.teams?.length || 0})</h3>
        {tournament.teams?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {tournament.teams.map((team: any) => (
              <div key={team.id} className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="font-medium text-gray-900 text-sm">{team.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No teams added yet</p>
        )}
      </section>

      {/* Schedule */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Schedule</h3>
        {tournament.matches?.length > 0 ? (
          <div className="space-y-2">
            {tournament.matches.map((match: any) => (
              <Link
                key={match.id}
                to={`/score/${match.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm text-gray-900">{match.team1_name} vs {match.team2_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    match.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                    match.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {match.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No matches scheduled yet</p>
        )}
      </section>
    </div>
  );
}
