import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { DEFAULT_RULES, MatchRules, Team, Player } from '../types';

export function MatchSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [rules, setRules] = useState<MatchRules>({ ...DEFAULT_RULES });
  const [form, setForm] = useState({
    team1_name: '', team2_name: '', team1_id: 0, team2_id: 0, venue: '',
    toss_winner: '' as '' | 'team1' | 'team2',
    toss_decision: '' as '' | 'bat' | 'bowl',
    match_date: new Date().toISOString().split('T')[0],
    team1_players: Array(11).fill('') as string[],
    team2_players: Array(11).fill('') as string[],
    team1_roles: Array(11).fill('batsman') as string[],
    team2_roles: Array(11).fill('batsman') as string[],
  });

  useEffect(() => { api.getTeams().then(setTeams).catch(() => {}); }, []);

  const updateRule = (key: keyof MatchRules, value: any) => setRules(p => ({ ...p, [key]: value }));
  const updateForm = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));
  const updatePlayer = (team: 'team1' | 'team2', i: number, name: string) => {
    const k = `${team}_players` as const; const arr = [...form[k]]; arr[i] = name; setForm(p => ({ ...p, [k]: arr }));
  };
  const updateRole = (team: 'team1' | 'team2', i: number, role: string) => {
    const k = `${team}_roles` as const; const arr = [...form[k]]; arr[i] = role; setForm(p => ({ ...p, [k]: arr }));
  };

  const selectExistingTeam = async (tn: 'team1' | 'team2', team: Team) => {
    updateForm(`${tn}_id`, team.id); updateForm(`${tn}_name`, team.name);
    try {
      const d = await api.getTeam(team.id);
      if (d.players) {
        const names = d.players.map((p: Player) => p.name);
        const roles = d.players.map((p: Player) => p.role || 'batsman');
        while (names.length < 11) { names.push(''); roles.push('batsman'); }
        setForm(p => ({ ...p, [`${tn}_players`]: names.slice(0, 11), [`${tn}_roles`]: roles.slice(0, 11) }));
      }
    } catch {}
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      let t1Id = form.team1_id, t2Id = form.team2_id;
      if (!t1Id) { const t = await api.createTeam({ name: form.team1_name }); t1Id = t.id; }
      if (!t2Id) { const t = await api.createTeam({ name: form.team2_name }); t2Id = t.id; }
      for (let i = 0; i < rules.players_per_side; i++) {
        if (form.team1_players[i]?.trim()) await api.createPlayer({ name: form.team1_players[i].trim(), team_id: t1Id, role: form.team1_roles[i] });
        if (form.team2_players[i]?.trim()) await api.createPlayer({ name: form.team2_players[i].trim(), team_id: t2Id, role: form.team2_roles[i] });
      }
      const tw = form.toss_winner === 'team1' ? t1Id : form.toss_winner === 'team2' ? t2Id : null;
      const match = await api.createMatch({ team1_id: t1Id, team2_id: t2Id, overs: rules.overs, rules, venue: form.venue || null, toss_winner_id: tw, toss_decision: form.toss_decision || null, match_date: form.match_date });
      let bat = t1Id;
      if (tw && form.toss_decision) bat = form.toss_decision === 'bat' ? tw : (tw === t1Id ? t2Id : t1Id);
      await api.startMatch(match.id, { batting_team_id: bat });
      navigate(`/score/${match.id}`);
    } catch (err: any) { alert(err.message || 'Failed'); } finally { setLoading(false); }
  };

  const Opt = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`rounded-lg font-semibold tap-target flex items-center justify-center py-2.5 transition-colors ${active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={{ fontSize: '14px' }}>{children}</button>
  );

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-4">New Match</h2>
      <div className="flex gap-1 mb-6">{[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />)}</div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Teams</h3>
          {teams.length > 0 && (
            <div><p className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>Pick existing or type new:</p>
            <div className="flex flex-wrap gap-2">{teams.map(t => (
              <button key={t.id} onClick={() => { if (!form.team1_id) selectExistingTeam('team1', t); else if (!form.team2_id && t.id !== form.team1_id) selectExistingTeam('team2', t); }}
                className={`px-3 py-1.5 rounded-full border tap-target transition-colors ${t.id === form.team1_id || t.id === form.team2_id ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 hover:border-green-400'}`} style={{ fontSize: '14px' }}>{t.name}</button>
            ))}</div></div>
          )}
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Team 1</label>
            <input value={form.team1_name} onChange={e => { updateForm('team1_name', e.target.value); updateForm('team1_id', 0); }} placeholder="Team 1 name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '16px' }} /></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Team 2</label>
            <input value={form.team2_name} onChange={e => { updateForm('team2_name', e.target.value); updateForm('team2_id', 0); }} placeholder="Team 2 name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '16px' }} /></div>
          <button onClick={() => setStep(2)} disabled={!form.team1_name || !form.team2_name} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '16px' }}>Next: Match Rules</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Match Rules</h3>

          {/* Overs - blank input, no preset buttons */}
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Overs</label>
            <input type="number" min={1} max={200} value={rules.overs || ''} onChange={e => updateRule('overs', Math.min(200, Math.max(1, parseInt(e.target.value)||1)))} placeholder="Enter overs (1-200)" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '16px' }} /></div>

          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Balls per Over</label>
            <div className="grid grid-cols-4 gap-2">{[4,5,6,8].map(b => <Opt key={b} active={rules.balls_per_over===b} onClick={() => updateRule('balls_per_over',b)}>{b}</Opt>)}</div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Players per Side</label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateRule('players_per_side', Math.max(5, rules.players_per_side-1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center text-lg">-</button>
              <span className="text-xl font-bold w-8 text-center">{rules.players_per_side}</span>
              <button onClick={() => updateRule('players_per_side', Math.min(11, rules.players_per_side+1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center text-lg">+</button>
            </div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Wide Ball Penalty</label>
            <div className="grid grid-cols-2 gap-2"><Opt active={rules.wide_runs===1} onClick={() => updateRule('wide_runs',1)}>1 Run</Opt><Opt active={rules.wide_runs===2} onClick={() => updateRule('wide_runs',2)}>2 Runs</Opt></div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Powerplay Overs</label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateRule('powerplay_overs', Math.max(0,rules.powerplay_overs-1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center">-</button>
              <span className="text-xl font-bold w-8 text-center">{rules.powerplay_overs}</span>
              <button onClick={() => updateRule('powerplay_overs', Math.min(rules.overs,rules.powerplay_overs+1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center">+</button>
              <span className="text-gray-500" style={{ fontSize: '14px' }}>{rules.powerplay_overs===0?'Off':`${rules.powerplay_overs} ov`}</span>
            </div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Bouncer Limit / Over</label>
            <div className="flex items-center gap-3">
              <button onClick={() => updateRule('bouncer_limit', Math.max(0,rules.bouncer_limit-1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center">-</button>
              <span className="text-xl font-bold w-8 text-center">{rules.bouncer_limit}</span>
              <button onClick={() => updateRule('bouncer_limit', Math.min(rules.balls_per_over,rules.bouncer_limit+1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center">+</button>
              <span className="text-gray-500" style={{ fontSize: '14px' }}>{rules.bouncer_limit===0?'No limit':`${rules.bouncer_limit} max`}</span>
            </div></div>

          {/* Toggles */}
          <div className="space-y-2">{([['no_ball_free_hit','Free Hit on No Ball'],['last_man_stands','Last Man Stands'],['super_over','Super Over for Tie']] as const).map(([key,label]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <span className="text-gray-700" style={{ fontSize: '14px' }}>{label}</span>
              <button onClick={() => updateRule(key as keyof MatchRules, !(rules as any)[key])} className={`w-12 h-7 rounded-full transition-colors relative ${(rules as any)[key]?'bg-green-600':'bg-gray-300'}`}>
                <span className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all" style={{ left: (rules as any)[key]?'22px':'2px' }} /></button>
            </div>))}</div>

          {/* POWERBALL */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-yellow-800" style={{ fontSize: '14px' }}>Powerball</span>
                <p className="text-yellow-600" style={{ fontSize: '12px' }}>Specific ball: runs {rules.powerball_multiplier}X, wicket = -5</p>
              </div>
              <button onClick={() => updateRule('powerball_enabled', !rules.powerball_enabled)} className={`w-12 h-7 rounded-full transition-colors relative ${rules.powerball_enabled?'bg-yellow-500':'bg-gray-300'}`}>
                <span className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all" style={{ left: rules.powerball_enabled?'22px':'2px' }} /></button>
            </div>
            {rules.powerball_enabled && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-yellow-700 block mb-1" style={{ fontSize: '12px' }}>Over #</label>
                    <input type="number" min={1} max={rules.overs} value={rules.powerball_over} onChange={e => updateRule('powerball_over', Math.min(rules.overs, Math.max(1, parseInt(e.target.value)||1)))} className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-center" style={{ fontSize: '14px' }} />
                  </div>
                  <div>
                    <label className="text-yellow-700 block mb-1" style={{ fontSize: '12px' }}>Ball #</label>
                    <input type="number" min={1} max={rules.balls_per_over} value={rules.powerball_ball} onChange={e => updateRule('powerball_ball', Math.min(rules.balls_per_over, Math.max(1, parseInt(e.target.value)||1)))} className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-center" style={{ fontSize: '14px' }} />
                  </div>
                </div>
                <div>
                  <label className="text-yellow-700 block mb-1" style={{ fontSize: '12px' }}>Multiplier</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Opt active={rules.powerball_multiplier===2} onClick={() => updateRule('powerball_multiplier',2)}>2X</Opt>
                    <Opt active={rules.powerball_multiplier===3} onClick={() => updateRule('powerball_multiplier',3)}>3X</Opt>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* POWER OVER */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-orange-800" style={{ fontSize: '14px' }}>Power Over</span>
                <p className="text-orange-600" style={{ fontSize: '12px' }}>Entire over: runs {rules.power_over_multiplier}X, wicket = -5</p>
              </div>
              <button onClick={() => updateRule('power_over_enabled', !rules.power_over_enabled)} className={`w-12 h-7 rounded-full transition-colors relative ${rules.power_over_enabled?'bg-orange-500':'bg-gray-300'}`}>
                <span className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all" style={{ left: rules.power_over_enabled?'22px':'2px' }} /></button>
            </div>
            {rules.power_over_enabled && (
              <div className="space-y-2">
                <div>
                  <label className="text-orange-700 block mb-1" style={{ fontSize: '12px' }}>Over #</label>
                  <input type="number" min={1} max={rules.overs} value={rules.power_over_number} onChange={e => updateRule('power_over_number', Math.min(rules.overs, Math.max(1, parseInt(e.target.value)||1)))} className="w-full px-3 py-2 border border-orange-300 rounded-lg text-center" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className="text-orange-700 block mb-1" style={{ fontSize: '12px' }}>Multiplier</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Opt active={rules.power_over_multiplier===2} onClick={() => updateRule('power_over_multiplier',2)}>2X</Opt>
                    <Opt active={rules.power_over_multiplier===3} onClick={() => updateRule('power_over_multiplier',3)}>3X</Opt>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target" style={{ fontSize: '14px' }}>Next: {form.team1_name}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>{form.team1_name} - {rules.players_per_side} Players</h3>
          {Array.from({length: rules.players_per_side}, (_,i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-gray-400 w-5 text-right" style={{ fontSize: '14px' }}>{i+1}</span>
              <input value={form.team1_players[i]||''} onChange={e => updatePlayer('team1',i,e.target.value)} placeholder={`Player ${i+1}`} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '14px' }} />
              <select value={form.team1_roles[i]} onChange={e => updateRole('team1',i,e.target.value)} className="px-2 py-2.5 border border-gray-300 rounded-lg" style={{ fontSize: '14px' }}>
                <option value="batsman">Bat</option><option value="bowler">Bowl</option><option value="all-rounder">AR</option><option value="wicket-keeper">WK</option>
              </select>
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Back</button>
            <button onClick={() => setStep(4)} disabled={form.team1_players.filter(Boolean).length<2} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '14px' }}>Next: {form.team2_name}</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>{form.team2_name} - {rules.players_per_side} Players</h3>
          {Array.from({length: rules.players_per_side}, (_,i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-gray-400 w-5 text-right" style={{ fontSize: '14px' }}>{i+1}</span>
              <input value={form.team2_players[i]||''} onChange={e => updatePlayer('team2',i,e.target.value)} placeholder={`Player ${i+1}`} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '14px' }} />
              <select value={form.team2_roles[i]} onChange={e => updateRole('team2',i,e.target.value)} className="px-2 py-2.5 border border-gray-300 rounded-lg" style={{ fontSize: '14px' }}>
                <option value="batsman">Bat</option><option value="bowler">Bowl</option><option value="all-rounder">AR</option><option value="wicket-keeper">WK</option>
              </select>
            </div>
          ))}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Back</button>
            <button onClick={() => setStep(5)} disabled={form.team2_players.filter(Boolean).length<2} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '14px' }}>Next: Toss</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Toss & Start</h3>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Venue (optional)</label>
            <input value={form.venue} onChange={e => updateForm('venue',e.target.value)} placeholder="Ground name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '14px' }} /></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Toss Won By</label>
            <div className="grid grid-cols-2 gap-2"><Opt active={form.toss_winner==='team1'} onClick={() => updateForm('toss_winner','team1')}>{form.team1_name}</Opt><Opt active={form.toss_winner==='team2'} onClick={() => updateForm('toss_winner','team2')}>{form.team2_name}</Opt></div></div>
          {form.toss_winner && <div><label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Elected to</label>
            <div className="grid grid-cols-2 gap-2"><Opt active={form.toss_decision==='bat'} onClick={() => updateForm('toss_decision','bat')}>Bat</Opt><Opt active={form.toss_decision==='bowl'} onClick={() => updateForm('toss_decision','bowl')}>Bowl</Opt></div></div>}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-gray-400 uppercase font-semibold mb-1" style={{ fontSize: '12px' }}>Summary</p>
            <p className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>{form.team1_name} vs {form.team2_name}</p>
            <p className="text-gray-500" style={{ fontSize: '14px' }}>{rules.overs} ov | {rules.balls_per_over} balls/ov | {rules.players_per_side} a side</p>
            <p className="text-gray-500" style={{ fontSize: '14px' }}>Wide: {rules.wide_runs}r | Free hit: {rules.no_ball_free_hit?'Yes':'No'} | LMS: {rules.last_man_stands?'Yes':'No'}</p>
            {rules.powerball_enabled && <p className="text-yellow-700 font-medium" style={{ fontSize: '14px' }}>Powerball: Over {rules.powerball_over} Ball {rules.powerball_ball} ({rules.powerball_multiplier}X)</p>}
            {rules.power_over_enabled && <p className="text-orange-700 font-medium" style={{ fontSize: '14px' }}>Power Over: Over {rules.power_over_number} ({rules.power_over_multiplier}X)</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(4)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 tap-target" style={{ fontSize: '14px' }}>Back</button>
            <button onClick={handleStart} disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '16px' }}>{loading?'Starting...':'Start Match'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
