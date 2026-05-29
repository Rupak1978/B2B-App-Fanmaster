import React from 'react';
import { Innings, Match } from '../types';

interface ScoreboardProps {
  match?: Match;
  innings?: Innings[];
  team1Name?: string;
  team2Name?: string;
  team1Runs?: number;
  team1Wickets?: number;
  team1Overs?: number;
  team2Runs?: number;
  team2Wickets?: number;
  team2Overs?: number;
  compact?: boolean;
  maxOvers?: number;
  showRunRate?: boolean;
}

interface TeamScoreData {
  name: string;
  runs: number;
  wickets: number;
  overs: number;
}

export function Scoreboard({
  match,
  innings,
  team1Name = 'Team A',
  team2Name = 'Team B',
  team1Runs = 0,
  team1Wickets = 0,
  team1Overs = 0,
  team2Runs = 0,
  team2Wickets = 0,
  team2Overs = 0,
  compact = false,
  maxOvers = 20,
  showRunRate = true,
}: ScoreboardProps) {
  // Extract data from match/innings if provided
  let displayTeam1Name = team1Name;
  let displayTeam2Name = team2Name;
  let displayTeam1Runs = team1Runs;
  let displayTeam1Wickets = team1Wickets;
  let displayTeam1Overs = team1Overs;
  let displayTeam2Runs = team2Runs;
  let displayTeam2Wickets = team2Wickets;
  let displayTeam2Overs = team2Overs;

  if (match) {
    displayTeam1Name = match.team1_name || team1Name;
    displayTeam2Name = match.team2_name || team2Name;
  }

  if (innings && innings.length > 0) {
    const firstInnings = innings[0];
    displayTeam1Name = firstInnings.batting_team_name || displayTeam1Name;
    displayTeam1Runs = firstInnings.total_runs;
    displayTeam1Wickets = firstInnings.total_wickets;
    displayTeam1Overs = firstInnings.total_overs;

    if (innings.length > 1) {
      const secondInnings = innings[1];
      displayTeam2Name = secondInnings.batting_team_name || displayTeam2Name;
      displayTeam2Runs = secondInnings.total_runs;
      displayTeam2Wickets = secondInnings.total_wickets;
      displayTeam2Overs = secondInnings.total_overs;
    }
  }

  // Calculate run rates and other metrics
  const runRate1 = displayTeam1Overs > 0 ? (displayTeam1Runs / displayTeam1Overs).toFixed(2) : '0.00';
  const runRate2 = displayTeam2Overs > 0 ? (displayTeam2Runs / displayTeam2Overs).toFixed(2) : '0.00';

  // Calculate overs remaining (total overs - overs played)
  const oversRemaining1 = Math.max(0, maxOvers - displayTeam1Overs);
  const oversRemaining2 = Math.max(0, maxOvers - displayTeam2Overs);

  // Calculate required run rate for team 2 (chasing team)
  const requiredRuns = displayTeam1Runs + 1;
  const ballsRemaining = oversRemaining2 * 6;
  const requiredRR = ballsRemaining > 0 ? (requiredRuns / oversRemaining2).toFixed(2) : '0.00';

  /**
   * ScoreTeamCard Component - Displays score for a single team
   * Handles both compact (mini) and standard (full) layouts
   */
  const ScoreTeamCard = ({
    teamName,
    runs,
    wickets,
    overs,
    runRate,
    oversRemaining,
    requiredRR,
    isChasing = false,
    bgColor = 'bg-green-700',
  }: {
    teamName: string;
    runs: number;
    wickets: number;
    overs: number;
    runRate: string;
    oversRemaining?: number;
    requiredRR?: string;
    isChasing?: boolean;
    bgColor?: string;
  }) => {
    if (compact) {
      return (
        <div className={`${bgColor} text-white rounded-lg p-3 shadow-md`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm truncate">{teamName}</span>
            <span className="text-xl font-bold">{runs}/{wickets}</span>
          </div>
          <div className="flex justify-between text-xs opacity-90">
            <span>{overs} ov</span>
            {showRunRate && <span>RR: {runRate}</span>}
          </div>
        </div>
      );
    }

    // Standard layout
    const isAllOut = wickets >= 10;
    const statusColor = isAllOut ? 'text-red-600' : 'text-green-600';

    return (
      <div className={`${bgColor} text-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200`}>
        <div className="px-6 py-5">
          {/* Team Header */}
          <h3 className="text-lg font-bold mb-4 text-opacity-95 opacity-95">{teamName}</h3>

          {/* Main Score Display */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-4xl font-bold mb-1">{runs}</div>
              <div className="text-xs opacity-75 font-medium">Runs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">{wickets}</div>
              <div className="text-xs opacity-75 font-medium">Wickets</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">{overs}</div>
              <div className="text-xs opacity-75 font-medium">Overs</div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="pt-4 border-t border-white border-opacity-20 space-y-3">
            {/* Run Rate Row */}
            <div className="flex justify-between items-center text-sm">
              <div>
                <div className="text-xs opacity-75 font-medium">Run Rate</div>
                <div className="font-semibold text-base">{runRate}</div>
              </div>
              {oversRemaining !== undefined && (
                <div className="text-right">
                  <div className="text-xs opacity-75 font-medium">Overs Left</div>
                  <div className="font-semibold text-base">{oversRemaining}</div>
                </div>
              )}
            </div>

            {/* Required RR for chasing team */}
            {isChasing && requiredRR !== undefined && !isAllOut && (
              <div className="flex justify-between items-center text-sm">
                <div>
                  <div className="text-xs opacity-75 font-medium">Required RR</div>
                  <div className="font-semibold text-base">{requiredRR}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-75 font-medium">Need</div>
                  <div className="font-semibold text-base">{requiredRuns} runs</div>
                </div>
              </div>
            )}

            {/* Status Row */}
            <div className="flex justify-between items-center text-sm pt-2">
              <div className="text-xs opacity-75 font-medium">Status</div>
              <div className={`font-bold text-base ${statusColor}`}>
                {isAllOut ? 'All Out' : (oversRemaining === 0 ? 'Innings Closed' : 'In Progress')}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {/* Header */}
      {!compact && (
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Cricket Scoreboard</h2>
          <p className="text-gray-500 text-sm mt-1">Live Match Score • {maxOvers} Overs</p>
        </div>
      )}

      {/* Score Cards Grid */}
      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        {/* Team 1 (Batting First) */}
        <ScoreTeamCard
          teamName={displayTeam1Name}
          runs={displayTeam1Runs}
          wickets={displayTeam1Wickets}
          overs={displayTeam1Overs}
          runRate={runRate1}
          oversRemaining={oversRemaining1}
          bgColor="bg-blue-700"
          isChasing={false}
        />

        {/* Team 2 (Chasing) */}
        <ScoreTeamCard
          teamName={displayTeam2Name}
          runs={displayTeam2Runs}
          wickets={displayTeam2Wickets}
          overs={displayTeam2Overs}
          runRate={runRate2}
          oversRemaining={oversRemaining2}
          requiredRR={requiredRR}
          bgColor="bg-red-700"
          isChasing={oversRemaining2 > 0 && displayTeam1Overs >= maxOvers}
        />
      </div>

      {/* Match Status Bar */}
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-red-50 border border-gray-300 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Leading Team */}
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Match Status</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">
                {Math.abs(displayTeam1Runs - displayTeam2Runs) > 0
                  ? `${displayTeam1Runs > displayTeam2Runs ? displayTeam1Name : displayTeam2Name} Leading`
                  : 'Match Tied'}
              </p>
            </div>

            {/* Run Difference */}
            <div className="text-center border-l border-r border-gray-300">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Run Margin</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">
                {Math.abs(displayTeam1Runs - displayTeam2Runs)} runs
              </p>
            </div>

            {/* Match Progress */}
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overs Progress</p>
              <p className="text-sm text-gray-800 font-semibold mt-1">
                {displayTeam1Overs}/{maxOvers} vs {displayTeam2Overs}/{maxOvers}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
