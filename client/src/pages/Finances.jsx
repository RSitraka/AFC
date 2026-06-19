import { useEffect, useState } from 'react';
import { api } from '../api.js';

const fmtMoney = (n) => `${Number(n || 0).toFixed(2)} €`;
const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR');

export default function Finances() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ type: 'DEPOSIT', amount: '', description: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/finances/transactions').then(setData);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/finances/transactions', { ...form, amount: Number(form.amount) });
      setForm({ type: 'DEPOSIT', amount: '', description: '' });
      load();
    } catch (err) { setError(err.message); }
  };

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">Compte de l'équipe</h1>

      <div className="grid cols-3">
        <div className="card"><div className="muted">Solde actuel</div><div className="stat-big">{fmtMoney(data.balance)}</div></div>
        <div className="card"><div className="muted">Cotisations encaissées</div><div className="stat-big">{fmtMoney(data.duesCollected)}</div></div>
        <div className="card">
          <h3>Nouveau mouvement</h3>
          {error && <div className="error">{error}</div>}
          <form onSubmit={submit}>
            <div className="row">
              <select style={{ flex: 1 }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="DEPOSIT">Ajouter (+)</option>
                <option value="WITHDRAWAL">Retirer (−)</option>
              </select>
              <input style={{ flex: 1 }} type="number" step="0.01" min="0" placeholder="Montant" value={form.amount} required
                onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field" style={{ marginTop: '0.4rem' }}>
              <input placeholder="Description" value={form.description} required onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn sm">Enregistrer</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3>Historique des mouvements</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Montant</th><th></th></tr></thead>
            <tbody>
              {data.transactions.length === 0 && <tr><td colSpan="5" className="muted">Aucun mouvement.</td></tr>}
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{fmtDate(t.createdAt)}</td>
                  <td><span className={`badge ${t.type === 'DEPOSIT' ? 'green' : 'red'}`}>{t.type === 'DEPOSIT' ? 'Ajout' : 'Retrait'}</span></td>
                  <td>{t.description}</td>
                  <td><b>{t.type === 'DEPOSIT' ? '+' : '−'}{fmtMoney(t.amount)}</b></td>
                  <td><button className="btn sm danger" onClick={async () => { await api.del(`/finances/transactions/${t.id}`); load(); }}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
