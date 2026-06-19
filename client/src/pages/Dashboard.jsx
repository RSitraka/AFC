import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatAr } from '../utils/money.js';

const fmtMoney = formatAr;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">Tableau de bord</h1>

      <div className="grid cols-3">
        <div className="card">
          <div className="muted">Joueurs</div>
          <div className="stat-big">{data.playerCount}</div>
        </div>
        <div className="card">
          <div className="muted">Matchs joués</div>
          <div className="stat-big">{data.matchCount}</div>
        </div>
        <div className="card">
          <div className="muted">Solde de l'équipe</div>
          <div className="stat-big">{fmtMoney(data.balance)}</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: '1rem' }}>
        <div className="card">
          <h3>⚽ Moyenne de buts par format</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Format</th><th>Joués</th><th>Moy. pour</th><th>Moy. contre</th></tr>
              </thead>
              <tbody>
                {data.goalsByFormat.map((g) => (
                  <tr key={g.format}>
                    <td><span className="badge gold">Foot à {g.format}</span></td>
                    <td>{g.played}</td>
                    <td><b>{g.avgGoalsFor}</b></td>
                    <td>{g.avgGoalsAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>🏃 Les plus utilisés</h3>
          {data.mostUsed.map((s) => (
            <div className="spread" key={s.id} style={{ padding: '0.2rem 0' }}>
              <span>{s.name}</span>
              <span className="badge">{s.matchesPlayed} match{s.matchesPlayed > 1 ? 's' : ''} joué{s.matchesPlayed > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="spread">
          <h3>👥 Effectif</h3>
          <Link className="btn sm secondary" to="/effectif">Voir les cartes FIFA</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Joueur</th><th>Poste</th><th>Matchs joués</th><th>Postes</th></tr></thead>
            <tbody>
              {data.players.map((p) => (
                <tr key={p.id}>
                  <td>{p.number ?? '--'}</td>
                  <td><Link to={`/joueur/${p.id}`}>{p.firstName} {p.lastName}</Link></td>
                  <td><span className="badge">{p.mainPosition}</span></td>
                  <td><span className="badge gold">{p.matchesPlayed ?? 0}</span></td>
                  <td className="muted">{(p.positions || []).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
