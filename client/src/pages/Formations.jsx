import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import PitchLines from '../components/PitchLines.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function MiniPitch({ lineup }) {
  const starters = lineup.positions.filter((p) => p.role === 'STARTER');
  return (
    <div className="pitch" style={{ maxWidth: 280 }}>
      <PitchLines />
      {starters.map((p, i) => (
        <div key={i} className="token" style={{ left: `${p.x}%`, top: `${p.y}%`, width: 48 }}>
          <div className="jersey" style={{ width: 30, height: 30, fontSize: '1rem' }}>
            {p.player?.number ?? (p.player?.lastName?.[0] || '·')}
          </div>
          <div className="tname" style={{ fontSize: '0.6rem' }}>{p.player?.lastName || ''}</div>
        </div>
      ))}
    </div>
  );
}

export default function Formations() {
  const { isStaff } = useAuth();
  const [lineups, setLineups] = useState([]);

  useEffect(() => {
    api.get('/lineups').then(setLineups);
  }, []);

  const remove = async (id) => {
    await api.del(`/lineups/${id}`);
    setLineups((l) => l.filter((x) => x.id !== id));
  };

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Formations enregistrées</h1>
        <Link className="btn gold" to="/tactique">+ Nouvelle composition</Link>
      </div>

      {lineups.length === 0 ? (
        <div className="card empty-state">
          Aucune formation enregistrée. <Link to="/tactique">Créez-en une</Link>.
        </div>
      ) : (
        <div className="grid cols-2">
          {lineups.map((l) => (
            <div className="card" key={l.id}>
              <div className="spread">
                <h3>{l.name}</h3>
                <span className="badge gold">Foot à {l.format} · {l.formation}</span>
              </div>
              <div style={{ display: 'grid', placeItems: 'center' }}><MiniPitch lineup={l} /></div>
              <div className="row" style={{ marginTop: '0.6rem' }}>
                <Link className="btn sm" to="/tactique">Ouvrir dans l'éditeur</Link>
                {isStaff && <button className="btn sm danger" onClick={() => remove(l.id)}>Supprimer</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
