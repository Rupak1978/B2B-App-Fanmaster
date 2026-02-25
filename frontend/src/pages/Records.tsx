import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../utils/api';
import { Match } from '../types';

export function Records() {
  const [tab, setTab] = useState<'batting' | 'bowling' | 'matches'>('batting');
  const { data: allStats } = useFetch<any[]>(() => api.getAllPlayerStats(), []);
  const { data: matches } = useFetch<Match[]>(() => api.getMatches(), []);

  const completed = matches?.filter(m => m.status === 'completed') || [];
  const stats = allStats || [];

  const topRuns = [...stats].sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 20);
  const topHS = [...stats].sort((a, b) => b.batting.highest_score - a.batting.highest_score).slice(0, 10);
  const topFours = [...stats].sort((a, b) => b.batting.fours - a.batting.fours).slice(0, 10);
  const topSixes = [...stats].sort((a, b) => b.batting.sixes - a.batting.sixes).slice(0, 10);
  const topAvg = [...stats].filter(s => s.batting.matches >= 2).sort((a, b) => parseFloat(b.batting.average) - parseFloat(a.batting.average)).slice(0, 10);

  const topWickets = [...stats].sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 20);
  const topEcon = [...stats].filter(s => s.bowling.overs >= 2).sort((a, b) => parseFloat(a.bowling.economy) - parseFloat(b.bowling.economy)).slice(0, 10);
  const topBF = [...stats].filter(s => s.bowling.best_wickets > 0).sort((a, b) => b.bowling.best_wickets - a.bowling.best_wickets || a.bowling.best_figures_runs - b.bowling.best_figures_runs).slice(0, 10);

  const s = { fontSize: '14px' } as const;
  const sh = { fontSize: '12px' } as const;

  const Row = ({ rank, name, id, val }: { rank: number; name: string; id: number; val: string }) => (
    <Link to={`/players/${id}`} className="flex items-center px-3 py-2 hover:bg-gray-50 border-t border-gray-100">
      <span className="w-6 text-gray-400" style={s}>{rank}</span>
      <span className="flex-1 font-medium text-gray-900 text-truncate" style={s}>{name}</span>
      <span className="font-semibold text-gray-800" style={s}>{val}</span>
    </Link>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900">Records</h2>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {(['batting','bowling','matches'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-md font-semibold capitalize tap-target transition-colors ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700'}`} style={s}>{t}</button>
        ))}
      </div>

      {tab === 'batting' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Most Runs</span></div>
            {topRuns.length === 0 ? <p className="text-gray-400 text-center py-6" style={s}>No data</p> :
              topRuns.map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={`${p.batting.runs} (${p.batting.matches}m)`} />)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Highest Score</span></div>
            {topHS.filter(p => p.batting.highest_score > 0).map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={String(p.batting.highest_score)} />)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Best Average (2+ matches)</span></div>
            {topAvg.map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={p.batting.average} />)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={sh}>Most 4s</span></div>
              {topFours.filter(p => p.batting.fours > 0).slice(0, 5).map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={String(p.batting.fours)} />)}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={sh}>Most 6s</span></div>
              {topSixes.filter(p => p.batting.sixes > 0).slice(0, 5).map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={String(p.batting.sixes)} />)}
            </div>
          </div>
        </div>
      )}

      {tab === 'bowling' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Most Wickets</span></div>
            {topWickets.length === 0 ? <p className="text-gray-400 text-center py-6" style={s}>No data</p> :
              topWickets.filter(p => p.bowling.wickets > 0).map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={`${p.bowling.wickets} (${p.bowling.overs}ov)`} />)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Best Bowling Figures</span></div>
            {topBF.map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={`${p.bowling.best_wickets}/${p.bowling.best_figures_runs}`} />)}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Best Economy (2+ ov)</span></div>
            {topEcon.map((p, i) => <Row key={p.id} rank={i+1} name={p.name} id={p.id} val={p.bowling.economy} />)}
          </div>
        </div>
      )}

      {tab === 'matches' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200"><span className="font-semibold text-gray-700" style={s}>Completed ({completed.length})</span></div>
          {completed.length === 0 ? <p className="text-gray-400 text-center py-6" style={s}>No completed matches</p> :
            completed.map(m => (
              <Link key={m.id} to={`/score/${m.id}`} className="block px-3 py-2 hover:bg-gray-50 border-t border-gray-100">
                <p className="font-medium text-gray-900" style={s}>{m.team1_name} vs {m.team2_name}</p>
                <p className="text-gray-500" style={sh}>{m.winner_name ? `${m.winner_name} won` : 'Tied'} | {m.overs} ov</p>
              </Link>
            ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center"><p className="text-2xl font-bold text-green-700">{stats.length}</p><p className="text-gray-500" style={sh}>Players</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center"><p className="text-2xl font-bold text-green-700">{matches?.length || 0}</p><p className="text-gray-500" style={sh}>Matches</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center"><p className="text-2xl font-bold text-green-700">{completed.length}</p><p className="text-gray-500" style={sh}>Completed</p></div>
      </div>
    </div>
  );
}
