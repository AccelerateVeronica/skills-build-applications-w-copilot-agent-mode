import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(({ suggestions: records }) => { if (active) setSuggestions(records); })
      .catch(() => { if (active) setError('Unable to load workout suggestions.'); });
    return () => { active = false; };
  }, []);

  return <section className="card"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {error ? <p role="alert">{error}</p> : suggestions === null ? <p role="status">Loading workout suggestions...</p> : suggestions.length === 0 ? <p>No workout suggestions yet.</p> :
      <ul className="list-group list-group-flush">{suggestions.map((suggestion) => <li className="list-group-item" key={suggestion.title}>
        <strong>{suggestion.title}</strong>{suggestion.focus ? ` · ${suggestion.focus}` : ''}{suggestion.minutes ? ` · ${suggestion.minutes} minutes` : ''}{suggestion.difficulty ? ` · ${suggestion.difficulty}` : ''}
        {suggestion.reason && <p className="mb-0">{suggestion.reason}</p>}
      </li>)}</ul>}
  </div></section>;
}
