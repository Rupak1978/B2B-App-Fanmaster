import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ScoreCard } from '../components/ScoreCard';
import { BoundaryCelebration } from '../components/BoundaryCelebration';
import { Innings, BallEvent } from '../types';

export function AudienceScreen() {
  const { matchId } = useParams<{ matchId: string }>();
  const [sc, setSc] = useState<any>(null);
  const [celebration, setCelebration] = useState<4 | 6 | null>(null);
  const [lastBallId, setLastBallId] = useState<number>(0);

  useEffect(() => {
    const poll = () => {
      try {
        const raw = localStorage.getItem(`criclive_match_${matchId}`);
        if (raw) {
          const data = JSON.parse(raw);
          setSc(data);

          // Check for boundary celebrations
          const ci = data.innings?.[data.innings.length - 1];
          const balls = ci?.balls || [];
          if (balls.length > 0) {
            const last = balls[balls.length - 1];
            if (last.id !== lastBallId) {
              setLastBallId(last.id);
              if (last.runs === 4 || last.runs === 6) {
                setCelebration(last.runs as 4 | 6);
                setTimeout(() => setCelebration(null), 2000);
              }
            }
          }
        }
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [matchId, lastBallId]);

  if (!sc) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12a4 4 0 018 0" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">CricLive</h1>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>Waiting for match data...</p>
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  const match = sc.match;
  const ci: Innings | undefined = sc.innings?.[sc.innings.length - 1];
  const rr = ci && ci.total_overs > 0 ? (ci.total_runs / ci.total_overs).toFixed(2) : '0.00';
  const target = ci && ci.innings_number === 2 && sc.innings[0] ? sc.innings[0].total_runs + 1 : undefined;
  const bpo = match?.rules?.balls_per_over || 6;

  const allBalls = (ci?.balls || []) as BallEvent[];
  const legalAll = allBalls.filter(b => !b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'));
  const curOverNum = legalAll.length > 0 ? Math.floor((legalAll.length - 1) / bpo) + 1 : 1;
  const thisOver = allBalls.filter(b => b.over_number === curOverNum);

  const bd = (b: BallEvent) => { if (b.is_wicket) return 'W'; if (b.extra_type === 'wide') return `${b.extra_runs}wd`; if (b.extra_type === 'no-ball') return `${b.runs}nb`; if (b.extra_type === 'bye') return `${b.extra_runs}b`; if (b.extra_type === 'leg-bye') return `${b.extra_runs}lb`; return b.runs === 0 ? '.' : String(b.runs); };
  const bc = (b: BallEvent) => { if (b.is_wicket) return 'bg-red-500 text-white'; if (b.is_extra) return 'bg-yellow-400 text-gray-800'; if (b.runs === 4) return 'bg-blue-500 text-white'; if (b.runs === 6) return 'bg-purple-500 text-white'; if (b.runs === 0) return 'bg-gray-200 text-gray-600'; return 'bg-green-100 text-green-800'; };

  return (
    <div className="min-h-screen bg-gray-50">
      {celebration && <BoundaryCelebration value={celebration} onClose={() => setCelebration(null)} />}

      {/* Header */}
      <header className="bg-green-700 text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12a4 4 0 018 0" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span className="font-bold">CricLive</span>
          </div>
          <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-3 py-4 space-y-3">
        {/* Big Score */}
        <div className="bg-green-700 text-white rounded-xl p-5 text-center">
          <p className="text-green-200 font-medium mb-1" style={{ fontSize: '14px' }}>{match?.team1_name} vs {match?.team2_name}</p>
          <p className="font-semibold mb-2" style={{ fontSize: '16px' }}>{ci?.batting_team_name}</p>
          <div className="text-5xl font-bold mb-2">{ci?.total_runs || 0}/{ci?.total_wickets || 0}</div>
          <p className="text-green-200" style={{ fontSize: '16px' }}>({ci?.total_overs || 0} overs)</p>
          <div className="flex justify-center gap-6 mt-3 text-green-200" style={{ fontSize: '14px' }}>
            <span>RR: {rr}</span>
            {target && <span>Need {Math.max(0, target - (ci?.total_runs || 0))}</span>}
            <span>{match?.overs} ov match</span>
          </div>
        </div>

        {/* This Over */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <span className="font-semibold text-gray-700 block mb-2" style={{ fontSize: '14px' }}>Over {curOverNum}</span>
          <div className="flex gap-1.5 flex-wrap">
            {thisOver.map(b => <span key={b.id} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${bc(b)}`} style={{ fontSize: '13px' }}>{bd(b)}</span>)}
            {thisOver.length === 0 && <span className="text-gray-400" style={{ fontSize: '14px' }}>New over</span>}
          </div>
        </div>

        {/* Scorecards */}
        {sc.innings?.map((inn: Innings) => (
          <ScoreCard key={inn.id} innings={inn} targetRuns={inn.innings_number === 2 ? sc.innings[0].total_runs + 1 : undefined} />
        ))}

        {match?.winner_name && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-bold text-green-800" style={{ fontSize: '18px' }}>{match.winner_name} won!</p>
          </div>
        )}

        <p className="text-center text-gray-400 py-2" style={{ fontSize: '12px' }}>Auto-updating every 2 seconds</p>
      </div>
    </div>
  );
}
