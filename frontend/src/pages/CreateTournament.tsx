import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VoiceInput } from '../components/VoiceInput';
import { api } from '../utils/api';

export function CreateTournament() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    format: 'T20' as 'T20' | 'ODI' | 'Test',
    tournament_type: 'League' as 'League' | 'Knockout' | 'Round Robin',
    start_date: '',
    venue: '',
    num_teams: 2,
    teams: ['', ''] as string[],
  });

  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const setNumTeams = (n: number) => {
    const teams = Array.from({ length: n }, (_, i) => form.teams[i] || '');
    setForm((prev) => ({ ...prev, num_teams: n, teams }));
  };

  const updateTeam = (index: number, name: string) => {
    const teams = [...form.teams];
    teams[index] = name;
    setForm((prev) => ({ ...prev, teams }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const tournament = await api.createTournament({
        name: form.name,
        format: form.format,
        tournament_type: form.tournament_type,
        start_date: form.start_date || null,
        venue: form.venue || null,
        num_teams: form.num_teams,
      });

      // Create teams
      for (const teamName of form.teams) {
        if (teamName.trim()) {
          await api.createTeam({ name: teamName.trim(), tournament_id: tournament.id });
        }
      }

      navigate(`/tournaments/${tournament.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Create Tournament</h2>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-cricket-500' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-1 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tournament Details</h3>
          <VoiceInput label="Tournament Name" value={form.name} onChange={(v) => updateForm('name', v)} placeholder="e.g., Summer League 2026" />
          <VoiceInput label="Venue" value={form.venue} onChange={(v) => updateForm('venue', v)} placeholder="e.g., City Cricket Ground" />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => updateForm('start_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Preview Panel */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Preview</p>
            <p className="font-semibold text-gray-900">{form.name || 'Tournament Name'}</p>
            <p className="text-sm text-gray-500">{form.venue || 'Venue'} &middot; {form.start_date || 'Date TBD'}</p>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.name}
            className="w-full mt-4 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Format & Teams
          </button>
        </div>
      )}

      {/* Step 2: Format */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Format & Structure</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['T20', 'ODI', 'Test'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => updateForm('format', f)}
                  className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                    form.format === f
                      ? 'bg-cricket-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['League', 'Knockout', 'Round Robin'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateForm('tournament_type', t)}
                  className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                    form.tournament_type === t
                      ? 'bg-cricket-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Teams</label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setNumTeams(Math.max(2, form.num_teams - 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-2xl font-bold text-gray-900 w-8 text-center">{form.num_teams}</span>
              <button
                onClick={() => setNumTeams(Math.min(16, form.num_teams + 1))}
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Preview</p>
            <p className="font-semibold text-gray-900">{form.name}</p>
            <p className="text-sm text-gray-500">{form.format} &middot; {form.tournament_type} &middot; {form.num_teams} teams</p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors"
            >
              Next: Add Teams
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Team Names */}
      {step === 3 && (
        <div className="space-y-1 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Teams</h3>

          {form.teams.map((team, i) => (
            <VoiceInput
              key={i}
              label={`Team ${i + 1}`}
              value={team}
              onChange={(v) => updateTeam(i, v)}
              placeholder={`Enter team ${i + 1} name`}
            />
          ))}

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Tournament Summary</p>
            <p className="font-semibold text-gray-900">{form.name}</p>
            <p className="text-sm text-gray-500 mb-2">{form.format} &middot; {form.tournament_type}</p>
            <div className="flex flex-wrap gap-1">
              {form.teams.filter(Boolean).map((t, i) => (
                <span key={i} className="text-xs bg-cricket-100 text-cricket-700 px-2 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-lg font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name}
              className="flex-1 bg-cricket-500 text-white py-3 rounded-lg font-semibold hover:bg-cricket-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
