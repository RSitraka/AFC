import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/register', form);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pitch-bg auth-wrap">
      <div className="card auth-card">
        <h1 style={{ textAlign: 'center' }}>Créer un compte</h1>
        {done ? (
          <>
            <div className="success">
              Compte créé ✅ Il doit être <b>validé par un staff</b> avant la première connexion.
            </div>
            <Link className="btn" style={{ width: '100%' }} to="/login">Retour à la connexion</Link>
          </>
        ) : (
          <>
            {error && <div className="error">{error}</div>}
            <form onSubmit={submit}>
              <div className="row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Prénom</label>
                  <input value={form.firstName} required onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label>Nom</label>
                  <input value={form.lastName} required onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} required onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="field">
                <label>Mot de passe (6 caractères min.)</label>
                <div className="pw-wrap">
                  <input type={show ? 'text' : 'password'} value={form.password} required minLength={6}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="pw-eye" onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {show ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Confirmer le mot de passe</label>
                <div className="pw-wrap">
                  <input type={show ? 'text' : 'password'} value={confirm} required minLength={6}
                    onChange={(e) => setConfirm(e.target.value)} />
                  <button type="button" className="pw-eye" onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {show ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirm && form.password !== confirm && (
                  <span className="muted" style={{ color: '#dc2626' }}>Les mots de passe ne correspondent pas</span>
                )}
              </div>
              <button className="btn" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Création…' : "S'inscrire"}
              </button>
            </form>
            <p className="muted" style={{ textAlign: 'center', marginTop: '1rem' }}>
              Déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
