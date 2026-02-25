import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

export function CreateTournament() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', format: 'Custom' as string, tournament_type: 'League' as string,
    start_date: '', venue: '', num_teams: 2, teams: ['', ''] as string[],
  });

  const update = (key: string, value: any) => setForm(p => ({ ...p, [key]: value }));
  const setNumTeams = (n: number) => { const teams = Array.from({ length: n }, (_, i) => form.teams[i] || ''); setForm(p => ({ ...p, num_teams: n, teams })); };
  const updateTeam = (i: number, name: string) => { const teams = [...form.teams]; teams[i] = name; setForm(p => ({ ...p, teams })); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const t = await api.createTournament({ name: form.name, format: form.format, tournament_type: form.tournament_type, start_date: form.start_date || null, venue: form.venue || null, num_teams: form.num_teams });
      for (const tn of form.teams) { if (tn.trim()) await api.createTeam({ name: tn.trim(), tournament_id: t.id }); }
      navigate(`/tournaments/${t.id}`);
    } catch (e: any) { alert(e.message || 'Failed'); } finally { setLoading(false); }
  };

  const s = { fontSize: '14px' } as const;
  const Opt = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button onClick={onClick} className={`rounded-lg font-semibold tap-target flex items-center justify-center py-2.5 transition-colors ${active ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} style={s}>{children}</button>
  );

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Create Tournament</h2>
      <div className="flex gap-1 mb-6">{[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i<=step?'bg-green-600':'bg-gray-200'}`} />)}</div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Details</h3>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Tournament Name</label>
            <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Sunday League" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={{ fontSize: '16px' }} /></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Venue</label>
            <input value={form.venue} onChange={e => update('venue', e.target.value)} placeholder="Ground name" className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={s} /></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Start Date</label>
            <input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg" style={s} /></div>
          <button onClick={() => setStep(2)} disabled={!form.name} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '16px' }}>Next: Format</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Format</h3>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Match Format</label>
            <div className="grid grid-cols-4 gap-2">{['T20','ODI','Test','Custom'].map(f => <Opt key={f} active={form.format===f} onClick={() => update('format',f)}>{f}</Opt>)}</div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Type</label>
            <div className="grid grid-cols-3 gap-2">{['League','Knockout','Round Robin'].map(t => <Opt key={t} active={form.tournament_type===t} onClick={() => update('tournament_type',t)}>{t}</Opt>)}</div></div>
          <div><label className="block font-medium text-gray-700 mb-1" style={s}>Teams</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setNumTeams(Math.max(2,form.num_teams-1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center text-lg">-</button>
              <span className="text-xl font-bold w-8 text-center">{form.num_teams}</span>
              <button onClick={() => setNumTeams(Math.min(16,form.num_teams+1))} className="w-11 h-11 rounded-lg bg-gray-100 font-bold hover:bg-gray-200 tap-target flex items-center justify-center text-lg">+</button>
            </div></div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 tap-target" style={s}>Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target" style={s}>Next: Teams</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Add Teams</h3>
          {form.teams.map((t, i) => (
            <div key={i}><label className="block text-gray-500 mb-0.5" style={{ fontSize: '12px' }}>Team {i+1}</label>
              <input value={t} onChange={e => updateTeam(i, e.target.value)} placeholder={`Team ${i+1} name`} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" style={s} /></div>
          ))}
          <div className="flex gap-3 mt-4">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 tap-target" style={s}>Back</button>
            <button onClick={handleSubmit} disabled={loading||!form.name} className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold tap-target disabled:opacity-40" style={{ fontSize: '16px' }}>{loading?'Creating...':'Create'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
