import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Player, PlayerStats } from '../types';

export function Players() {
  const { data: players, loading, refetch } = useFetch<Player[]>(() => api.getPlayers(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('batsman');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try { await api.createPlayer({ name: name.trim(), role }); setName(''); setShowAdd(false); refetch(); } catch (e: any) { alert(e.message); } finally { setAdding(false); }
  };

  const badge = (r: string) => ({ batsman: 'bg-blue-100 text-blue-700', bowler: 'bg-red-100 text-red-700', 'all-rounder': 'bg-purple-100 text-purple-700', 'wicket-keeper': 'bg-orange-100 text-orange-700' }[r] || 'bg-gray-100 text-gray-700');
  const s = { fontSize: '14px' } as const;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Players</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold tap-target" style={s}>{showAdd ? 'Cancel' : '+ Add'}</button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Player name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '16px' }} /></div>
          <div className="grid grid-cols-4 gap-2">
            {[{l:'Bat',v:'batsman'},{l:'Bowl',v:'bowler'},{l:'AR',v:'all-rounder'},{l:'WK',v:'wicket-keeper'}].map(r => (
              <button key={r.v} onClick={() => setRole(r.v)} className={`py-2 rounded-lg font-semibold tap-target transition-colors ${role===r.v?'bg-green-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} style={s}>{r.l}</button>
            ))}
          </div>
          <button onClick={handleAdd} disabled={adding||!name.trim()} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold tap-target disabled:opacity-40" style={s}>{adding?'Adding...':'Add Player'}</button>
        </div>
      )}
      {loading && <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>}
      {!loading && (!players || players.length === 0) && <p className="text-center text-gray-500 py-12" style={s}>No players yet</p>}
      <div className="space-y-2">{players?.map(p => (
        <Link key={p.id} to={`/players/${p.id}`} className="block bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div><p className="font-semibold text-gray-900" style={s}>{p.name}</p>{p.team_name && <p className="text-gray-500" style={{ fontSize: '12px' }}>{p.team_name}</p>}</div>
            <span className={`px-2 py-1 rounded-full font-medium capitalize ${badge(p.role)}`} style={{ fontSize: '12px' }}>{p.role}</span>
          </div>
        </Link>
      ))}</div>
    </div>
  );
}

export function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stats, loading } = useFetch<PlayerStats>(() => api.getPlayerStats(Number(id)), [id]);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!stats) return <p className="text-center text-gray-500 py-12" style={{ fontSize: '14px' }}>Player not found</p>;

  const s = { fontSize: '14px' } as const;
  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="text-center"><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-gray-500" style={{ fontSize: '12px' }}>{label}</p></div>
  );

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4 text-white">
        <h2 className="text-xl font-bold">{stats.name}</h2>
        <div className="flex gap-2 mt-1">
          <span className="bg-white/20 px-2 py-0.5 rounded-full capitalize" style={{ fontSize: '12px' }}>{stats.role}</span>
          {stats.team_name && <span className="bg-white/20 px-2 py-0.5 rounded-full" style={{ fontSize: '12px' }}>{stats.team_name}</span>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-gray-500 uppercase font-semibold mb-2" style={{ fontSize: '12px' }}>Batting</p>
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Mat" value={stats.batting.matches} /><Stat label="Runs" value={stats.batting.runs} />
          <Stat label="HS" value={stats.batting.highest_score} /><Stat label="Avg" value={stats.batting.average} />
          <Stat label="SR" value={stats.batting.strike_rate} /><Stat label="Balls" value={stats.batting.balls_faced} />
          <Stat label="4s" value={stats.batting.fours} /><Stat label="6s" value={stats.batting.sixes} />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <p className="text-gray-500 uppercase font-semibold mb-2" style={{ fontSize: '12px' }}>Bowling</p>
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Overs" value={stats.bowling.overs} /><Stat label="Wkts" value={stats.bowling.wickets} />
          <Stat label="Runs" value={stats.bowling.runs_conceded} /><Stat label="Econ" value={stats.bowling.economy} />
          <Stat label="Avg" value={stats.bowling.average} /><Stat label="Best" value={`${stats.bowling.best_wickets}/${stats.bowling.best_figures_runs}`} />
          <Stat label="5W" value={stats.bowling.five_wicket_hauls} /><Stat label="Mdns" value={stats.bowling.maidens} />
        </div>
      </div>
      {stats.match_history && stats.match_history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-gray-500 uppercase font-semibold mb-2" style={{ fontSize: '12px' }}>Match History</p>
          {stats.match_history.map(mh => (
            <div key={mh.id} className="border-b border-gray-100 py-1.5 last:border-0">
              <p className="font-medium text-gray-800" style={s}>{mh.runs_scored} ({mh.balls_faced}) | {mh.wickets_taken}/{mh.runs_conceded}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
