import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ScoreCard } from '../components/ScoreCard';
import { BallTracker } from '../components/BallTracker';
import { Player, Innings, BallEvent } from '../types';

export function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scorecard, setScorecard] = useState<any>(null);
  const [battingPlayers, setBattingPlayers] = useState<Player[]>([]);
  const [bowlingPlayers, setBowlingPlayers] = useState<Player[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Current ball state
  const [striker, setStriker] = useState(0);
  const [nonStriker, setNonStriker] = useState(0);
  const [bowler, setBowler] = useState(0);
  const [runs, setRuns] = useState(0);
  const [isExtra, setIsExtra] = useState(false);
  const [extraType, setExtraType] = useState<string>('');
  const [extraRuns, setExtraRuns] = useState(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState('');
  const [dismissedPlayer, setDismissedPlayer] = useState(0);
  const [fielder, setFielder] = useState(0);

  const fetchScorecard = useCallback(async () => {
    try {
      const data = await api.getScorecard(Number(id));
      setScorecard(data);

      const currentInnings = data.innings[data.innings.length - 1];
      if (currentInnings) {
        const batPlayers = await api.getPlayers(currentInnings.batting_team_id);
        const bowlPlayers = await api.getPlayers(currentInnings.bowling_team_id);
        setBattingPlayers(batPlayers);
        setBowlingPlayers(bowlPlayers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScorecard();
  }, [fetchScorecard]);

  const resetBallState = () => {
    setRuns(0);
    setIsExtra(false);
    setExtraType('');
    setExtraRuns(0);
    setIsWicket(false);
    setWicketType('');
    setDismissedPlayer(0);
    setFielder(0);
  };

  const handleRecordBall = async () => {
    if (!striker || !bowler) {
      alert('Please select striker and bowler');
      return;
    }

    const currentInnings = scorecard.innings[scorecard.innings.length - 1];
    setSubmitting(true);
    try {
      await api.recordBall(Number(id), {
        innings_id: currentInnings.id,
        batsman_id: striker,
        bowler_id: bowler,
        runs,
        is_extra: isExtra ? 1 : 0,
        extra_type: isExtra ? extraType : null,
        extra_runs: isExtra ? extraRuns : 0,
        is_wicket: isWicket ? 1 : 0,
        wicket_type: isWicket ? wicketType : null,
        dismissed_player_id: isWicket ? (dismissedPlayer || striker) : null,
        fielder_id: isWicket ? fielder : null,
      });

      // Swap striker on odd runs
      if (runs % 2 === 1) {
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
      }

      resetBallState();
      await fetchScorecard();
    } catch (err: any) {
      alert(err.message || 'Failed to record ball');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartSecondInnings = async () => {
    try {
      await api.startSecondInnings(Number(id));
      setStriker(0);
      setNonStriker(0);
      setBowler(0);
      resetBallState();
      await fetchScorecard();
    } catch (err: any) {
      alert(err.message || 'Failed to start second innings');
    }
  };

  const handleEndMatch = async () => {
    if (!scorecard) return;
    const innings = scorecard.innings;
    let winnerId = null;

    if (innings.length === 2) {
      const i1 = innings[0];
      const i2 = innings[1];
      if (i2.total_runs > i1.total_runs) winnerId = i2.batting_team_id;
      else if (i1.total_runs > i2.total_runs) winnerId = i1.batting_team_id;
    }

    try {
      await api.endMatch(Number(id), { winner_id: winnerId });
      await fetchScorecard();
    } catch (err: any) {
      alert(err.message || 'Failed to end match');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scorecard) return <p className="text-center text-gray-500 py-12">Match not found</p>;

  const match = scorecard.match;
  const currentInnings: Innings | undefined = scorecard.innings[scorecard.innings.length - 1];
  const isMatchCompleted = match.status === 'completed';
  const isFirstInningsComplete = scorecard.innings.length === 1 && currentInnings?.is_completed;
  const isSecondInningsComplete = scorecard.innings.length === 2 && currentInnings?.is_completed;

  return (
    <div className="space-y-4">
      {/* Match Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900">{match.team1_name} vs {match.team2_name}</h2>
            <p className="text-sm text-gray-500">{match.overs} overs &middot; {match.venue || ''}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            match.status === 'in_progress' ? 'bg-green-100 text-green-700' :
            match.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
          }`}>
            {match.status === 'in_progress' ? 'LIVE' : match.status === 'completed' ? 'COMPLETED' : 'UPCOMING'}
          </span>
        </div>
        {match.winner_name && (
          <p className="text-sm font-semibold text-cricket-600 mt-2">{match.winner_name} won the match!</p>
        )}
      </div>

      {/* Split screen: Controls + Scorecard */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
        {/* Left: Scoring Controls */}
        {!isMatchCompleted && currentInnings && !currentInnings.is_completed && (
          <div className="space-y-4">
            {/* Batsman Selection */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Batsmen</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Striker *</label>
                  <select
                    value={striker}
                    onChange={(e) => setStriker(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cricket-500"
                  >
                    <option value={0}>Select</option>
                    {battingPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Non-Striker</label>
                  <select
                    value={nonStriker}
                    onChange={(e) => setNonStriker(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cricket-500"
                  >
                    <option value={0}>Select</option>
                    {battingPlayers.filter((p) => p.id !== striker).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs text-gray-500 mb-1 block">Bowler *</label>
                <select
                  value={bowler}
                  onChange={(e) => setBowler(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cricket-500"
                >
                  <option value={0}>Select</option>
                  {bowlingPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Runs */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Runs</h4>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 6].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRuns(r); setIsExtra(false); setExtraType(''); }}
                    className={`h-14 rounded-xl text-lg font-bold transition-all ${
                      runs === r && !isExtra
                        ? r === 4 ? 'bg-blue-500 text-white scale-105' :
                          r === 6 ? 'bg-purple-500 text-white scale-105' :
                          'bg-cricket-500 text-white scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Extras</h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Wide', value: 'wide' },
                  { label: 'No Ball', value: 'no-ball' },
                  { label: 'Bye', value: 'bye' },
                  { label: 'Leg Bye', value: 'leg-bye' },
                ].map((e) => (
                  <button
                    key={e.value}
                    onClick={() => {
                      if (extraType === e.value) {
                        setIsExtra(false);
                        setExtraType('');
                        setExtraRuns(0);
                      } else {
                        setIsExtra(true);
                        setExtraType(e.value);
                        setExtraRuns(1);
                      }
                    }}
                    className={`py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      extraType === e.value ? 'bg-yellow-400 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              {isExtra && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500">Extra runs</label>
                  <div className="flex gap-2 mt-1">
                    {[0, 1, 2, 3, 4].map((r) => (
                      <button
                        key={r}
                        onClick={() => setExtraRuns(r)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold ${
                          extraRuns === r ? 'bg-yellow-400' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Wicket */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Wicket</h4>
                <button
                  onClick={() => { setIsWicket(!isWicket); if (isWicket) { setWicketType(''); setDismissedPlayer(0); setFielder(0); } }}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    isWicket ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  {isWicket ? 'WICKET!' : 'Wicket?'}
                </button>
              </div>

              {isWicket && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-1.5">
                    {['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'].map((w) => (
                      <button
                        key={w}
                        onClick={() => setWicketType(w)}
                        className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                          wicketType === w ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {w.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {(wicketType === 'run_out') && (
                    <div>
                      <label className="text-xs text-gray-500">Dismissed Player</label>
                      <select
                        value={dismissedPlayer}
                        onChange={(e) => setDismissedPlayer(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value={0}>Striker ({battingPlayers.find(p => p.id === striker)?.name})</option>
                        {battingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
                    <div>
                      <label className="text-xs text-gray-500">Fielder</label>
                      <select
                        value={fielder}
                        onChange={(e) => setFielder(Number(e.target.value))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value={0}>Select fielder</option>
                        {bowlingPlayers.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleRecordBall}
              disabled={submitting || !striker || !bowler}
              className="w-full bg-cricket-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-cricket-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Recording...' : 'Record Ball'}
            </button>
          </div>
        )}

        {/* Innings transition buttons */}
        {isFirstInningsComplete && !isMatchCompleted && scorecard.innings.length === 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-2">First Innings Complete</p>
            <p className="text-gray-500 mb-4">
              {currentInnings?.batting_team_name}: {currentInnings?.total_runs}/{currentInnings?.total_wickets}
            </p>
            <button
              onClick={handleStartSecondInnings}
              className="bg-cricket-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors"
            >
              Start Second Innings
            </button>
          </div>
        )}

        {isSecondInningsComplete && !isMatchCompleted && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-4">Second Innings Complete</p>
            <button
              onClick={handleEndMatch}
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              End Match
            </button>
          </div>
        )}

        {/* Right: Live Scorecard */}
        <div className="space-y-4 mt-4 lg:mt-0">
          {scorecard.innings.map((inn: Innings) => (
            <ScoreCard
              key={inn.id}
              innings={inn}
              targetRuns={inn.innings_number === 2 ? scorecard.innings[0].total_runs + 1 : undefined}
            />
          ))}

          {currentInnings && (
            <BallTracker balls={currentInnings.balls || []} />
          )}
        </div>
      </div>
    </div>
  );
}
