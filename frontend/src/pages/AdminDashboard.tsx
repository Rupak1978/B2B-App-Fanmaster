import React, { useState, useEffect } from 'react';

interface FeedbackEntry {
  phone: string;
  location: string;
  message: string;
  timestamp: string;
  matchId?: string;
}

export function AdminDashboard() {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    // Load feedback
    try {
      const raw = JSON.parse(localStorage.getItem('criclive_feedback') || '[]');
      setFeedback(raw);
    } catch {}

    // Count matches and users across all localStorage keys
    const allMatches = new Set<string>();
    const allUsers = new Set<string>();
    const allLocations = new Set<string>();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('cl_') && key.includes('_matches')) {
        try {
          const matches = JSON.parse(localStorage.getItem(key) || '[]');
          matches.forEach((m: any) => allMatches.add(String(m.id)));
        } catch {}
      }
      if (key.startsWith('cl_') && key !== 'criclive_user') {
        const parts = key.split('_');
        if (parts.length >= 2 && parts[1].match(/^\d{10,}$/)) {
          allUsers.add(parts[1]);
        }
      }
    }

    // Get locations from feedback
    feedback.forEach(f => { if (f.location) allLocations.add(f.location); });

    setMatchCount(allMatches.size);
    setUserCount(allUsers.size);
    setLocations(Array.from(allLocations));
  }, []);

  const s = { fontSize: '14px' } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12a4 4 0 018 0" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span className="font-bold">CricLive Admin</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-3 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{matchCount}</div>
            <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>Matches</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userCount}</div>
            <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>Users</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{locations.length}</div>
            <p className="text-gray-500 mt-1" style={{ fontSize: '12px' }}>Locations</p>
          </div>
        </div>

        {/* Locations */}
        {locations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-2" style={{ fontSize: '16px' }}>Locations</h3>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc, i) => (
                <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full" style={s}>{loc}</span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Logs */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3" style={{ fontSize: '16px' }}>Feedback Logs ({feedback.length})</h3>
          {feedback.length === 0 ? (
            <p className="text-gray-400 text-center py-4" style={s}>No feedback yet</p>
          ) : (
            <div className="space-y-3">
              {feedback.slice().reverse().map((f, i) => (
                <div key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900" style={s}>{f.message}</p>
                      <p className="text-gray-500 mt-0.5" style={{ fontSize: '12px' }}>
                        {f.phone && `Phone: ${f.phone}`}{f.location && ` | ${f.location}`}
                      </p>
                    </div>
                    <span className="text-gray-400 whitespace-nowrap ml-2" style={{ fontSize: '11px' }}>
                      {new Date(f.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
