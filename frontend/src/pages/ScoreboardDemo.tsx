import React, { useState } from 'react';
import { Scoreboard } from '../components/Scoreboard';

export function ScoreboardDemo() {
  const [team1Runs, setTeam1Runs] = useState(45);
  const [team1Wickets, setTeam1Wickets] = useState(2);
  const [team1Overs, setTeam1Overs] = useState(5.2);

  const [team2Runs, setTeam2Runs] = useState(38);
  const [team2Wickets, setTeam2Wickets] = useState(3);
  const [team2Overs, setTeam2Overs] = useState(4.5);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cricket Scoreboard</h1>
          <p className="text-gray-600 mt-2">Production-ready scoreboard component for CricLive</p>
        </div>

        {/* Full Scoreboard */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Live Scoreboard</h2>
          <Scoreboard
            team1Name="Blue Warriors"
            team2Name="Red Tigers"
            team1Runs={team1Runs}
            team1Wickets={team1Wickets}
            team1Overs={team1Overs}
            team2Runs={team2Runs}
            team2Wickets={team2Wickets}
            team2Overs={team2Overs}
            compact={false}
          />
        </div>

        {/* Compact Scoreboard */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Compact View</h2>
          <Scoreboard
            team1Name="Blue Warriors"
            team2Name="Red Tigers"
            team1Runs={team1Runs}
            team1Wickets={team1Wickets}
            team1Overs={team1Overs}
            team2Runs={team2Runs}
            team2Wickets={team2Wickets}
            team2Overs={team2Overs}
            compact={true}
          />
        </div>

        {/* Demo Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Demo Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 Controls */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Blue Warriors</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Runs: {team1Runs}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={team1Runs}
                  onChange={(e) => setTeam1Runs(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wickets: {team1Wickets}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={team1Wickets}
                  onChange={(e) => setTeam1Wickets(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overs: {team1Overs.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={team1Overs}
                  onChange={(e) => setTeam1Overs(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Team 2 Controls */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Red Tigers</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Runs: {team2Runs}
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={team2Runs}
                  onChange={(e) => setTeam2Runs(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wickets: {team2Wickets}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={team2Wickets}
                  onChange={(e) => setTeam2Wickets(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overs: {team2Overs.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={team2Overs}
                  onChange={(e) => setTeam2Overs(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Component Documentation</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Displays team names, runs, wickets, and overs</li>
                <li>Calculates and displays run rate</li>
                <li>Shows match status (In Progress/All Out)</li>
                <li>Responsive design (mobile and desktop)</li>
                <li>Compact and full-size view options</li>
                <li>Shows which team is leading</li>
                <li>Integration ready with Match and Innings data</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Usage:</h3>
              <code className="bg-gray-100 p-3 rounded text-xs block overflow-x-auto">
                {`<Scoreboard
  team1Name="Team A"
  team2Name="Team B"
  team1Runs={45}
  team1Wickets={2}
  team1Overs={5.2}
  team2Runs={38}
  team2Wickets={3}
  team2Overs={4.5}
  compact={false}
/>`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
