import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function ImportModal({ onSluiten, onImport, authUserId }) {
  const [stap, setStap] = useState('keuze');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onSluiten();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSluiten]);

  const verwerkCSV = (tekst, aanbieder) => {
    const regels = tekst.split('\n').filter((r) => r.trim());
    const sessies = [];
    regels.forEach((regel, index) => {
      if (index === 0) return;
      const kolommen = regel.split(',').map((k) => k.replace(/"/g, '').trim());
      if (kolommen.length >= 4) {
        const bedrag = parseFloat(kolommen[3]) || 0;
        const btw = parseFloat(((bedrag / 1.21) * 0.21).toFixed(2));
        const namen = { fastned: 'Fastned', shell: 'Shell Recharge', allego: 'Allego', tap: 'Tap Electric' };
        sessies.push({
          datum: kolommen[0] || new Date().toISOString().split('T')[0],
          pas_naam: namen[aanbieder],
          kwh: parseFloat(kolommen[2]) || 0,
          bedrag,
          btw,
          excl_btw: parseFloat((bedrag - btw).toFixed(2)),
        });
      }
    });
    return sessies;
  };

  const handleCSV = (e, aanbieder) => {
    const bestand = e.target.files[0];
    if (!bestand) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const sessies = verwerkCSV(evt.target.result, aanbieder);
      setPreview(sessies);
      setStap('preview');
    };
    reader.readAsText(bestand);
  };

  const importeerSessies = async () => {
    if (preview.length === 0) return;
    setStatus('⏳ Bezig met importeren...');
    const rows = authUserId ? preview.map((r) => ({ ...r, user_id: authUserId })) : preview;
    const { error } = await supabase.from('sessies').insert(rows);
    if (error) {
      setStatus('❌ Fout: ' + error.message);
    } else {
      setStatus('✅ ' + preview.length + ' sessies geïmporteerd!');
      onImport();
      setTimeout(() => onSluiten(), 1500);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.72)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
  };

  const modalStyle = {
    background: '#0a2e1a',
    border: '1px solid #2a8f52',
    borderRadius: '18px',
    padding: '28px 24px 24px',
    width: 'min(640px, 96vw)',
    maxHeight: 'min(92vh, 900px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
  };

  const scrollArea = { overflowY: 'auto', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch' };

  const sectionLabel = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#c8ff00',
    marginBottom: '10px',
    marginTop: '4px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  };

  const btnStyle = {
    background: '#0f3d22',
    border: '1px solid #1f6b3d',
    borderRadius: '14px',
    padding: '16px 18px',
    width: '100%',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    textAlign: 'left',
    lineHeight: 1.35,
    display: 'block',
    boxSizing: 'border-box',
  };

  const hintStyle = { fontSize: '14px', color: '#a8f0c6', lineHeight: 1.45, marginTop: '6px' };

  return (
    <div style={overlayStyle} onClick={onSluiten} role="presentation">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="import-modal-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexShrink: 0 }}>
          <div>
            <div id="import-modal-title" style={{ fontSize: '22px', fontWeight: '800', color: 'white', lineHeight: 1.2 }}>
              Importeren
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#6db88a', lineHeight: 1.45, maxWidth: '52ch' }}>
              Kies je aanbieder en upload het exportbestand. Daarna zie je een controlelijst voordat sessies worden opgeslagen.
            </p>
          </div>
          <button
            type="button"
            onClick={onSluiten}
            style={{
              background: '#0f3d22',
              border: '1px solid #1f6b3d',
              color: '#6db88a',
              cursor: 'pointer',
              fontSize: '22px',
              lineHeight: 1,
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              flexShrink: 0,
            }}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        <div style={scrollArea}>
          {stap === 'keuze' && (
            <>
              <div style={sectionLabel}>CSV-bestand</div>
              {[
                ['fastned', 'Fastned', 'Export uit je Fastned-account (CSV).'],
                ['shell', 'Shell Recharge', 'Shell Recharge factuur- of verbruiks-export.'],
                ['allego', 'Allego', 'Allego CSV-export.'],
                ['tap', 'Tap Electric', 'Tap Electric CSV-export.'],
              ].map(([id, titel, hint]) => (
                <label key={id} style={{ ...btnStyle, cursor: 'pointer' }}>
                  <span style={{ color: '#c8ff00', fontSize: '15px' }}>{titel}</span>
                  <span style={hintStyle}>{hint}</span>
                  <input type="file" accept=".csv,text/csv" onChange={(e) => handleCSV(e, id)} style={{ display: 'none' }} />
                </label>
              ))}

              <div style={{ ...sectionLabel, marginTop: '22px' }}>PDF (binnenkort)</div>
              <label style={{ ...btnStyle, opacity: 0.85 }}>
                <span style={{ fontSize: '16px' }}>Factuur als PDF</span>
                <span style={hintStyle}>Automatisch uitlezen van PDF-facturen volgt in een latere versie.</span>
                <input type="file" accept=".pdf" onChange={() => setStatus('PDF-import staat op de roadmap.')} style={{ display: 'none' }} />
              </label>

              <div style={{ ...sectionLabel, marginTop: '22px' }}>Via e-mail</div>
              <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '14px', padding: '18px 20px' }}>
                <div style={{ color: 'white', fontSize: '17px', fontWeight: '700', marginBottom: '8px' }}>Doorsturen naar</div>
                <div style={{ color: '#6db88a', fontSize: '15px', lineHeight: 1.45 }}>Factuurmail forwarden naar:</div>
                <div style={{ color: '#c8ff00', fontSize: '18px', fontWeight: '700', marginTop: '10px', wordBreak: 'break-all' }}>
                  import@laadsmart.app
                </div>
                <div style={{ color: '#6db88a', fontSize: '14px', marginTop: '12px', lineHeight: 1.45 }}>
                  Handig voor administratie: bewaar altijd de originele factuur voor de Belastingdienst.
                </div>
              </div>

              {status && (
                <div
                  style={{
                    background: '#0f3d22',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginTop: '16px',
                    fontSize: '15px',
                    color: '#c8ff00',
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  {status}
                </div>
              )}
            </>
          )}

          {stap === 'preview' && (
            <>
              <div style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
                Controle voor import
              </div>
              <div style={{ fontSize: '15px', color: '#6db88a', marginBottom: '16px', lineHeight: 1.45 }}>
                {preview.length} sessie{preview.length !== 1 ? 's' : ''} gevonden. Controleer onderstaande regels (scroll indien nodig).
              </div>
              <div
                style={{
                  maxHeight: 'min(360px, 42vh)',
                  overflowY: 'auto',
                  borderRadius: '14px',
                  border: '1px solid #1f6b3d',
                  marginBottom: '16px',
                }}
              >
                {preview.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: i % 2 === 0 ? '#0f3d22' : '#0a2e1a',
                      borderBottom: i < preview.length - 1 ? '1px solid #1f6b3d' : 'none',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{s.pas_naam}</div>
                      <div style={{ color: '#6db88a', fontSize: '14px', marginTop: '4px' }}>
                        {s.datum} · {s.kwh} kWh
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>€{s.bedrag.toFixed(2)}</div>
                      <div style={{ color: '#6db88a', fontSize: '13px', marginTop: '2px' }}>BTW €{s.btw.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              {status && (
                <div
                  style={{
                    background: '#0f3d22',
                    borderRadius: '12px',
                    padding: '14px',
                    marginBottom: '14px',
                    fontSize: '15px',
                    color: status.includes('❌') ? '#ff9b9b' : '#c8ff00',
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}
                >
                  {status}
                </div>
              )}
              <button
                type="button"
                onClick={importeerSessies}
                style={{
                  background: '#c8ff00',
                  color: '#0a2e1a',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '16px',
                  width: '100%',
                  fontSize: '17px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              >
                Importeer {preview.length} sessie{preview.length !== 1 ? 's' : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStap('keuze');
                  setStatus('');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1f6b3d',
                  borderRadius: '14px',
                  padding: '14px',
                  width: '100%',
                  fontSize: '16px',
                  color: '#6db88a',
                  cursor: 'pointer',
                }}
              >
                ← Andere aanbieder kiezen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
