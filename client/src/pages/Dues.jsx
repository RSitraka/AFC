import { useEffect, useState } from 'react';
import { api } from '../api.js';

const fmtMoney = (n) => `${Number(n || 0).toFixed(2)} €`;
const monthLabel = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
};

export default function Dues() {
  const [data, setData] = useState(null);
  const load = () => api.get('/finances/dues').then(setData);
  useEffect(() => { load(); }, []);

  const pay = async (playerId, month) => {
    await api.post('/finances/dues', { playerId, month });
    load();
  };

  if (!data) return <div className="center-screen"><div className="spinner" /></div>;

  return (
    <div>
      <h1 className="page-title">Cotisations</h1>
      <p style={{ color: '#fff' }}>
        Cotisation mensuelle : <b>{fmtMoney(data.monthlyDues)}</b> · depuis <b>{monthLabel(data.startMonth)}</b>
      </p>

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
              return (
                <tr key={r.playerId}>
                  <td><b>{r.lastName}</b> {r.firstName}</td>
                  <td>{fmtMoney(r.totalPaid)} <span className="muted">/ {fmtMoney(r.expectedTotal)}</span></td>
                  <td>
                    {r.lateCount > 0
                      ? <span className="badge red">{r.lateCount} mois de retard</span>
                      : <span className="badge green">À jour</span>}
                  </td>
                  {data.months.map((m) => (
                    <td key={m} style={{ textAlign: 'center' }}>
                      {paid.has(m) ? (
                        <span className="badge green" title="Payé">✓</span>
                      ) : (
                        <button className="btn sm secondary" title="Marquer payé" onClick={() => pay(r.playerId, m)}>€</button>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ color: '#fff' }}>Cliquez sur « € » pour enregistrer le paiement d'un mois.</p>
    </div>
  );
}
