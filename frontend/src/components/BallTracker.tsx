import React from 'react';
import { BallEvent } from '../types';

interface BallTrackerProps {
  balls: BallEvent[];
}

export function BallTracker({ balls }: BallTrackerProps) {
  // Group balls by over
  const overs: Record<number, BallEvent[]> = {};
  balls.forEach((ball) => {
    if (!overs[ball.over_number]) overs[ball.over_number] = [];
    overs[ball.over_number].push(ball);
  });

  const getBallColor = (ball: BallEvent): string => {
    if (ball.is_wicket) return 'bg-red-500 text-white';
    if (ball.runs === 4) return 'bg-blue-500 text-white';
    if (ball.runs === 6) return 'bg-purple-500 text-white';
    if (ball.is_extra) return 'bg-yellow-400 text-gray-800';
    if (ball.runs === 0) return 'bg-gray-200 text-gray-600';
    return 'bg-cricket-500 text-white';
  };

  const getBallText = (ball: BallEvent): string => {
    if (ball.is_wicket) return 'W';
    if (ball.is_extra) {
      const prefix = ball.extra_type === 'wide' ? 'Wd' : ball.extra_type === 'no-ball' ? 'Nb' : ball.extra_type === 'bye' ? 'B' : 'Lb';
      return `${prefix}${ball.extra_runs > 0 ? ball.extra_runs : ''}`;
    }
    return String(ball.runs);
  };

  const overNumbers = Object.keys(overs).map(Number).sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Ball-by-Ball</h4>
      <div className="space-y-2">
        {overNumbers.map((overNum) => (
          <div key={overNum} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12 shrink-0">Ov {overNum + 1}</span>
            <div className="flex gap-1.5 flex-wrap">
              {overs[overNum].map((ball) => (
                <span
                  key={ball.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getBallColor(ball)}`}
                  title={`${ball.batsman_name} vs ${ball.bowler_name}`}
                >
                  {getBallText(ball)}
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">
              {overs[overNum].reduce((sum, b) => sum + b.runs + b.extra_runs + (b.is_extra && (b.extra_type === 'wide' || b.extra_type === 'no-ball') ? 1 : 0), 0)} runs
            </span>
          </div>
        ))}
      </div>
      {balls.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No balls bowled yet</p>
      )}
    </div>
  );
}
