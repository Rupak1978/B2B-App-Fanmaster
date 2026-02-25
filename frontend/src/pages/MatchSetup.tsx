import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceInput } from '../components/VoiceInput';
import { api } from '../utils/api';
import { Team, Player } from '../types';

export function MatchSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [team1Players, setTeam1Players] = useState<Player[]>([]);
  const [team2Players, setTeam2Players] = useState<Player[]>([]);

  const [form, setForm] = useState({
    team1_name: '',
    team2_name: '',
    team1_id: 0,
    team2_id: 0,
    overs: 20,
    venue: '',
    toss_winner_id: 0,
    toss_decision: '' as 'bat' | 'bowl' | '',
    match_date: new Date().toISOString().split('T')[0],
    team1_players: Array(11).fill('') as string[],
    team2_players: Array(11).fill('') as string[],
    team1_roles: Array(11).fill('batsman') as string[],
    team2_roles: Array(11).fill('batsman') as string[],
  });

  useEffect(() => {
    api.getTeams().then(setTeams).catch(() => {});
  }, []);

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const updatePlayer = (team: 'team1' | 'team2', index: number, name: string) => {
    const key = `${team}_players` as 'team1_players' | 'team2_players';
    const players = [...form[key]];
    players[index] = name;
    setForm((prev) => ({ ...prev, [key]: players }));
  };

  const updateRole = (team: 'team1' | 'team2', index: number, role: string) => {
    const key = `${team}_roles` as 'team1_roles' | 'team2_roles';
    const roles = [...form[key]];
    roles[index] = role;
    setForm((prev) => ({ ...prev, [key]: roles }));
  };

  const handleCreateTeamsAndMatch = async () => {
    setLoading(true);
    try {
      // Create or use existing teams
      let t1Id = form.team1_id;
      let t2Id = form.team2_id;

      if (!t1Id && form.team1_name) {
        const t1 = await api.createTeam({ name: form.team1_name });
        t1Id = t1.id;
      }
      if (!t2Id && form.team2_name) {
        const t2 = await api.createTeam({ name: form.team2_name });
        t2Id = t2.id;
      }

      // Create players for team 1
      for (let i = 0; i < form.team1_players.length; i++) {
        if (form.team1_players[i].trim()) {
          await api.createPlayer({ name: form.team1_players[i].trim(), team_id: t1Id, role: form.team1_roles[i] });
        }
      }

      // Create players for team 2
      for (let i = 0; i < form.team2_players.length; i++) {
        if (form.team2_players[i].trim()) {
          await api.createPlayer({ name: form.team2_players[i].trim(), team_id: t2Id, role: form.team2_roles[i] });
        }
      }

      // Create match
      const tossWinnerId = form.toss_winner_id || null;
      const match = await api.createMatch({
        team1_id: t1Id,
        team2_id: t2Id,
        overs: form.overs,
        venue: form.venue || null,
        toss_winner_id: tossWinnerId,
        toss_decision: form.toss_decision || null,
        match_date: form.match_date,
      });

      // Start match - determine batting team from toss
      let battingTeamId = t1Id;
      if (tossWinnerId && form.toss_decision) {
        if (form.toss_decision === 'bat') {
          battingTeamId = tossWinnerId;
        } else {
          battingTeamId = tossWinnerId === t1Id ? t2Id : t1Id;
        }
      }

      await api.startMatch(match.id, { batting_team_id: battingTeamId });
      navigate(`/score/${match.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const selectExistingTeam = async (teamNum: 'team1' | 'team2', team: Team) => {
    const idKey = `${teamNum}_id` as 'team1_id' | 'team2_id';
    const nameKey = `${teamNum}_name` as 'team1_name' | 'team2_name';
    updateForm(idKey, team.id);
    updateForm(nameKey, team.name);

    // Load existing players
    try {
      const teamData = await api.getTeam(team.id);
      if (teamData.players) {
        const names = teamData.players.map((p: Player) => p.name);
        const roles = teamData.players.map((p: Player) => p.role || 'batsman');
        while (names.length < 11) { names.push(''); roles.push('batsman'); }
        if (teamNum === 'team1') {
          setTeam1Players(teamData.players);
          setForm((prev) => ({ ...prev, team1_players: names.slice(0, 11), team1_roles: roles.slice(0, 11) }));
        } else {
          setTeam2Players(teamData.players);
          setForm((prev) => ({ ...prev, team2_players: names.slice(0, 11), team2_roles: roles.slice(0, 11) }));
        }
      }
    } catch {}
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">New Match</h2>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-cricket-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Teams */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800">Select Teams</h3>

          {teams.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Existing teams:</p>
              <div className="flex flex-wrap gap-2">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (!form.team1_id) selectExistingTeam('team1', t);
                      else if (!form.team2_id && t.id !== form.team1_id) selectExistingTeam('team2', t);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      t.id === form.team1_id || t.id === form.team2_id
                        ? 'bg-cricket-500 text-white border-cricket-500'
                        : 'border-gray-300 hover:border-cricket-400'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <VoiceInput label="Team 1" value={form.team1_name} onChange={(v) => { updateForm('team1_name', v); updateForm('team1_id', 0); }} placeholder="Team 1 name" />
          <VoiceInput label="Team 2" value={form.team2_name} onChange={(v) => { updateForm('team2_name', v); updateForm('team2_id', 0); }} placeholder="Team 2 name" />

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Preview</p>
            <p className="font-semibold text-gray-900 text-center">
              {form.team1_name || 'Team 1'} <span className="text-gray-400">vs</span> {form.team2_name || 'Team 2'}
            </p>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.team1_name || !form.team2_name}
            className="w-full bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Match Details
          </button>
        </div>
      )}

      {/* Step 2: Match Details */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800">Match Details</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Overs</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((o) => (
                <button
                  key={o}
                  onClick={() => updateForm('overs', o)}
                  className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                    form.overs === o ? 'bg-cricket-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          <VoiceInput label="Venue" value={form.venue} onChange={(v) => updateForm('venue', v)} placeholder="Cricket Ground" />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Toss Winner</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ name: form.team1_name, val: 'team1' }, { name: form.team2_name, val: 'team2' }].map((t) => (
                <button
                  key={t.val}
                  onClick={() => updateForm('toss_winner_id', t.val === 'team1' ? (form.team1_id || -1) : (form.team2_id || -2))}
                  className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                    (t.val === 'team1' && form.toss_winner_id === (form.team1_id || -1)) ||
                    (t.val === 'team2' && form.toss_winner_id === (form.team2_id || -2))
                      ? 'bg-cricket-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {form.toss_winner_id !== 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Elected to</label>
              <div className="grid grid-cols-2 gap-2">
                {(['bat', 'bowl'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => updateForm('toss_decision', d)}
                    className={`py-3 rounded-lg text-sm font-semibold capitalize transition-colors ${
                      form.toss_decision === d ? 'bg-cricket-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors"
            >
              Next: Team 1 Players
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Team 1 Players */}
      {step === 3 && (
        <div className="space-y-2 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{form.team1_name} - Playing XI</h3>

          {team1Players.length > 0 && (
            <p className="text-sm text-green-600 mb-2">Players loaded from existing team</p>
          )}

          {form.team1_players.map((name, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <VoiceInput label={`#${i + 1}`} value={name} onChange={(v) => updatePlayer('team1', i, v)} placeholder={`Player ${i + 1}`} />
              </div>
              <select
                value={form.team1_roles[i]}
                onChange={(e) => updateRole('team1', i, e.target.value)}
                className="mb-4 px-2 py-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="batsman">Bat</option>
                <option value="bowler">Bowl</option>
                <option value="all-rounder">AR</option>
                <option value="wicket-keeper">WK</option>
              </select>
            </div>
          ))}

          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={form.team1_players.filter(Boolean).length < 2}
              className="flex-1 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors disabled:opacity-50"
            >
              Next: {form.team2_name} Players
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Team 2 Players */}
      {step === 4 && (
        <div className="space-y-2 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{form.team2_name} - Playing XI</h3>

          {team2Players.length > 0 && (
            <p className="text-sm text-green-600 mb-2">Players loaded from existing team</p>
          )}

          {form.team2_players.map((name, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <VoiceInput label={`#${i + 1}`} value={name} onChange={(v) => updatePlayer('team2', i, v)} placeholder={`Player ${i + 1}`} />
              </div>
              <select
                value={form.team2_roles[i]}
                onChange={(e) => updateRole('team2', i, e.target.value)}
                className="mb-4 px-2 py-3 border border-gray-300 rounded-lg text-sm"
              >
                <option value="batsman">Bat</option>
                <option value="bowler">Bowl</option>
                <option value="all-rounder">AR</option>
                <option value="wicket-keeper">WK</option>
              </select>
            </div>
          ))}

          {/* Final Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Match Summary</p>
            <p className="font-semibold text-gray-900 text-center">{form.team1_name} vs {form.team2_name}</p>
            <p className="text-sm text-gray-500 text-center">{form.overs} overs &middot; {form.venue || 'Venue TBD'}</p>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">{form.team1_name}</p>
                {form.team1_players.filter(Boolean).map((p, i) => (
                  <p key={i} className="text-gray-500 text-xs">{p}</p>
                ))}
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">{form.team2_name}</p>
                {form.team2_players.filter(Boolean).map((p, i) => (
                  <p key={i} className="text-gray-500 text-xs">{p}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              onClick={handleCreateTeamsAndMatch}
              disabled={loading || form.team2_players.filter(Boolean).length < 2}
              className="flex-1 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start Match'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
