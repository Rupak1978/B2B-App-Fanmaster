import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Player, PlayerStats } from '../types';
import { VoiceInput } from '../components/VoiceInput';

export function Players() {
  const { data: players, loading, refetch } = useFetch<Player[]>(() => api.getPlayers(), []);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('batsman');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setAdding(true);
    try {
      await api.createPlayer({ name: name.trim(), role });
      setName('');
      setShowAdd(false);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      batsman: 'bg-blue-100 text-blue-700',
      bowler: 'bg-red-100 text-red-700',
      'all-rounder': 'bg-purple-100 text-purple-700',
      'wicket-keeper': 'bg-orange-100 text-orange-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Players</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cricket-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cricket-600 transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Player'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <VoiceInput label="Player Name" value={name} onChange={setName} placeholder="Enter player name" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Batsman', value: 'batsman' },
                { label: 'Bowler', value: 'bowler' },
                { label: 'All-Rounder', value: 'all-rounder' },
                { label: 'WK', value: 'wicket-keeper' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    role === r.value ? 'bg-cricket-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !name.trim()}
            className="w-full bg-cricket-500 text-white py-2.5 rounded-lg font-semibold hover:bg-cricket-600 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Player'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (!players || players.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500">No players yet. Add your first player above.</p>
        </div>
      )}

      <div className="space-y-2">
        {players?.map((p) => (
          <Link
            key={p.id}
            to={`/players/${p.id}`}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                {p.team_name && <p className="text-sm text-gray-500">{p.team_name}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getRoleBadge(p.role)}`}>
                {p.role}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: stats, loading } = useFetch<PlayerStats>(() => api.getPlayerStats(Number(id)), [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <p className="text-center text-gray-500 py-12">Player not found</p>;

  return (
    <div className="space-y-4">
      {/* Player Header */}
      <div className="bg-gradient-to-br from-cricket-600 to-cricket-800 rounded-2xl p-5 text-white">
        <h2 className="text-2xl font-bold">{stats.name}</h2>
        <div className="flex gap-2 mt-2">
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full capitalize">{stats.role}</span>
          {stats.team_name && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{stats.team_name}</span>
          )}
        </div>
      </div>

      {/* Batting Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Batting</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Matches', value: stats.batting.matches },
            { label: 'Runs', value: stats.batting.runs },
            { label: 'HS', value: stats.batting.highest_score },
            { label: 'Avg', value: stats.batting.average },
            { label: 'SR', value: stats.batting.strike_rate },
            { label: 'Balls', value: stats.batting.balls_faced },
            { label: '4s', value: stats.batting.fours },
            { label: '6s', value: stats.batting.sixes },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bowling Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bowling</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Overs', value: stats.bowling.overs },
            { label: 'Wickets', value: stats.bowling.wickets },
            { label: 'Runs', value: stats.bowling.runs_conceded },
            { label: 'Econ', value: stats.bowling.economy },
            { label: 'Avg', value: stats.bowling.average },
            { label: 'Best', value: `${stats.bowling.best_wickets}/${stats.bowling.best_figures_runs}` },
            { label: '5W', value: stats.bowling.five_wicket_hauls },
            { label: 'Maidens', value: stats.bowling.maidens },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Match History */}
      {stats.match_history && stats.match_history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Match History</h3>
          <div className="space-y-2">
            {stats.match_history.map((mh) => (
              <div key={mh.id} className="border-b border-gray-100 pb-2 last:border-0">
                <p className="text-sm font-medium text-gray-800">
                  {mh.runs_scored} ({mh.balls_faced}) &middot; {mh.wickets_taken}/{mh.runs_conceded}
                </p>
                <p className="text-xs text-gray-500">{mh.match_id}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
