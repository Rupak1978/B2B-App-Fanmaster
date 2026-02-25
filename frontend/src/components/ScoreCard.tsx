import React from 'react';
import { Innings } from '../types';

interface ScoreCardProps {
  innings: Innings;
  targetRuns?: number;
}

export function ScoreCard({ innings, targetRuns }: ScoreCardProps) {
  const runRate = innings.total_overs > 0
    ? (innings.total_runs / parseFloat(String(innings.total_overs).replace('.', '.'))).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-cricket-600 text-white px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{innings.batting_team_name || `Innings ${innings.innings_number}`}</h3>
          <div className="text-right">
            <span className="text-2xl font-bold">{innings.total_runs}/{innings.total_wickets}</span>
            <span className="text-sm ml-2 opacity-80">({innings.total_overs} ov)</span>
          </div>
        </div>
        <div className="flex justify-between text-sm mt-1 opacity-80">
          <span>RR: {runRate}</span>
          {targetRuns && (
            <span>Need {targetRuns - innings.total_runs} from {(Math.floor(targetRuns / 6) - Math.floor(innings.total_overs)) * 6 + (6 - (innings.total_overs % 1) * 10)} balls</span>
          )}
          <span>Extras: {innings.extras}</span>
        </div>
      </div>

      {innings.batting && innings.batting.length > 0 && (
        <div className="px-4 py-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Batting</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs">
                <th className="text-left pb-1">Batter</th>
                <th className="text-right pb-1">R</th>
                <th className="text-right pb-1">B</th>
                <th className="text-right pb-1">4s</th>
                <th className="text-right pb-1">6s</th>
                <th className="text-right pb-1">SR</th>
              </tr>
            </thead>
            <tbody>
              {innings.batting.map((b) => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="py-1.5 font-medium text-gray-800">{b.player_name}</td>
                  <td className="text-right font-semibold">{b.runs_scored}</td>
                  <td className="text-right text-gray-500">{b.balls_faced}</td>
                  <td className="text-right text-gray-500">{b.fours}</td>
                  <td className="text-right text-gray-500">{b.sixes}</td>
                  <td className="text-right text-gray-500">
                    {b.balls_faced > 0 ? ((b.runs_scored / b.balls_faced) * 100).toFixed(1) : '0.0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {innings.bowling && innings.bowling.length > 0 && (
        <div className="px-4 py-3 bg-gray-50">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bowling</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs">
                <th className="text-left pb-1">Bowler</th>
                <th className="text-right pb-1">O</th>
                <th className="text-right pb-1">M</th>
                <th className="text-right pb-1">R</th>
                <th className="text-right pb-1">W</th>
                <th className="text-right pb-1">Econ</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowling.map((b) => (
                <tr key={b.id} className="border-t border-gray-100">
                  <td className="py-1.5 font-medium text-gray-800">{b.player_name}</td>
                  <td className="text-right">{b.overs_bowled}</td>
                  <td className="text-right text-gray-500">{b.maidens}</td>
                  <td className="text-right">{b.runs_conceded}</td>
                  <td className="text-right font-semibold text-cricket-600">{b.wickets_taken}</td>
                  <td className="text-right text-gray-500">
                    {b.overs_bowled > 0 ? (b.runs_conceded / b.overs_bowled).toFixed(1) : '0.0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
