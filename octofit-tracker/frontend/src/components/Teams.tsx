import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type TeamRecord = { name: string; mascot?: string; members?: unknown[] };

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then(({ teams: records }) => { if (active) setTeams(records); })
      .catch(() => { if (active) setError('Unable to load teams.'); });
    return () => { active = false; };
  }, []);

  return <section className="card"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {error ? <p role="alert">{error}</p> : teams === null ? <p role="status">Loading teams...</p> : teams.length === 0 ? <p>No teams yet.</p> :
      <ul className="list-group list-group-flush">{teams.map((team) => <li className="list-group-item" key={team.name}>
        <strong>{team.name}</strong>{team.mascot ? ` · ${team.mascot}` : ''} · {team.members?.length ?? 0} members
      </li>)}</ul>}
  </div></section>;
}
