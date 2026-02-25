import React from 'react';
import { Innings } from '../types';

interface ScoreCardProps { innings: Innings; targetRuns?: number; }

export function ScoreCard({ innings, targetRuns }: ScoreCardProps) {
  const rr = innings.total_overs > 0 ? (innings.total_runs / innings.total_overs).toFixed(2) : '0.00';
  const s = { fontSize: '14px' } as const;
  const sh = { fontSize: '12px' } as const;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-green-700 text-white px-3 py-2.5">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-truncate" style={s}>{innings.batting_team_name || `Innings ${innings.innings_number}`}</span>
          <div className="text-right"><span className="text-xl font-bold">{innings.total_runs}/{innings.total_wickets}</span><span className="ml-1 opacity-80" style={sh}>({innings.total_overs} ov)</span></div>
        </div>
        <div className="flex justify-between mt-0.5 opacity-80" style={sh}>
          <span>RR: {rr}</span>
          {targetRuns && <span>Target: {targetRuns}</span>}
        </div>
      </div>

      {/* Batting Table */}
      {innings.batting && innings.batting.length > 0 && (
        <div className="px-3 py-2 overflow-x-auto">
          <table className="w-full" style={s}>
            <thead><tr className="text-gray-400" style={sh}>
              <th className="text-left pb-1 font-medium">Batsman</th><th className="text-left pb-1 font-medium">Status</th>
              <th className="text-right pb-1 font-medium">R</th><th className="text-right pb-1 font-medium">B</th>
              <th className="text-right pb-1 font-medium">4s</th><th className="text-right pb-1 font-medium">6s</th><th className="text-right pb-1 font-medium">SR</th>
            </tr></thead>
            <tbody>{innings.batting.filter(b => b.balls_faced > 0 || b.dismissal_type).map(b => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="py-1 font-medium text-gray-800 text-truncate" style={{ maxWidth: '80px', ...s }}>{b.player_name}</td>
                <td className="py-1 text-gray-500 text-truncate" style={{ maxWidth: '100px', ...sh }}>{b.dismissal_info || (innings.is_completed ? 'not out' : 'batting')}</td>
                <td className="text-right font-semibold" style={s}>{b.runs_scored}</td>
                <td className="text-right text-gray-500" style={s}>{b.balls_faced}</td>
                <td className="text-right text-gray-500" style={s}>{b.fours}</td>
                <td className="text-right text-gray-500" style={s}>{b.sixes}</td>
                <td className="text-right text-gray-500" style={s}>{b.balls_faced > 0 ? ((b.runs_scored / b.balls_faced) * 100).toFixed(1) : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Extras Breakdown */}
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100" style={sh}>
        <span className="text-gray-500">Extras: {innings.extras} </span>
        <span className="text-gray-400">(wd {innings.extras_wide || 0}, nb {innings.extras_noball || 0}, b {innings.extras_bye || 0}, lb {innings.extras_legbye || 0})</span>
      </div>

      {/* Bowling Table */}
      {innings.bowling && innings.bowling.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 overflow-x-auto">
          <table className="w-full" style={s}>
            <thead><tr className="text-gray-400" style={sh}>
              <th className="text-left pb-1 font-medium">Bowler</th><th className="text-right pb-1 font-medium">O</th>
              <th className="text-right pb-1 font-medium">M</th><th className="text-right pb-1 font-medium">R</th>
              <th className="text-right pb-1 font-medium">W</th><th className="text-right pb-1 font-medium">Econ</th>
            </tr></thead>
            <tbody>{innings.bowling.filter(b => b.overs_bowled > 0 || b.runs_conceded > 0).map(b => (
              <tr key={b.id} className="border-t border-gray-100">
                <td className="py-1 font-medium text-gray-800 text-truncate" style={{ maxWidth: '90px', ...s }}>{b.player_name}</td>
                <td className="text-right" style={s}>{b.overs_bowled}</td>
                <td className="text-right text-gray-500" style={s}>{b.maidens}</td>
                <td className="text-right" style={s}>{b.runs_conceded}</td>
                <td className="text-right font-semibold text-green-700" style={s}>{b.wickets_taken}</td>
                <td className="text-right text-gray-500" style={s}>{b.overs_bowled > 0 ? (b.runs_conceded / b.overs_bowled).toFixed(1) : '-'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Fall of Wickets */}
      {innings.fall_of_wickets && innings.fall_of_wickets.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100">
          <p className="text-gray-400 font-medium mb-1" style={sh}>Fall of Wickets</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {innings.fall_of_wickets.map(f => (
              <span key={f.wicket_number} className="text-gray-600 whitespace-nowrap" style={sh}>
                {f.wicket_number}-{f.runs} ({f.player_name}, {f.overs} ov)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
