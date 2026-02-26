import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { ScoreCard } from '../components/ScoreCard';
import { BoundaryCelebration } from '../components/BoundaryCelebration';
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
  const [isExtra, setIsExtra] = useState(false);
  const [extraType, setExtraType] = useState('');
  const [extraRuns, setExtraRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [dismissedPlayer, setDismissedPlayer] = useState(0);
  const [fielder, setFielder] = useState(0);
  const [showWicket, setShowWicket] = useState(false);
  const [celebration, setCelebration] = useState<4 | 6 | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackPhone, setFeedbackPhone] = useState('');
  const [feedbackLocation, setFeedbackLocation] = useState('');

  const fetchData = useCallback(async () => {
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save match data to localStorage for audience screen polling
  useEffect(() => {
    if (sc) {
      localStorage.setItem(`criclive_match_${id}`, JSON.stringify(sc));
      localStorage.setItem(`criclive_match_${id}_ts`, String(Date.now()));
    }
  }, [sc, id]);

  const reset = () => { setIsExtra(false); setExtraType(''); setExtraRuns(0); setIsWicket(false); setWicketType(''); setDismissedPlayer(0); setFielder(0); setShowWicket(false); };

  const handleRunTap = async (runs: number) => {
    if (!striker || !bowler) { alert('Select striker and bowler'); return; }
    const ci = sc.innings[sc.innings.length - 1];
    const wr = sc.match.rules?.wide_runs || 1;
    const bpo = sc.match.rules?.balls_per_over || 6;
    setSubmitting(true);
    try {
      const er = isExtra ? (extraType === 'wide' ? wr : (extraRuns || 1)) : 0;

      // Powerball / Power Over multiplier
      const rules = sc.match.rules || {};
      const allBalls = (ci?.balls || []) as BallEvent[];
      const legalAll = allBalls.filter((b: BallEvent) => !b.is_extra || (b.extra_type !== 'wide' && b.extra_type !== 'no-ball'));
      const curOverNum = legalAll.length > 0 ? Math.floor((legalAll.length) / bpo) + 1 : 1;
      const curBallInOver = (legalAll.length % bpo) + 1;

      let displayRuns = runs;
      let multiplied = false;
      const isPowerBall = rules.powerball_enabled && curOverNum === rules.powerball_over && curBallInOver === rules.powerball_ball;
      const isPowerOver = rules.power_over_enabled && curOverNum === rules.power_over_number;

      if (isPowerBall && !isWicket) {
        displayRuns = runs * (rules.powerball_multiplier || 2);
        multiplied = true;
      } else if (isPowerOver && !isWicket) {
        displayRuns = runs * (rules.power_over_multiplier || 2);
        multiplied = true;
      }

      // Wicket penalty for powerball/power over
      let penaltyRuns = 0;
      if (isWicket && (isPowerBall || isPowerOver)) {
        penaltyRuns = -5;
      }

      const actualRuns = multiplied ? displayRuns : runs;
      const totalWithPenalty = actualRuns + penaltyRuns;

      await api.recordBall(Number(id), {
        innings_id: ci.id, batsman_id: striker, bowler_id: bowler,
        runs: Math.max(0, totalWithPenalty),
        is_extra: isExtra ? 1 : 0, extra_type: isExtra ? extraType : null, extra_runs: er,
        is_wicket: isWicket ? 1 : 0, wicket_type: isWicket ? wicketType : null,
        dismissed_player_id: isWicket ? (dismissedPlayer || striker) : null,
        fielder_id: isWicket ? fielder : null, is_free_hit: 0,
      });

      // Boundary celebration
      if (runs === 4 || runs === 6) {
        setCelebration(runs as 4 | 6);
        setTimeout(() => setCelebration(null), 2000);
      }

      // Strike rotation logic
      const isLegalBall = !isExtra || (extraType !== 'wide' && extraType !== 'no-ball');

      // Check if over is complete after this ball
      if (isLegalBall) {
        const newLegalCount = legalAll.length + 1;
        const overComplete = newLegalCount % bpo === 0;

        if (isWicket) {
          // New batter logic: new batter always comes as striker
          // EXCEPT run out at non-striker end
          const dismissedId = dismissedPlayer || striker;
          if (wicketType === 'run_out' && dismissedId === nonStriker) {
            // Non-striker was run out - striker stays, new batter replaces non-striker
            setNonStriker(0);
            // If odd runs, swap was already needed, but since non-striker is out, new batter goes to non-striker
            if (runs % 2 === 1) {
              // Odd runs + non-striker out: striker moves to non-striker, new batter is striker
              const t = striker;
              setStriker(0);
              setNonStriker(t);
            }
          } else {
            // Striker is out (or other dismissal) - new batter comes as striker
            if (runs % 2 === 1) {
              // Odd runs: non-striker goes to striker position, new batter to non-striker
              setStriker(nonStriker);
              setNonStriker(0);
            } else {
              // Even runs: new batter comes as striker
              setStriker(0);
            }
          }
          // Over end swap after wicket
          if (overComplete) {
            const s = striker, ns = nonStriker;
            // positions already adjusted for wicket above, now swap for over end
            setTimeout(() => {
              setStriker(prev => prev === 0 ? 0 : ns || prev);
              setNonStriker(prev => prev === 0 ? 0 : s || prev);
            }, 50);
          }
        } else {
          // No wicket
          if (runs % 2 === 1) {
            // ODD runs: swap striker and non-striker
            const t = striker; setStriker(nonStriker); setNonStriker(t);
          }
          // Over end: swap positions
          if (overComplete) {
            setTimeout(() => {
              setStriker(prev => { const ns = nonStriker; return runs % 2 === 1 ? ns : nonStriker; });
              setNonStriker(prev => { const s = striker; return runs % 2 === 1 ? s : striker; });
              // Simplify: just do the swap
              setStriker(s => {
                setNonStriker(n => s);
                return nonStriker;
              });
            }, 50);
          }
        }
      } else {
        // Illegal ball (wide/no-ball): no over progress, but odd runs still swap
        if (runs % 2 === 1) {
          const t = striker; setStriker(nonStriker); setNonStriker(t);
        }
      }

      reset(); await fetchData();
    } catch (err: any) { alert(err.message || 'Failed'); } finally { setSubmitting(false); }
  };

  const handleUndo = async () => { try { await api.undoLastBall(Number(id)); await fetchData(); } catch {} };
  const swapStrike = () => { const t = striker; setStriker(nonStriker); setNonStriker(t); };
  const handleExtra = (type: string) => {
    if (extraType === type) { setIsExtra(false); setExtraType(''); setExtraRuns(0); }
    else { setIsExtra(true); setExtraType(type); setExtraRuns(type === 'wide' ? (sc?.match?.rules?.wide_runs || 1) : 1); }
  };
  const handleSecondInnings = async () => { try { await api.startSecondInnings(Number(id)); setStriker(0); setNonStriker(0); setBowler(0); reset(); await fetchData(); } catch (e: any) { alert(e.message); } };
  const handleEnd = async () => {
    if (!sc) return;
    const inn = sc.innings; let w = null;
    if (inn.length === 2) { if (inn[1].total_runs > inn[0].total_runs) w = inn[1].batting_team_id; else if (inn[0].total_runs > inn[1].total_runs) w = inn[0].batting_team_id; }
    try { await api.endMatch(Number(id), { winner_id: w }); await fetchData(); } catch (e: any) { alert(e.message); }
  };

  const shareMatch = () => {
    const url = `${window.location.origin}${window.location.pathname}#/live/${id}`;
    if (navigator.share) {
      navigator.share({ title: `CricLive - Live Match`, text: `Watch live score!`, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Match link copied!');
    }
  };

  const submitFeedback = () => {
    const entry = { phone: feedbackPhone, location: feedbackLocation, message: feedbackMsg, timestamp: new Date().toISOString(), matchId: id };
    const existing = JSON.parse(localStorage.getItem('criclive_feedback') || '[]');
    existing.push(entry);
    localStorage.setItem('criclive_feedback', JSON.stringify(existing));
    // Open WhatsApp
    const waMsg = encodeURIComponent(`CricLive Feedback\nPhone: ${feedbackPhone}\nLocation: ${feedbackLocation}\nMessage: ${feedbackMsg}`);
    window.open(`https://wa.me/?text=${waMsg}`, '_blank');
    setShowFeedback(false); setFeedbackMsg(''); setFeedbackPhone(''); setFeedbackLocation('');
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
  const curBallInOver = (legalAll.length % bpo) + 1;

  const rules = match.rules || {};
  const isPowerBall = rules.powerball_enabled && curOverNum === rules.powerball_over && curBallInOver === rules.powerball_ball;
  const isPowerOver = rules.power_over_enabled && curOverNum === rules.power_over_number;

  const bd = (b: BallEvent) => { if (b.is_wicket) return 'W'; if (b.extra_type === 'wide') return `${b.extra_runs}wd`; if (b.extra_type === 'no-ball') return `${b.runs}nb`; if (b.extra_type === 'bye') return `${b.extra_runs}b`; if (b.extra_type === 'leg-bye') return `${b.extra_runs}lb`; return b.runs === 0 ? '.' : String(b.runs); };
  const bc = (b: BallEvent) => { if (b.is_wicket) return 'bg-red-500 text-white'; if (b.is_extra) return 'bg-yellow-400 text-gray-800'; if (b.runs === 4) return 'bg-blue-500 text-white'; if (b.runs === 6) return 'bg-purple-500 text-white'; if (b.runs === 0) return 'bg-gray-200 text-gray-600'; return 'bg-green-100 text-green-800'; };

  return (
    <div className="space-y-3">
      {celebration && <BoundaryCelebration value={celebration} onClose={() => setCelebration(null)} />}

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

      {/* Share + Feedback buttons */}
      <div className="flex gap-2">
        <button onClick={shareMatch} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl font-semibold tap-target flex items-center justify-center gap-2" style={{ fontSize: '14px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          Share Live Link
        </button>
        <button onClick={() => setShowFeedback(!showFeedback)} className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-semibold tap-target flex items-center justify-center gap-2" style={{ fontSize: '14px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" fillRule="evenodd"/></svg>
          Feedback
        </button>
      </div>

      {/* Feedback Form */}
      {showFeedback && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 animate-fade-in">
          <h4 className="font-semibold text-gray-800" style={{ fontSize: '14px' }}>Send Feedback via WhatsApp</h4>
          <input value={feedbackPhone} onChange={e => setFeedbackPhone(e.target.value)} placeholder="Your phone number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ fontSize: '14px' }} />
          <input value={feedbackLocation} onChange={e => setFeedbackLocation(e.target.value)} placeholder="Your location" className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ fontSize: '14px' }} />
          <textarea value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} placeholder="Your message..." className="w-full px-3 py-2 border border-gray-300 rounded-lg" style={{ fontSize: '14px' }} rows={2} />
          <button onClick={submitFeedback} disabled={!feedbackMsg.trim()} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold disabled:opacity-40" style={{ fontSize: '14px' }}>Send via WhatsApp</button>
        </div>
      )}

      {/* This Over */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-700" style={{ fontSize: '14px' }}>Over {curOverNum}</span>
          {(isPowerBall || isPowerOver) && (
            <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ fontSize: '12px' }}>
              {isPowerBall ? `POWERBALL ${rules.powerball_multiplier}X` : `POWER OVER ${rules.power_over_multiplier}X`}
            </span>
          )}
        </div>
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

        {/* Runs - TAP TO AUTO-RECORD */}
        <div className="bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-gray-400 mb-2 text-center" style={{ fontSize: '12px' }}>Tap to record ball</p>
          <div className="grid grid-cols-6 gap-2">
            {[0,1,2,3,4,6].map(r => (
              <button key={r} onClick={() => handleRunTap(r)} disabled={submitting}
                className={`h-14 rounded-xl font-bold tap-target transition-all ${r===4?'bg-blue-500 text-white hover:bg-blue-600 active:scale-95':r===6?'bg-purple-500 text-white hover:bg-purple-600 active:scale-95':'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'} ${submitting?'opacity-40':''}`}
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
                <option value={0}>Who was run out?</option>
                <option value={striker}>Striker ({batPlayers.find(p => p.id === striker)?.name || 'Select'})</option>
                <option value={nonStriker}>Non-Striker ({batPlayers.find(p => p.id === nonStriker)?.name || 'Select'})</option>
                {batPlayers.filter(p => p.id !== striker && p.id !== nonStriker).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>}
              {['caught','run_out','stumped'].includes(wicketType) && <select value={fielder} onChange={e => setFielder(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg tap-target" style={{ fontSize: '14px' }}>
                <option value={0}>Select fielder</option>{bowlPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
            </div>
          )}
        </div>

        {/* Undo only */}
        <div className="flex gap-2">
          <button onClick={handleUndo} className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Undo Last Ball</button>
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
