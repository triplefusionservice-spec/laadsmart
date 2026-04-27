import React, { useEffect, useRef } from 'react';

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Doorgaan',
  cancelLabel = 'Annuleren',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
      }
      if (e.key === 'Enter') {
        // Voorkom “Enter” op cancel-knop/andere inputs; we willen standaard bevestigen.
        e.preventDefault();
        onConfirm?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const overlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.78)',
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    boxSizing: 'border-box',
  };

  const card = {
    width: 'min(360px, 94vw)',
    background: '#0a2e1a',
    border: `1px solid ${danger ? '#5a2a2a' : '#1f6b3d'}`,
    borderRadius: '18px',
    padding: '18px 18px 16px',
    boxSizing: 'border-box',
  };

  const btnBase = {
    width: '100%',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    border: 'none',
  };

  const btnConfirm = {
    ...btnBase,
    background: danger ? '#ff6b6b' : '#c8ff00',
    color: danger ? '#2b0b0b' : '#0a2e1a',
  };

  const btnCancel = {
    ...btnBase,
    background: 'transparent',
    border: '1px solid #1f6b3d',
    color: '#6db88a',
    fontWeight: '700',
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
          <div>
            <div id="confirm-title" style={{ fontSize: '16px', fontWeight: '900', color: danger ? '#ff9b9b' : 'white' }}>
              {title || 'Bevestigen'}
            </div>
            {message ? (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#a8f0c6', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {message}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Sluiten"
            style={{ background: 'transparent', border: 'none', color: '#6db88a', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          <button ref={confirmBtnRef} type="button" onClick={onConfirm} style={btnConfirm}>
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} style={btnCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;

