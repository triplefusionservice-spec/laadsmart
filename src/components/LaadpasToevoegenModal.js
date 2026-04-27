import { useState, useEffect } from 'react';
import { addCustomPass, getMergedPasses } from '../utils/laadpassenOpslag';
import laadpasAanbiedersCatalogus from '../data/laadpasAanbiedersCatalogus';

const KLEUR_OPTIES = ['#6db88a', '#c8ff00', '#ff6b35', '#f7d117', '#00aaff', '#9b59b6', '#e74c3c', '#1abc9c'];

function LaadpasToevoegenModal({ onSluiten, onToegevoegd }) {
  const [naam, setNaam] = useState('');
  const [pasnummer, setPasnummer] = useState('');
  const [prijsPerKwh, setPrijsPerKwh] = useState('');
  const [kleur, setKleur] = useState(KLEUR_OPTIES[0]);
  const [status, setStatus] = useState('');
  const [sjabloon, setSjabloon] = useState('');
  const [beschikbareSjablonen, setBeschikbareSjablonen] = useState([]);

  useEffect(() => {
    const merged = getMergedPasses();
    const namen = new Set(merged.map((p) => p.naam.toLowerCase()));
    setBeschikbareSjablonen(laadpasAanbiedersCatalogus.filter((c) => !namen.has(c.naam.toLowerCase())));
  }, []);

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#000000aa',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  };
  const modalStyle = {
    background: '#0a2e1a',
    border: '1px solid #1f6b3d',
    borderRadius: '20px 20px 0 0',
    padding: '24px',
    width: '390px',
    maxWidth: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  };
  const inputStyle = {
    background: '#0a2e1a',
    border: '1px solid #1f6b3d',
    borderRadius: '10px',
    padding: '12px',
    color: 'white',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };
  const selectScrollStyle = {
    ...inputStyle,
    maxHeight: 'min(38vh, 200px)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  const onSjabloonChange = (e) => {
    const v = e.target.value;
    setSjabloon(v);
    setStatus('');
    if (v === '' || v === '__eigen__') {
      if (v === '__eigen__') {
        setNaam('');
        setPrijsPerKwh('');
        setKleur(KLEUR_OPTIES[0]);
      }
      return;
    }
    const t = laadpasAanbiedersCatalogus.find((c) => c.naam === v);
    if (t) {
      setNaam(t.naam);
      setPrijsPerKwh(String(t.prijsPerKwh));
      setKleur(t.kleur);
    }
  };

  const handleSubmit = () => {
    setStatus('');
    const prijs = parseFloat(String(prijsPerKwh).replace(',', '.'));
    const result = addCustomPass({
      naam,
      kleur,
      prijsPerKwh: prijs,
      letter: naam.trim().charAt(0).toUpperCase(),
      pasnummer: pasnummer.trim(),
    });
    if (!result.ok) {
      setStatus(result.error || 'Kon niet opslaan.');
      return;
    }
    onToegevoegd();
    onSluiten();
  };

  const selectRows = Math.min(7, Math.max(3, beschikbareSjablonen.length + 2));

  return (
    <div style={overlayStyle} onClick={onSluiten} role="presentation">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="laadpas-modal-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div id="laadpas-modal-title" style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>
            + Nieuwe laadpas
          </div>
          <button
            type="button"
            onClick={onSluiten}
            style={{ background: 'none', border: 'none', color: '#6db88a', cursor: 'pointer', fontSize: '18px' }}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>
        <p style={{ color: '#6db88a', fontSize: '13px', marginTop: 0, marginBottom: '16px' }}>
          Kies een aanbieder uit de lijst (scrollbaar) om naam, kleur en indicatieve prijs te vullen — of kies &quot;Eigen naam&quot; en vul alles zelf in.
        </p>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px' }}>Aanbieder (sjabloon)</label>
          <select value={sjabloon} onChange={onSjabloonChange} style={selectScrollStyle} size={selectRows}>
            <option value="">— Kies aanbieder —</option>
            {beschikbareSjablonen.map((c) => (
              <option key={c.naam} value={c.naam}>
                {c.naam} (ca. €{Number(c.prijsPerKwh).toFixed(2)}/kWh)
              </option>
            ))}
            <option value="__eigen__">— Eigen naam invoeren —</option>
          </select>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px' }}>Naam</label>
          <input
            type="text"
            value={naam}
            onChange={(e) => {
              setNaam(e.target.value);
              setSjabloon('');
            }}
            placeholder="bijv. Eneco eMobility"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px' }}>
            Pasnummer <span style={{ fontWeight: '400' }}>(optioneel)</span>
          </label>
          <input
            type="text"
            value={pasnummer}
            onChange={(e) => setPasnummer(e.target.value)}
            placeholder="Staat op PDF/CSV bij rapporten"
            style={inputStyle}
            autoComplete="off"
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px' }}>
            Prijs per kWh (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={prijsPerKwh}
            onChange={(e) => setPrijsPerKwh(e.target.value)}
            placeholder="bijv. 0.42"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6db88a', marginBottom: '8px' }}>Kleur</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {KLEUR_OPTIES.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKleur(k)}
                title={k}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: k,
                  border: kleur === k ? '3px solid #fff' : '2px solid #1f6b3d',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              />
            ))}
          </div>
        </div>
        {status && (
          <div
            style={{
              background: '#0f3d22',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#ff9b9b',
              textAlign: 'center',
            }}
          >
            {status}
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
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
          }}
        >
          Laadpas toevoegen
        </button>
      </div>
    </div>
  );
}

export default LaadpasToevoegenModal;
