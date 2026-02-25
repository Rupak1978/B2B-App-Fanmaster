import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tournaments, TournamentDetail } from './pages/Tournaments';
import { CreateTournament } from './pages/CreateTournament';
import { Score } from './pages/Score';
import { MatchSetup } from './pages/MatchSetup';
import { LiveScoring } from './pages/LiveScoring';
import { Players, PlayerDetail } from './pages/Players';
import { Records } from './pages/Records';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
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
      </Routes>
    </BrowserRouter>
  );
}
