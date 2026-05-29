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

  const runRate1 = displayTeam1Overs > 0 ? (displayTeam1Runs / displayTeam1Overs).toFixed(2) : '0.00';
  const runRate2 = displayTeam2Overs > 0 ? (displayTeam2Runs / displayTeam2Overs).toFixed(2) : '0.00';

  const ScoreTeamCard = ({
    teamName,
    runs,
    wickets,
    overs,
    runRate,
    bgColor = 'bg-green-700',
  }: {
    teamName: string;
    runs: number;
    wickets: number;
    overs: number;
    runRate: string;
    bgColor?: string;
  }) => {
    if (compact) {
      return (
        <div className={`${bgColor} text-white rounded-lg p-3`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-sm truncate">{teamName}</span>
            <span className="text-xl font-bold">{runs}/{wickets}</span>
          </div>
          <div className="flex justify-between text-xs opacity-90">
            <span>{overs} ov</span>
            <span>RR: {runRate}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={`${bgColor} text-white rounded-xl shadow-md overflow-hidden`}>
        <div className="px-4 py-4">
          <h3 className="text-sm font-semibold mb-3 text-opacity-90 opacity-90">{teamName}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-3xl font-bold mb-1">{runs}</div>
              <div className="text-xs opacity-75">Runs</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{wickets}</div>
              <div className="text-xs opacity-75">Wickets</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{overs}</div>
              <div className="text-xs opacity-75">Overs</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white border-opacity-20 flex justify-between text-sm">
            <div>
              <div className="text-xs opacity-75">Run Rate</div>
              <div className="font-semibold">{runRate}</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-75">Status</div>
              <div className="font-semibold">
                {wickets >= 10 ? 'All Out' : 'In Progress'}
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
          <h2 className="text-2xl font-bold text-gray-900">Cricket Scoreboard</h2>
          <p className="text-gray-500 text-sm mt-1">Live Match Score</p>
        </div>
      )}

      {/* Score Cards */}
      <div className={compact ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        <ScoreTeamCard
          teamName={displayTeam1Name}
          runs={displayTeam1Runs}
          wickets={displayTeam1Wickets}
          overs={displayTeam1Overs}
          runRate={runRate1}
          bgColor="bg-blue-700"
        />
        <ScoreTeamCard
          teamName={displayTeam2Name}
          runs={displayTeam2Runs}
          wickets={displayTeam2Wickets}
          overs={displayTeam2Overs}
          runRate={runRate2}
          bgColor="bg-red-700"
        />
      </div>

      {/* Match Status Bar */}
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-red-50 border border-gray-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">
              {Math.abs(displayTeam1Runs - displayTeam2Runs) > 0
                ? `${displayTeam1Runs > displayTeam2Runs ? displayTeam1Name : displayTeam2Name} Leading by ${Math.abs(displayTeam1Runs - displayTeam2Runs)} runs`
                : 'Match Tied'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
