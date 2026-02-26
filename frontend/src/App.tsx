import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tournaments, TournamentDetail } from './pages/Tournaments';
import { CreateTournament } from './pages/CreateTournament';
import { Score } from './pages/Score';
import { MatchSetup } from './pages/MatchSetup';
import { LiveScoring } from './pages/LiveScoring';
import { AudienceScreen } from './pages/AudienceScreen';
import { AdminDashboard } from './pages/AdminDashboard';
import { Players, PlayerDetail } from './pages/Players';
import { Records } from './pages/Records';
import { setCurrentUser } from './utils/localStore';

function LoginScreen({ onLogin }: { onLogin: (mobile: string) => void }) {
  const [mobile, setMobile] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = mobile.replace(/\D/g, '');
    if (cleaned.length >= 10) onLogin(cleaned);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12a4 4 0 018 0" fill="none" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CricLive</h1>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>Gully cricket scoring & stats</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1" style={{ fontSize: '14px' }}>Mobile Number</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              style={{ fontSize: '16px' }}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={mobile.replace(/\D/g, '').length < 10}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tap-target"
            style={{ fontSize: '16px' }}
          >
            Start Scoring
          </button>
        </form>
        <p className="text-center text-gray-400 mt-6" style={{ fontSize: '14px' }}>Your data stays on this device</p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('criclive_user');
    if (saved) {
      setUser(saved);
      setCurrentUser(saved);
    }
  }, []);

  const handleLogin = (mobile: string) => {
    localStorage.setItem('criclive_user', mobile);
    setCurrentUser(mobile);
    setUser(mobile);
  };

  const handleLogout = () => {
    localStorage.removeItem('criclive_user');
    setCurrentUser('');
    setUser(null);
  };

  return (
    <HashRouter>
      <Routes>
        {/* Public routes - no login needed */}
        <Route path="/live/:matchId" element={<AudienceScreen />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Protected routes */}
        {!user ? (
          <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
        ) : (
          <Route element={<Layout user={user} onLogout={handleLogout} />}>
            <Route path="/" element={<Home />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/create" element={<CreateTournament />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/score" element={<Score />} />
            <Route path="/score/setup" element={<MatchSetup />} />
            <Route path="/score/:id" element={<LiveScoring />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:id" element={<PlayerDetail />} />
            <Route path="/records" element={<Records />} />
          </Route>
        )}
      </Routes>
    </HashRouter>
  );
}
