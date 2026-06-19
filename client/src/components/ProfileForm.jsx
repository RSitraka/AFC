import { useState } from 'react';
import { MAIN_POSITIONS, DETAILED_POSITIONS, STRONG_FEET, STAT_FIELDS } from '../data/football.js';
import ImageUpload from './ImageUpload.jsx';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

// Formulaire de profil joueur + notes FIFA (sur 10).
export default function ProfileForm({ initial, onSubmit, submitLabel = 'Enregistrer' }) {
  const [form, setForm] = useState({
    firstName: initial?.firstName || '',
    lastName: initial?.lastName || '',
    photoUrl: initial?.photoUrl || '',
    number: initial?.number ?? '',
    secondaryNumber: initial?.secondaryNumber ?? '',
    mainPosition: initial?.mainPosition || 'MID',
    positions: initial?.positions || [],
    strongFoot: initial?.strongFoot || 'RIGHT',
    birthDate: toDateInput(initial?.birthDate),
  });
  const [stats, setStats] = useState(() => {
    const base = {};
    STAT_FIELDS.forEach((f) => (base[f.key] = initial?.stats?.[f.key] ?? 5));
    return base;
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const togglePos = (value) =>
    setForm((f) => ({
      ...f,
      positions: f.positions.includes(value)
        ? f.positions.filter((p) => p !== value)
        : [...f.positions, value],
    }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSubmit({
        ...form,
        number: form.number === '' ? null : Number(form.number),
        secondaryNumber: form.secondaryNumber === '' ? null : Number(form.secondaryNumber),
        birthDate: form.birthDate || null,
        stats,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="error">{error}</div>}
      <div className="grid cols-2">
        <div className="card">
          <h3>Identité</h3>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Prénom</label>
              <input value={form.firstName} required onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Nom</label>
              <input value={form.lastName} required onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <ImageUpload label="Photo du joueur" value={form.photoUrl} onChange={(v) => set('photoUrl', v)} />

          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Numéro</label>
              <input type="number" min="0" max="99" value={form.number} onChange={(e) => set('number', e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Numéro secondaire</label>
              <input type="number" min="0" max="99" value={form.secondaryNumber} onChange={(e) => set('secondaryNumber', e.target.value)} />
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Pied fort</label>
              <select value={form.strongFoot} onChange={(e) => set('strongFoot', e.target.value)}>
                {STRONG_FEET.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Poste principal</label>
              <select value={form.mainPosition} onChange={(e) => set('mainPosition', e.target.value)}>
                {MAIN_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Date de naissance</label>
              <input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
            </div>
          </div>
          <label>Postes (sélection multiple)</label>
          <div className="pill-select">
            {DETAILED_POSITIONS.map((p) => (
              <button type="button" key={p.value}
                className={`pill ${form.positions.includes(p.value) ? 'active' : ''}`}
                title={p.label} onClick={() => togglePos(p.value)}>
                {p.value}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Notes (sur 10)</h3>
          <p className="muted" style={{ marginTop: 0 }}>Modifiables uniquement par vous.</p>
          {STAT_FIELDS.map((f) => (
            <div className="range-row" key={f.key}>
              <label style={{ margin: 0 }}>{f.label}{f.isRisk ? ' ⚠️' : ''}</label>
              <input type="range" min="0" max="10" value={stats[f.key]}
                onChange={(e) => setStats((s) => ({ ...s, [f.key]: Number(e.target.value) }))} />
              <b style={{ textAlign: 'right' }}>{stats[f.key]}</b>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : submitLabel}</button>
      </div>
    </form>
  );
}
