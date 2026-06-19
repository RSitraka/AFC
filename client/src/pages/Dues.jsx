import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatAr } from '../utils/money.js';

const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

export default function Dues() {
  const { isStaff, user } = useAuth();
  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(null); // { playerId, month }
  const [amount, setAmount] = useState('');

  const load = () => api.get('/finances/dues').then(setData);
  useEffect(() => { load(); }, []);

  const startEdit = (playerId, month) => { setEditing({ playerId, month }); setAmount(''); };

  const confirm = async () => {
    if (amount === '' || Number(amount) <= 0) return;
    await api.post('/finances/dues', { playerId: editing.playerId, month: editing.month, amount: Number(amount) });
    setEditing(null); setAmount('');
    load();
  };

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  const myRow = data.rows.find((r) => r.playerId === user.id);

  return (
    <div>
      <h1 className="page-title">Cotisations</h1>
      <p style={{ color: '#fff' }}>
        Cotisation mensuelle indicative : <b>{formatAr(data.monthlyDues)}</b> · depuis <b>{monthLabel(data.startMonth)}</b>
      </p>

      {myRow && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="spread">
            <span>💳 <b>Mes cotisations versées</b></span>
            <span className="stat-big" style={{ fontSize: '1.6rem' }}>{formatAr(myRow.totalPaid)}</span>
          </div>
          {myRow.lateCount > 0
            ? <span className="badge red">{myRow.lateCount} mois non réglé(s)</span>
            : <span className="badge green">À jour</span>}
        </div>
      )}

      {!isStaff && <div className="card" style={{ marginBottom: '1rem' }}>👀 Consultation seule — seul le staff peut enregistrer un paiement.</div>}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Total payé</th>
              <th>Retard</th>
              {data.months.map((m) => <th key={m}>{monthLabel(m)}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => {
              const paid = new Set(r.paidMonths);
              const isMe = r.playerId === user.id;
              return (
                <tr key={r.playerId} style={isMe ? { background: 'var(--surface-2)' } : undefined}>
                  <td><b>{r.lastName}</b> {r.firstName}{isMe && ' (moi)'}</td>
                  <td>{formatAr(r.totalPaid)}</td>
                  <td>
                    {r.lateCount > 0
                      ? <span className="badge red">{r.lateCount} mois</span>
                      : <span className="badge green">À jour</span>}
                  </td>
                  {data.months.map((m) => {
                    const isEditing = editing && editing.playerId === r.playerId && editing.month === m;
                    return (
                      <td key={m} style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {paid.has(m) ? (
                          <span className="badge green" title="Payé">✓</span>
                        ) : !isStaff ? (
                          <span className="muted">—</span>
                        ) : isEditing ? (
                          <span className="row" style={{ flexWrap: 'nowrap', gap: '0.2rem', justifyContent: 'center' }}>
                            <input type="number" min="1" step="1" autoFocus value={amount} placeholder="Ar"
                              style={{ width: 72, padding: '0.25rem' }}
                              onChange={(e) => setAmount(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') setEditing(null); }} />
                            <button className="btn sm" onClick={confirm}>✓</button>
                          </span>
                        ) : (
                          <button className="btn sm secondary" title="Enregistrer un paiement" onClick={() => startEdit(r.playerId, m)}>+</button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isStaff && <p className="muted" style={{ color: '#fff' }}>Cliquez sur « + », saisissez le montant (en ariary) puis validez.</p>}
    </div>
  );
}
