import { useEffect, useMemo, useState } from 'react';

export default function LoginMeldingenModal({ open, titel = 'Meldingen', items, onClose, onMarkRead }) {
  const [checked, setChecked] = useState(() => new Set());

  useEffect(() => {
    if (!open) return;
    setChecked(new Set());
  }, [open, items?.length]);

  const hasAny = (items?.length ?? 0) > 0;

  const selectedIds = useMemo(() => Array.from(checked), [checked]);

  if (!open) return null;

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.72)',
    zIndex: 450,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
  };

  const panel = {
    background: '#0a2e1a',
    border: '1px solid #1f6b3d',
    borderRadius: '20px 20px 12px 12px',
    width: 'min(390px, 100%)',
    maxHeight: 'min(88vh, 720px)',
    overflow: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
  };

  const toggle = (id) => {
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div style={overlay} role="presentation" onClick={onClose}>
      <div style={panel} role="dialog" aria-modal="true" aria-labelledby="login-meldingen-title" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1f6b3d', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div id="login-meldingen-title" style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: 'white' }}>
                {titel}
              </div>
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#6db88a', lineHeight: 1.45 }}>
                Vink aan als <strong style={{ color: 'white' }}>gelezen</strong>. Doe je dat niet, dan zie je ze bij je volgende login opnieuw.
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#6db88a', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }} aria-label="Sluiten">
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 18px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {!hasAny ? (
            <div style={{ color: '#6db88a', fontSize: '13px' }}>Geen meldingen.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((it) => (
                <label
                  key={it.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    padding: '12px',
                    background: '#0f3d22',
                    border: '1px solid #1f6b3d',
                    borderRadius: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(it.id)}
                    onChange={() => toggle(it.id)}
                    style={{ marginTop: '3px', accentColor: '#c8ff00', width: '16px', height: '16px', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>{it.titel}</div>
                    <div style={{ fontSize: '12px', color: '#a8f0c6', marginTop: '4px', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{it.tekst}</div>
                    {it.hint && <div style={{ fontSize: '11px', color: '#6db88a', marginTop: '6px' }}>{it.hint}</div>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #1f6b3d', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, minWidth: '140px', background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px', color: '#6db88a', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => onMarkRead(selectedIds)}
            disabled={selectedIds.length === 0}
            style={{
              flex: 1,
              minWidth: '140px',
              background: '#c8ff00',
              color: '#0a2e1a',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              fontWeight: '900',
              fontSize: '13px',
              cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedIds.length === 0 ? 0.6 : 1,
            }}
          >
            Gelezen &amp; sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

