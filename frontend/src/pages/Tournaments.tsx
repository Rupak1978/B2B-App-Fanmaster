import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Tournament } from '../types';

export function Tournaments() {
  const { data: tournaments, loading } = useFetch<Tournament[]>(() => api.getTournaments(), []);
  const s = { fontSize: '14px' } as const;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Tournaments</h2>
        <Link to="/tournaments/create" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold tap-target" style={s}>+ New</Link>
      </div>
      {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && (!tournaments || tournaments.length === 0) && (
        <div className="text-center py-12"><p className="text-gray-500 mb-3" style={s}>No tournaments yet</p>
          <Link to="/tournaments/create" className="text-green-600 font-semibold hover:underline" style={s}>Create your first tournament</Link></div>
      )}
      <div className="space-y-2">{tournaments?.map(t => (
        <Link key={t.id} to={`/tournaments/${t.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div><h3 className="font-semibold text-gray-900" style={s}>{t.name}</h3>
              <p className="text-gray-500 mt-0.5" style={{ fontSize: '12px' }}>{t.format} | {t.tournament_type} | {t.num_teams} teams</p>
              {t.venue && <p className="text-gray-400" style={{ fontSize: '12px' }}>{t.venue}</p>}</div>
            <span className={`px-2 py-0.5 rounded-full font-medium ${t.status==='in_progress'?'bg-green-100 text-green-700':t.status==='completed'?'bg-gray-100 text-gray-600':'bg-blue-100 text-blue-700'}`} style={{ fontSize: '12px' }}>
              {t.status==='in_progress'?'Live':t.status==='completed'?'Done':'Upcoming'}</span>
          </div>
        </Link>
      ))}</div>
    </div>
  );
}

export function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, loading } = useFetch(() => api.getTournament(Number(id)), [id]);
  const s = { fontSize: '14px' } as const;

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!tournament) return <p className="text-center text-gray-500 py-12" style={s}>Tournament not found</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-xl font-bold text-gray-900">{tournament.name}</h2>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full" style={{ fontSize: '12px' }}>{tournament.format}</span>
          <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full" style={{ fontSize: '12px' }}>{tournament.tournament_type}</span>
          <span className={`px-2 py-0.5 rounded-full ${tournament.status==='in_progress'?'bg-green-100 text-green-700':tournament.status==='completed'?'bg-gray-100 text-gray-600':'bg-blue-100 text-blue-700'}`} style={{ fontSize: '12px' }}>{tournament.status}</span>
        </div>
        {tournament.venue && <p className="text-gray-500 mt-2" style={s}>{tournament.venue}</p>}
      </div>
      <section>
        <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Teams ({tournament.teams?.length || 0})</h3>
        {tournament.teams?.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">{tournament.teams.map((t: any) => (
            <div key={t.id} className="bg-white rounded-lg border border-gray-200 p-2.5"><p className="font-medium text-gray-900" style={s}>{t.name}</p></div>
          ))}</div>
        ) : <p className="text-gray-400" style={s}>No teams added</p>}
      </section>
      <section>
        <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Matches</h3>
        {tournament.matches?.length > 0 ? (
          <div className="space-y-2">{tournament.matches.map((m: any) => (
            <Link key={m.id} to={`/score/${m.id}`} className="block bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-sm">
              <div className="flex justify-between items-center">
                <p className="font-medium text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p>
                <span className={`px-2 py-0.5 rounded-full ${m.status==='in_progress'?'bg-green-100 text-green-700':m.status==='completed'?'bg-gray-100 text-gray-600':'bg-blue-100 text-blue-700'}`} style={{ fontSize: '12px' }}>{m.status}</span>
              </div>
            </Link>
          ))}</div>
        ) : <p className="text-gray-400" style={s}>No matches yet</p>}
      </section>
    </div>
  );
}
