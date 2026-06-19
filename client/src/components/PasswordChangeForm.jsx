import { useState } from 'react';
import { api } from '../api.js';

// Changement de mot de passe.
// requireCurrent=true → l'utilisateur doit saisir son mot de passe actuel (soi-même).
// requireCurrent=false → réinitialisation par un staff.
export default function PasswordChangeForm({ playerId, requireCurrent = true, title = 'Mot de passe' }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setErr(''); setBusy(true);
    try {
      await api.put(`/players/${playerId}/password`, {
        ...(requireCurrent ? { currentPassword: current } : {}),
        newPassword: next,
      });
      setMsg('Mot de passe mis à jour ✅');
      setCurrent(''); setNext('');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card">
      <h3>🔒 {title}</h3>
      {msg && <div className="success">{msg}</div>}
      {err && <div className="error">{err}</div>}
      {requireCurrent && (
        <div className="field">
          <label>Mot de passe actuel</label>
          <input type="password" value={current} required onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}
      <div className="field">
        <label>Nouveau mot de passe (6 caractères min.)</label>
        <input type="password" value={next} required minLength={6} onChange={(e) => setNext(e.target.value)} />
      </div>
      <button className="btn" disabled={busy}>{busy ? '…' : 'Modifier le mot de passe'}</button>
    </form>
  );
}
