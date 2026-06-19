import { useRef, useState } from 'react';

// Redimensionne le fichier image côté client puis renvoie une data URL JPEG.
function resizeToDataUrl(file, max = 400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > max) { height = (height * max) / width; width = max; }
        else if (height >= width && height > max) { width = (width * max) / height; height = max; }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload de photo par fichier (pas de lien en ligne).
export default function ImageUpload({ value, onChange, label = 'Photo', shape = 'circle' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Fichier image requis'); return; }
    setError('');
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("Impossible de lire l'image");
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const radius = shape === 'circle' ? '50%' : '12px';

  return (
    <div className="field">
      <label>{label}</label>
      <div className="row" style={{ gap: '0.8rem' }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: radius, flex: '0 0 auto',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'grid', placeItems: 'center', overflow: 'hidden',
          }}
        >
          {value
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="muted" style={{ fontSize: '1.6rem' }}>📷</span>}
        </div>
        <div className="row" style={{ gap: '0.4rem' }}>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          <button type="button" className="btn sm secondary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? '…' : (value ? 'Changer' : 'Choisir une photo')}
          </button>
          {value && (
            <button type="button" className="btn sm danger" onClick={() => onChange('')}>Retirer</button>
          )}
        </div>
      </div>
      {error && <div className="error" style={{ marginTop: '0.4rem' }}>{error}</div>}
    </div>
  );
}
