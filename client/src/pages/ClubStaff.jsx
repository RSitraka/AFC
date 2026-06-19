import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ImageUpload from '../components/ImageUpload.jsx';

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function TeamCard() {
  const { team, setTeam, isStaff } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (team) setForm({ ...team }); }, [team]);
  if (!form) return null;

  const save = async (e) => {
    e.preventDefault();
    const updated = await api.put('/team', {
      name: form.name, logoUrl: form.logoUrl || '', primaryColor: form.primaryColor,
      secondaryColor: form.secondaryColor, monthlyDues: Number(form.monthlyDues), duesStartMonth: form.duesStartMonth,
    });
    setTeam(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card">
      <h3>🏆 Mon club</h3>
      {saved && <div className="success">Enregistré ✅</div>}
      <form onSubmit={save}>
        <div className="field"><label>Nom du club</label>
          <input value={form.name} disabled={!isStaff} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        {isStaff ? (
          <ImageUpload label="Logo du club" shape="square" value={form.logoUrl || ''} onChange={(v) => setForm({ ...form, logoUrl: v })} />
        ) : form.logoUrl ? (
          <div className="field"><label>Logo du club</label>
            <img src={form.logoUrl} alt="logo" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)' }} /></div>
        ) : null}
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Couleur principale</label>
            <input type="color" value={form.primaryColor} disabled={!isStaff} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Couleur secondaire</label>
            <input type="color" value={form.secondaryColor} disabled={!isStaff} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div>
        </div>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Cotisation mensuelle (Ar)</label>
            <input type="number" step="0.5" value={form.monthlyDues} disabled={!isStaff} onChange={(e) => setForm({ ...form, monthlyDues: e.target.value })} /></div>
          <div className="field" style={{ flex: 1 }}><label>Début cotisations</label>
            <input type="month" value={form.duesStartMonth} disabled={!isStaff} onChange={(e) => setForm({ ...form, duesStartMonth: e.target.value })} /></div>
        </div>
        {isStaff && <button className="btn">Enregistrer</button>}
      </form>
    </div>
  );
}

function StaffCard() {
  const { isStaff } = useAuth();
  const [staff, setStaff] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ playerId: '', role: 'coach' });

  const load = () => api.get('/staff').then(setStaff);
  useEffect(() => { load(); api.get('/players').then(setPlayers); }, []);

  const add = async (e) => {
    e.preventDefault();
    const p = players.find((x) => x.id === form.playerId);
    if (!p) return;
    await api.post('/staff', {
      fullName: `${p.firstName} ${p.lastName}`,
      role: form.role,
      photoUrl: p.photoUrl || '',
    });
    setForm({ playerId: '', role: 'coach' });
    load();
  };

  const firstNameOf = (s) => (s.fullName || '').split(' ')[0];

  return (
    <div className="card">
      <h3>🧑‍🏫 Encadrement</h3>
      {staff.length === 0 && <p className="muted">Aucun membre du staff.</p>}
      {staff.map((s) => (
        <div className="spread" key={s.id} style={{ padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
          <span className="row" style={{ gap: '0.5rem' }}>
            {s.photoUrl
              ? <img src={s.photoUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              : <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center' }}>🧑</span>}
            {firstNameOf(s)} <span className="badge">{s.role}</span>
          </span>
          {isStaff && <button className="btn sm danger" onClick={async () => { await api.del(`/staff/${s.id}`); load(); }}>✕</button>}
        </div>
      ))}
      {isStaff && (
        <form onSubmit={add} style={{ marginTop: '0.6rem' }}>
          <div className="row">
            <select style={{ flex: 2 }} value={form.playerId} required onChange={(e) => setForm({ ...form, playerId: e.target.value })}>
              <option value="">— Choisir un compte —</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
            <input style={{ flex: 1 }} placeholder="Rôle" value={form.role} required onChange={(e) => setForm({ ...form, role: e.target.value })} />
          </div>
          <button className="btn sm" style={{ marginTop: '0.4rem' }}>Ajouter</button>
        </form>
      )}
    </div>
  );
}

function Calendar() {
  const { isStaff } = useAuth();
  const [matches, setMatches] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [m, setM] = useState({ opponent: '', date: '', format: 11, location: '' });
  const [t, setT] = useState({ title: 'Entraînement', date: '', location: '' });

  const load = () => {
    api.get('/matches').then(setMatches);
    api.get('/trainings').then(setTrainings);
  };
  useEffect(() => { load(); }, []);

  const addMatch = async (e) => {
    e.preventDefault();
    await api.post('/matches', { ...m, format: Number(m.format) });
    setM({ opponent: '', date: '', format: 11, location: '' });
    load();
  };
  const addTraining = async (e) => {
    e.preventDefault();
    await api.post('/trainings', t);
    setT({ title: 'Entraînement', date: '', location: '' });
    load();
  };

  return (
    <div className="grid cols-2">
      <div className="card">
        <div className="spread">
          <h3>📅 Matchs</h3>
          {isStaff && <Link className="btn sm gold" to="/match/nouveau">+ Match avec compo</Link>}
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Adversaire</th><th>Statut / Score</th><th></th></tr></thead>
            <tbody>
              {matches.map((mt) => {
                const finished = mt.scoreFor != null && mt.scoreAgainst != null;
                return (
                  <tr key={mt.id}>
                    <td>{fmtDate(mt.date)}</td>
                    <td><Link to={`/match/${mt.id}`}>{mt.opponent}</Link> <span className="badge">à {mt.format}</span></td>
                    <td>
                      {finished
                        ? <b>{mt.scoreFor} - {mt.scoreAgainst}</b>
                        : <Link className="badge red" to={`/match/${mt.id}`}>À venir</Link>}
                    </td>
                    <td className="row">
                      <Link className="btn sm secondary" to={`/match/${mt.id}`}>{isStaff && !finished ? 'Score' : 'Voir'}</Link>
                      {isStaff && <button className="btn sm danger" onClick={async () => { await api.del(`/matches/${mt.id}`); load(); }}>✕</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isStaff && (
          <form onSubmit={addMatch} style={{ marginTop: '0.6rem' }}>
            <div className="row">
              <input style={{ flex: 2 }} placeholder="Adversaire" value={m.opponent} required onChange={(e) => setM({ ...m, opponent: e.target.value })} />
              <select style={{ flex: 1 }} value={m.format} onChange={(e) => setM({ ...m, format: e.target.value })}>
                {[5, 7, 9, 11].map((f) => <option key={f} value={f}>à {f}</option>)}
              </select>
            </div>
            <div className="row" style={{ marginTop: '0.4rem' }}>
              <input style={{ flex: 1 }} type="datetime-local" value={m.date} required onChange={(e) => setM({ ...m, date: e.target.value })} />
              <button className="btn sm">+ Match</button>
            </div>
          </form>
        )}
      </div>

      <div className="card">
        <h3>🏃 Entraînements</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Titre</th><th></th></tr></thead>
            <tbody>
              {trainings.map((tr) => (
                <tr key={tr.id}>
                  <td>{fmtDate(tr.date)}</td>
                  <td>{tr.title}</td>
                  <td>{isStaff && <button className="btn sm danger" onClick={async () => { await api.del(`/trainings/${tr.id}`); load(); }}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isStaff && (
          <form onSubmit={addTraining} className="row" style={{ marginTop: '0.6rem' }}>
            <input style={{ flex: 2 }} placeholder="Titre" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
            <input style={{ flex: 1 }} type="datetime-local" value={t.date} required onChange={(e) => setT({ ...t, date: e.target.value })} />
            <button className="btn sm">+</button>
          </form>
        )}
      </div>
    </div>
  );
}

function AttendanceCard() {
  const { isStaff } = useAuth();
  const [matches, setMatches] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [players, setPlayers] = useState([]);
  const [sel, setSel] = useState('');
  const [present, setPresent] = useState({});

  useEffect(() => {
    api.get('/matches').then(setMatches);
    api.get('/trainings').then(setTrainings);
    api.get('/players').then(setPlayers);
  }, []);

  const [type, id] = sel ? sel.split(':') : [];

  useEffect(() => {
    if (!sel) return;
    api.get(`/attendances?eventType=${type}&eventId=${id}`).then((rows) => {
      setPresent(Object.fromEntries(rows.map((r) => [r.playerId, r.present])));
    });
  }, [sel, type, id]);

  const toggle = async (playerId) => {
    const next = !present[playerId];
    setPresent((p) => ({ ...p, [playerId]: next }));
    await api.post('/attendances', { playerId, eventType: type, eventId: id, present: next });
  };

  return (
    <div className="card">
      <h3>✅ Présences</h3>
      <select value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">— Choisir un événement —</option>
        <optgroup label="Matchs">
          {matches.map((m) => <option key={m.id} value={`MATCH:${m.id}`}>{fmtDate(m.date)} · {m.opponent}</option>)}
        </optgroup>
        <optgroup label="Entraînements">
          {trainings.map((t) => <option key={t.id} value={`TRAINING:${t.id}`}>{fmtDate(t.date)} · {t.title}</option>)}
        </optgroup>
      </select>
      {sel && (
        <div style={{ marginTop: '0.8rem' }}>
          {players.map((p) => (
            <div className="spread" key={p.id} style={{ padding: '0.25rem 0', borderBottom: '1px solid var(--border)' }}>
              <span>{p.firstName} {p.lastName}</span>
              <button
                className={`btn sm ${present[p.id] ? '' : 'secondary'}`}
                disabled={!isStaff}
                onClick={() => toggle(p.id)}
              >
                {present[p.id] ? 'Présent' : 'Absent'}
              </button>
            </div>
          ))}
          {!isStaff && <p className="muted">Seul le staff peut modifier les présences.</p>}
        </div>
      )}
    </div>
  );
}

export default function ClubStaff() {
  return (
    <div>
      <h1 className="page-title">Club &amp; staff</h1>
      <div className="grid cols-2">
        <TeamCard />
        <StaffCard />
      </div>
      <div style={{ marginTop: '1rem' }}><Calendar /></div>
      <div style={{ marginTop: '1rem' }}><AttendanceCard /></div>
    </div>
  );
}
