import React, { useState } from 'react';
import { Scoreboard } from './Scoreboard';

/**
 * ScoreboardShowcase Component
 * Demonstrates the Scoreboard component with various match scenarios
 * Shows both standard and compact layouts with different game states
 */
export function ScoreboardShowcase() {
  const [demoMode, setDemoMode] = useState<'live' | 'chase' | 'allout' | 'tied'>('live');

  // Demo Scenario 1: Live Match (Team 2 still batting)
  const liveMatchData = {
    team1Name: 'Mumbai Indians',
    team2Name: 'Royal Challengers',
    team1Runs: 165,
    team1Wickets: 7,
    team1Overs: 20,
    team2Runs: 142,
    team2Wickets: 4,
    team2Overs: 18,
    maxOvers: 20,
  };

  // Demo Scenario 2: Chasing Team (Close match)
  const chasingMatchData = {
    team1Name: 'Delhi Capitals',
    team2Name: 'Kolkata Knight Riders',
    team1Runs: 158,
    team1Wickets: 6,
    team1Overs: 20,
    team2Runs: 155,
    team2Wickets: 3,
    team2Overs: 19.5,
    maxOvers: 20,
  };

  // Demo Scenario 3: Team All Out
  const allOutMatchData = {
    team1Name: 'Chennai Super Kings',
    team2Name: 'Rajasthan Royals',
    team1Runs: 142,
    team1Wickets: 10,
    team1Overs: 19.2,
    team2Runs: 85,
    team2Wickets: 5,
    team2Overs: 12,
    maxOvers: 20,
  };

  // Demo Scenario 4: Match Tied
  const tiedMatchData = {
    team1Name: 'Sunrisers Hyderabad',
    team2Name: 'Punjab Kings',
    team1Runs: 172,
    team1Wickets: 8,
    team1Overs: 20,
    team2Runs: 172,
    team2Wickets: 9,
    team2Overs: 20,
    maxOvers: 20,
  };

  const getCurrentData = () => {
    switch (demoMode) {
      case 'chase':
        return chasingMatchData;
      case 'allout':
        return allOutMatchData;
      case 'tied':
        return tiedMatchData;
      default:
        return liveMatchData;
    }
  };

  const data = getCurrentData();

  return (
    <div className="space-y-8 py-8">
      {/* Title Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Cricket Scoreboard Component
        </h1>
        <p className="text-gray-600 text-lg">
          Interactive showcase with multiple match scenarios
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="flex flex-wrap justify-center gap-3">
        {[
          { id: 'live', label: 'Live Match' },
          { id: 'chase', label: 'Chasing' },
          { id: 'allout', label: 'All Out' },
          { id: 'tied', label: 'Tied Match' },
        ].map(scenario => (
          <button
            key={scenario.id}
            onClick={() => setDemoMode(scenario.id as any)}
            className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
              demoMode === scenario.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {/* Standard Layout Section */}
      <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Standard Layout</h2>
        <div className="bg-white p-8 rounded-lg">
          <Scoreboard
            team1Name={data.team1Name}
            team2Name={data.team2Name}
            team1Runs={data.team1Runs}
            team1Wickets={data.team1Wickets}
            team1Overs={data.team1Overs}
            team2Runs={data.team2Runs}
            team2Wickets={data.team2Wickets}
            team2Overs={data.team2Overs}
            maxOvers={data.maxOvers}
            compact={false}
          />
        </div>
      </div>

      {/* Compact Layout Section */}
      <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Compact Layout</h2>
        <div className="bg-white p-8 rounded-lg max-w-md">
          <Scoreboard
            team1Name={data.team1Name}
            team2Name={data.team2Name}
            team1Runs={data.team1Runs}
            team1Wickets={data.team1Wickets}
            team1Overs={data.team1Overs}
            team2Runs={data.team2Runs}
            team2Wickets={data.team2Wickets}
            team2Overs={data.team2Overs}
            maxOvers={data.maxOvers}
            compact={true}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Component Features</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Displays team names, runs, wickets, and overs</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Real-time run rate calculations</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Overs remaining counter</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Required run rate for chasing team</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>All Out status detection</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Compact and standard layouts</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Match status and leading team tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 font-bold mr-3">✓</span>
            <span>Full TypeScript support</span>
          </li>
        </ul>
      </div>

      {/* Usage Example Section */}
      <div className="bg-gray-900 text-gray-100 rounded-xl p-8 overflow-x-auto">
        <h2 className="text-2xl font-bold text-white mb-4">Usage Example</h2>
        <pre className="text-sm font-mono leading-relaxed">
{`import { Scoreboard } from '@/components/Scoreboard';

export function MyMatch() {
  return (
    <Scoreboard
      team1Name="Team A"
      team2Name="Team B"
      team1Runs={165}
      team1Wickets={7}
      team1Overs={20}
      team2Runs={142}
      team2Wickets={4}
      team2Overs={18}
      maxOvers={20}
      compact={false}
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}
