import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { ScoreCard } from '../components/ScoreCard';
import { Player, Innings, BallEvent } from '../types';

export function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [sc, setSc] = useState<any>(null);
  const [batPlayers, setBatPlayers] = useState<Player[]>([]);
  const [bowlPlayers, setBowlPlayers] = useState<Player[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [striker, setStriker] = useState(0);
  const [nonStriker, setNonStriker] = useState(0);
  const [bowler, setBowler] = useState(0);
  const [runs, setRuns] = useState(0);
  const [isExtra, setIsExtra] = useState(false);
  const [extraType, setExtraType] = useState('');
  const [extraRuns, setExtraRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [dismissedPlayer, setDismissedPlayer] = useState(0);
  const [fielder, setFielder] = useState(0);
  const [showWicket, setShowWicket] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = await api.getScorecard(Number(id));
      setSc(data);
      const ci = data.innings[data.innings.length - 1];
      if (ci) {
        setBatPlayers(await api.getPlayers(ci.batting_team_id));
        setBowlPlayers(await api.getPlayers(ci.bowling_team_id));
      }
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  const reset = () => { setRuns(0); setIsExtra(false); setExtraType(''); setExtraRuns(0); setIsWicket(false); setWicketType(''); setDismissedPlayer(0); setFielder(0); setShowWicket(false); };

  const handleRecord = async () => {
    if (!striker || !bowler) { alert('Select striker and bowler'); return; }
    const ci = sc.innings[sc.innings.length - 1];
    const wr = sc.match.rules?.wide_runs || 1;
    setSubmitting(true);
    try {
      const er = isExtra ? (extraType === 'wide' ? wr : (extraRuns || 1)) : 0;
      await api.recordBall(Number(id), {
        innings_id: ci.id, batsman_id: striker, bowler_id: bowler, runs,
        is_extra: isExtra ? 1 : 0, extra_type: isExtra ? extraType : null, extra_runs: er,
        is_wicket: isWicket ? 1 : 0, wicket_type: isWicket ? wicketType : null,
        dismissed_player_id: isWicket ? (dismissedPlayer || striker) : null,
        fielder_id: isWicket ? fielder : null, is_free_hit: 0,
      });
      if (runs % 2 === 1) { const t = striker; setStriker(nonStriker); setNonStriker(t); }
      reset(); await fetch();
    } catch (err: any) { alert(err.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const handleUndo = async () => { try { await api.undoLastBall(Number(id)); await fetch(); } catch {} };
  const swapStrike = () => { const t = striker; setStriker(nonStriker); setNonStriker(t); };
  const handleExtra = (type: string) => {
    if (extraType === type) { setIsExtra(false); setExtraType(''); setExtraRuns(0); }
    else { setIsExtra(true); setExtraType(type); setExtraRuns(type === 'wide' ? (sc?.match?.rules?.wide_runs || 1) : 1); }
  };
  const handleSecondInnings = async () => { try { await api.startSecondInnings(Number(id)); setStriker(0); setNonStriker(0); setBowler(0); reset(); await fetch(); } catch (e: any) { alert(e.message); } };
  const handleEnd = async () => {
    if (!sc) return;
    const inn = sc.innings; let w = null;
    if (inn.length === 2) { if (inn[1].total_runs > inn[0].total_runs) w = inn[1].batting_team_id; else if (inn[0].total_runs > inn[1].total_runs) w = inn[0].batting_team_id; }
    try { await api.endMatch(Number(id), { winner_id: w }); await fetch(); } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!sc) return <p className="text-center text-gray-500 py-12" style={{ fontSize: '14px' }}>Match not found</p>;

  const match = sc.match;
  const ci: Innings | undefined = sc.innings[sc.innings.length - 1];
  const done = match.status === 'completed';
  const inn1Done = sc.innings.length === 1 && ci?.is_completed;
  const inn2Done = sc.innings.length === 2 && ci?.is_completed;
  const rr = ci && ci.total_overs > 0 ? (ci.total_runs / ci.total_overs).toFixed(2) : '0.00';
  const target = ci && ci.innings_number === 2 && sc.innings[0] ? sc.innings[0].total_runs + 1 : undefined;
  const bpo = match.rules?.balls_per_over || 6;

  const allBalls = (ci?.balls || []) as BallEvent[];
  const legalAll = allBalls.filter(b => !b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'));
  const curOverNum = legalAll.length > 0 ? Math.floor((legalAll.length - 1) / bpo) + 1 : 1;
  const thisOver = allBalls.filter(b => b.over_number === curOverNum);

  const bd = (b: BallEvent) => { if (b.is_wicket) return 'W'; if (b.extra_type === 'wide') return `${b.extra_runs}wd`; if (b.extra_type === 'no-ball') return `${b.runs}nb`; if (b.extra_type === 'bye') return `${b.extra_runs}b`; if (b.extra_type === 'leg-bye') return `${b.extra_runs}lb`; return b.runs === 0 ? '.' : String(b.runs); };
  const bc = (b: BallEvent) => { if (b.is_wicket) return 'bg-red-500 text-white'; if (b.is_extra) return 'bg-yellow-400 text-gray-800'; if (b.runs === 4) return 'bg-blue-500 text-white'; if (b.runs === 6) return 'bg-purple-500 text-white'; if (b.runs === 0) return 'bg-gray-200 text-gray-600'; return 'bg-green-100 text-green-800'; };

  return (
    <div className="space-y-3">
      {/* Score Header */}
      <div className="bg-green-700 text-white rounded-xl p-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-truncate" style={{ fontSize: '14px' }}>{ci?.batting_team_name || match.team1_name}</span>
          <div className="text-right"><span className="text-2xl font-bold">{ci?.total_runs || 0}/{ci?.total_wickets || 0}</span><span className="ml-1 opacity-80" style={{ fontSize: '14px' }}>({ci?.total_overs || 0} ov)</span></div>
        </div>
        <div className="flex justify-between mt-1 opacity-80" style={{ fontSize: '14px' }}>
          <span>RR: {rr}</span>{target && <span>Need {Math.max(0, target - (ci?.total_runs || 0))}</span>}<span>{match.overs} ov</span>
        </div>
      </div>

      {/* This Over */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2"><span className="font-semibold text-gray-700" style={{ fontSize: '14px' }}>Over {curOverNum}</span></div>
        <div className="flex gap-1.5 flex-wrap">
          {thisOver.map(b => <span key={b.id} className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${bc(b)}`} style={{ fontSize: '12px' }}>{bd(b)}</span>)}
          {thisOver.length === 0 && <span className="text-gray-400" style={{ fontSize: '14px' }}>New over</span>}
        </div>
      </div>

      {!done && ci && !ci.is_completed && (<>
        {/* Batsman/Bowler */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-gray-500 block mb-1" style={{ fontSize: '12px' }}>Striker *</label>
              <select value={striker} onChange={e => setStriker(Number(e.target.value))} className="w-full px-2 py-2.5 border border-gray-300 rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Select</option>{batPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <div><label className="text-gray-500 block mb-1" style={{ fontSize: '12px' }}>Non-Striker</label>
              <select value={nonStriker} onChange={e => setNonStriker(Number(e.target.value))} className="w-full px-2 py-2.5 border border-gray-300 rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Select</option>{batPlayers.filter(p => p.id !== striker).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-gray-500 block mb-1" style={{ fontSize: '12px' }}>Bowler *</label>
              <select value={bowler} onChange={e => setBowler(Number(e.target.value))} className="w-full px-2 py-2.5 border border-gray-300 rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Select</option>{bowlPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select></div>
            <button onClick={swapStrike} className="px-3 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 tap-target whitespace-nowrap" style={{ fontSize: '14px' }}>Swap</button>
          </div>
        </div>

        {/* Runs */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="grid grid-cols-6 gap-2">
            {[0,1,2,3,4,6].map(r => (
              <button key={r} onClick={() => { setRuns(r); }}
                className={`h-14 rounded-xl font-bold tap-target transition-all ${runs===r ? (r===4?'bg-blue-500 text-white scale-105':r===6?'bg-purple-500 text-white scale-105':'bg-green-600 text-white scale-105') : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                style={{ fontSize: '20px' }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Extras */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="grid grid-cols-4 gap-2">
            {[{l:'Wide',v:'wide'},{l:'No Ball',v:'no-ball'},{l:'Bye',v:'bye'},{l:'Leg Bye',v:'leg-bye'}].map(e => (
              <button key={e.v} onClick={() => handleExtra(e.v)} className={`py-2.5 rounded-lg font-semibold tap-target transition-colors ${extraType===e.v?'bg-yellow-400 text-gray-800':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} style={{ fontSize: '14px' }}>{e.l}</button>
            ))}
          </div>
          {isExtra && extraType !== 'wide' && (
            <div className="flex gap-2 mt-2">{[0,1,2,3,4].map(r => <button key={r} onClick={() => setExtraRuns(r)} className={`w-10 h-10 rounded-lg font-bold tap-target ${extraRuns===r?'bg-yellow-400':'bg-gray-100 hover:bg-gray-200'}`} style={{ fontSize: '14px' }}>{r}</button>)}</div>
          )}
        </div>

        {/* Wicket */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700" style={{ fontSize: '14px' }}>Wicket</span>
            <button onClick={() => { if (isWicket) { setIsWicket(false); setWicketType(''); setDismissedPlayer(0); setFielder(0); setShowWicket(false); } else setShowWicket(true); }}
              className={`px-4 py-2 rounded-full font-semibold tap-target transition-colors ${isWicket?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`} style={{ fontSize: '14px' }}>{isWicket?'WICKET!':'Wicket?'}</button>
          </div>
          {(showWicket || isWicket) && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-3 gap-1.5">{['bowled','caught','lbw','run_out','stumped','hit_wicket','retired'].map(w => (
                <button key={w} onClick={() => { setWicketType(w); setIsWicket(true); setShowWicket(false); }}
                  className={`py-2.5 rounded-lg font-medium capitalize tap-target transition-colors ${wicketType===w?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} style={{ fontSize: '12px' }}>{w.replace('_',' ')}</button>
              ))}</div>
              {wicketType === 'run_out' && <select value={dismissedPlayer} onChange={e => setDismissedPlayer(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Striker</option>{batPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
              {['caught','run_out','stumped'].includes(wicketType) && <select value={fielder} onChange={e => setFielder(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Select fielder</option>{bowlPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={handleUndo} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Undo</button>
          <button onClick={handleRecord} disabled={submitting||!striker||!bowler} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-40 tap-target" style={{ fontSize: '16px' }}>{submitting?'Recording...':'Record Ball'}</button>
        </div>
      </>)}

      {inn1Done && !done && sc.innings.length === 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>1st Innings Done</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>{ci?.batting_team_name}: {ci?.total_runs}/{ci?.total_wickets}</p>
          <button onClick={handleSecondInnings} className="mt-3 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold tap-target" style={{ fontSize: '14px' }}>Start 2nd Innings</button>
        </div>
      )}
      {inn2Done && !done && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="font-semibold text-gray-900" style={{ fontSize: '16px' }}>2nd Innings Done</p>
          <button onClick={handleEnd} className="mt-3 bg-red-500 text-white px-6 py-3 rounded-lg font-semibold tap-target" style={{ fontSize: '14px' }}>End Match</button>
        </div>
      )}
      {match.winner_name && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><p className="font-bold text-green-800" style={{ fontSize: '16px' }}>{match.winner_name} won!</p></div>}

      {sc.innings.map((inn: Innings) => <ScoreCard key={inn.id} innings={inn} targetRuns={inn.innings_number === 2 ? sc.innings[0].total_runs + 1 : undefined} />)}
    </div>
  );
}
