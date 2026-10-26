import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: entries }) => { if (active) setLeaderboard(entries); })
      .catch(() => { if (active) setError('Unable to load leaderboard.'); });
    return () => { active = false; };
  }, []);

  return <section className="card"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {error ? <p role="alert">{error}</p> : leaderboard === null ? <p role="status">Loading leaderboard...</p> : leaderboard.length === 0 ? <p>No leaderboard rankings yet.</p> :
      <ol className="list-group list-group-numbered">{leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
        <span>{entry.teamName}</span><strong>{entry.totalPoints} points</strong>
      </li>)}</ol>}
  </div></section>;
}
