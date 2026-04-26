import { useState } from 'react';
import { supabase } from '../supabase';
import laadpassen from '../data/laadpassen';

const AANBIEDERS = [
  { id: 'fastned', titel: 'Fastned', hint: 'Export uit je Fastned-account (CSV)', accent: '#ff6b35' },
  { id: 'shell', titel: 'Shell Recharge', hint: 'Shell-exportbestand (CSV)', accent: '#f7d117' },
  { id: 'allego', titel: 'Allego', hint: 'Allego-exportbestand (CSV)', accent: '#00aaff' },
  { id: 'tap', titel: 'Tap Electric', hint: 'Tap-exportbestand (CSV)', accent: '#2ecc71' },
];

const NAMEN = { fastned: 'Fastned', shell: 'Shell Recharge', allego: 'Allego', tap: 'Tap Electric' };

function splitCsvRegel(regel) {
  const sep = regel.includes(';') ? ';' : ',';
  return regel.split(sep).map((k) => k.replace(/^"|"$/g, '').trim());
}

function verwerkCSV(tekst, aanbieder) {
  const regels = tekst.split(/\r?\n/).filter((r) => r.trim());
  const sessies = [];
  regels.forEach((regel, index) => {
    if (index === 0) return;
    const kolommen = splitCsvRegel(regel);
    if (kolommen.length >= 4) {
      const bedrag = parseFloat(String(kolommen[3]).replace(',', '.')) || 0;
      const btw = parseFloat(((bedrag / 1.21) * 0.21).toFixed(2));
      sessies.push({
        datum: kolommen[0] || new Date().toISOString().split('T')[0],
        pas_naam: NAMEN[aanbieder],
        kwh: parseFloat(String(kolommen[2]).replace(',', '.')) || 0,
        bedrag,
        btw,
      });
    }
  });
  return sessies;
}

function kleurVoorPas(naam) {
  return laadpassen.find((p) => p.naam === naam)?.kleur || '#6db88a';
}

function ImportModal({ onSluiten, onImport }) {
  const [stap, setStap] = useState('keuze');
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState([]);

  const sluit = () => {
    setStap('keuze');
    setPreview([]);
    setStatus('');
    onSluiten();
  };

  const handleCSV = (e, aanbieder) => {
    const bestand = e.target.files?.[0];
    e.target.value = '';
    if (!bestand) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const sessies = verwerkCSV(String(evt.target.result), aanbieder);
      if (sessies.length === 0) {
        setStatus('❌ Geen geldige rijen gevonden. Controleer of het bestand komma’s of puntkomma’s gebruikt.');
        return;
      }
      setStatus('');
      setPreview(sessies);
      setStap('preview');
    };
    reader.readAsText(bestand);
  };

  const importeerSessies = async () => {
    if (preview.length === 0) return;
    const rows = preview.map((s) => ({
      pas_naam: s.pas_naam,
      kwh: Number(s.kwh),
      bedrag: Number(s.bedrag),
      btw: Number(s.btw),
      datum: String(s.datum).slice(0, 10),
    }));
    setStatus('⏳ Bezig met importeren...');
    const { error } = await supabase.from('sessies').insert(rows);
    if (error) {
      setStatus('❌ Fout: ' + error.message);
    } else {
      setStatus('✅ ' + preview.length + ' sessies geïmporteerd!');
      onImport();
      setTimeout(() => sluit(), 1500);
    }
  };

  const sectionTitle = {
    fontSize: '11px',
    color: '#a8f0c6',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
    marginTop: '4px',
  };

  const card = {
    background: '#0f3d22',
    border: '1px solid #1f6b3d',
    borderRadius: '14px',
    padding: '14px 16px',
    marginBottom: '12px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={sluit}
      role="presentation"
    >
      <div
        role="dialog"
        aria-labelledby="import-titel"
        style={{
          background: '#0a2e1a',
          border: '1px solid #1f6b3d',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          maxHeight: 'min(88vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 18px 14px',
            borderBottom: '1px solid #1f6b3d',
          }}
        >
          <div id="import-titel" style={{ fontSize: '17px', fontWeight: '700', color: 'white' }}>
            Sessies importeren
          </div>
          <button
            type="button"
            onClick={sluit}
            aria-label="Sluiten"
            style={{
              background: '#0f3d22',
              border: '1px solid #1f6b3d',
              borderRadius: '10px',
              color: '#6db88a',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 22px', WebkitOverflowScrolling: 'touch' }}>
          {stap === 'keuze' && (
            <>
              <p style={{ color: '#6db88a', fontSize: '13px', lineHeight: 1.5, margin: '0 0 18px' }}>
                Kies je aanbieder en selecteer het CSV-exportbestand. De eerste regel wordt als kopregel overgeslagen.
              </p>

              <div style={sectionTitle}>CSV van laadpas</div>
              {AANBIEDERS.map((a) => (
                <label
                  key={a.id}
                  htmlFor={`import-csv-${a.id}`}
                  style={{
                    ...card,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '4px',
                      alignSelf: 'stretch',
                      minHeight: '40px',
                      borderRadius: '2px',
                      background: a.accent,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{a.titel}</div>
                    <div style={{ color: '#6db88a', fontSize: '11px', marginTop: '3px', lineHeight: 1.35 }}>{a.hint}</div>
                  </div>
                  <span style={{ color: '#c8ff00', fontSize: '20px', flexShrink: 0 }} aria-hidden>›</span>
                  <input id={`import-csv-${a.id}`} type="file" accept=".csv,text/csv" onChange={(e) => handleCSV(e, a.id)} style={{ display: 'none' }} />
                </label>
              ))}

              <div style={sectionTitle}>PDF-factuur</div>
              <div style={{ ...card, opacity: 0.75 }}>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>PDF uploaden</div>
                <div style={{ color: '#6db88a', fontSize: '12px', lineHeight: 1.45 }}>Automatisch uitlezen van PDF-facturen volgt later.</div>
              </div>

              <div style={sectionTitle}>Via e-mail</div>
              <div style={card}>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Factuur doorsturen</div>
                <p style={{ color: '#6db88a', fontSize: '12px', margin: '0 0 8px', lineHeight: 1.45 }}>
                  Stuur je factuurmail (als bijlage) naar:
                </p>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    color: '#c8ff00',
                    fontSize: '13px',
                    fontWeight: '600',
                    wordBreak: 'break-all',
                  }}
                >
                  import@laadsmart.app
                </div>
                <p style={{ color: '#6db88a', fontSize: '11px', margin: '10px 0 0', lineHeight: 1.4 }}>
                  Let op: dit adres moet nog gekoppeld worden aan je app — tot die tijd werkt import via e-mail niet automatisch.
                </p>
              </div>

              {status && (
                <div
                  style={{
                    background: '#0f3d22',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: status.startsWith('❌') ? '#ff9b9b' : '#c8ff00',
                    lineHeight: 1.45,
                  }}
                >
                  {status}
                </div>
              )}
            </>
          )}

          {stap === 'preview' && (
            <>
              <p style={{ color: '#6db88a', fontSize: '13px', margin: '0 0 12px' }}>
                <strong style={{ color: 'white' }}>{preview.length}</strong> sessies gevonden. Controleer de gegevens en bevestig.
              </p>

              <div style={{ overflowX: 'auto', marginBottom: '14px', borderRadius: '12px', border: '1px solid #1f6b3d' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#0f3d22', color: '#a8f0c6', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px', fontWeight: '600' }}>Datum</th>
                      <th style={{ padding: '10px 8px', fontWeight: '600' }}>Pas</th>
                      <th style={{ padding: '10px 8px', fontWeight: '600', textAlign: 'right' }}>kWh</th>
                      <th style={{ padding: '10px 8px', fontWeight: '600', textAlign: 'right' }}>€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((s, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #1f6b3d', color: 'white' }}>
                        <td style={{ padding: '8px', borderLeft: `3px solid ${kleurVoorPas(s.pas_naam)}` }}>{s.datum}</td>
                        <td style={{ padding: '8px', color: '#e8fff0' }}>{s.pas_naam}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#6db88a' }}>{s.kwh}</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600' }}>€{Number(s.bedrag).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {status && (
                <div
                  style={{
                    background: '#0f3d22',
                    borderRadius: '12px',
                    padding: '12px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    color: status.includes('❌') ? '#ff9b9b' : '#c8ff00',
                    textAlign: 'center',
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
                  borderRadius: '12px',
                  padding: '14px',
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginBottom: '10px',
                }}
              >
                Importeer {preview.length} sessies
              </button>
              <button
                type="button"
                onClick={() => {
                  setStap('keuze');
                  setPreview([]);
                  setStatus('');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #1f6b3d',
                  borderRadius: '12px',
                  padding: '12px',
                  width: '100%',
                  fontSize: '14px',
                  color: '#6db88a',
                  cursor: 'pointer',
                }}
              >
                Terug naar keuze
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
