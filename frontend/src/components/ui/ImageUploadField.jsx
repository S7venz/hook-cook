import { useRef, useState } from 'react';
import { useAuth } from '../../lib/auth.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export function ImageUploadField({ value, onChange }) {
  const { token } = useAuth();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${BASE_URL}/api/uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? `Erreur ${response.status}`);
      }
      const data = await response.json();
      onChange(data.url);
    } catch (err) {
      setError(err.message ?? 'Upload impossible.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="stack-sm">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: 'var(--sp-4)',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            width: 160,
            height: 200,
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-md)',
            overflow: 'hidden',
            background: 'var(--bg-sunk)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--fs-12)',
          }}
        >
          {value ? (
            <img
              src={value}
              alt="Aperçu"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span>Aucune image</span>
          )}
        </div>
        <div className="stack-sm">
          <div className="stack-sm">
            <input
              type="url"
              className="input mono"
              placeholder="https://… ou upload ci-dessous"
              value={value ?? ''}
              onChange={(e) => onChange(e.target.value)}
            />
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Upload…' : 'Téléverser un fichier'}
              </button>
              {value && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clear}
                  disabled={uploading}
                >
                  Retirer
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
            </div>
          </div>
          <div className="hint">JPG, PNG, WebP, AVIF — max 8 Mo.</div>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
