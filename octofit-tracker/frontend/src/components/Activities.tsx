import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ActivityRecord = { type: string; minutes: number; points: number; occurredAt?: string };

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then(({ activities: records }) => { if (active) setActivities(records); })
      .catch(() => { if (active) setError('Unable to load activities.'); });
    return () => { active = false; };
  }, []);

  return <section className="card"><div className="card-body">
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {error ? <p role="alert">{error}</p> : activities === null ? <p role="status">Loading activities...</p> : activities.length === 0 ? <p>No activities yet.</p> :
      <ul className="list-group list-group-flush">{activities.map((activity, index) => <li className="list-group-item" key={`${activity.type}-${activity.occurredAt ?? index}`}>
        <strong>{activity.type}</strong> · {activity.minutes} minutes · {activity.points} points
      </li>)}</ul>}
  </div></section>;
}
