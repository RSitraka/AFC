import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Approvals() {
  const [pending, setPending] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/players/pending').then(setPending);
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    await api.post(`/players/${id}/${action}`);
    setMsg(action === 'approve' ? 'Compte validé ✅' : 'Compte refusé.');
    load();
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div>
      <h1 className="page-title">Validation des comptes</h1>
      {msg && <div className="success">{msg}</div>}

      {pending.length === 0 ? (
        <div className="card empty-state">Aucun compte en attente de validation.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Nom</th><th>Email</th><th>Demandé le</th><th>Actions</th></tr></thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td>{p.firstName} {p.lastName}</td>
                  <td className="muted">{p.email}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="row">
                    <button className="btn sm" onClick={() => act(p.id, 'approve')}>Valider</button>
                    <button className="btn sm danger" onClick={() => act(p.id, 'reject')}>Refuser</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
