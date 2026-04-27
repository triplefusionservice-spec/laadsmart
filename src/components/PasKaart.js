import { useState, useEffect } from 'react';

function PasKaart({ pas, stats, voorbladLeeg, onReset, onMoveToTrash, onSavePassDetails, onToast }) {
  const leeg = Boolean(voorbladLeeg);
  const sessies = leeg ? 0 : stats?.sessies ?? pas.sessies ?? 0;
  const kosten = leeg ? 0 : stats?.bedrag ?? pas.kostenMaand ?? 0;
  const btw = leeg ? 0 : stats?.btw ?? pas.btw ?? 0;

  const [pasnummerLokaal, setPasnummerLokaal] = useState(pas.pasnummer || '');
  const [prijsLokaal, setPrijsLokaal] = useState(String(pas.prijsPerKwh ?? ''));

  useEffect(() => {
    setPasnummerLokaal(pas.pasnummer || '');
    setPrijsLokaal(String(pas.prijsPerKwh ?? ''));
  }, [pas.id, pas.pasnummer, pas.prijsPerKwh]);

  const opslaanDetails = () => {
    const prijs = parseFloat(String(prijsLokaal).replace(',', '.'));
    if (!Number.isFinite(prijs) || prijs <= 0) {
      if (onToast) onToast('Vul een geldige €/kWh in.', 'error');
      else return;
      return;
    }
    onSavePassDetails(pas.id, { pasnummer: pasnummerLokaal.trim(), prijsPerKwh: prijs });
    if (onToast) onToast('Pasgegevens opgeslagen.', 'info');
  };

  const inputKlein = {
    background: '#0a2e1a',
    border: '1px solid #1f6b3d',
    borderRadius: '8px',
    padding: '8px 10px',
    color: 'white',
    fontSize: '13px',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        background: '#0f3d22',
        border: '1px solid #1f6b3d',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: 0,
        borderLeft: `4px solid ${pas.kleur}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${pas.kleur}20`,
            color: pas.kleur,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '700',
            flexShrink: 0,
          }}
        >
          {pas.letter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{pas.naam}</div>
          <div style={{ fontSize: '12px', color: '#6db88a', marginTop: '3px' }}>
            {sessies} sessies · €{Number(pas.prijsPerKwh).toFixed(2)}/kWh
            {pas.pasnummer ? (
              <span style={{ color: '#a8f0c6' }}> · Pasnr. {pas.pasnummer}</span>
            ) : null}
          </div>
          {leeg && (
            <div style={{ fontSize: '10px', color: '#a8f0c6', marginTop: '6px', lineHeight: 1.35 }}>
              Overzicht leeg — sessies blijven in Rapport (met datumfilter).
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>€{Number(kosten).toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#6db88a', marginTop: '2px' }}>BTW €{Number(btw).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1f6b3d' }}>
        <div style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600', marginBottom: '6px' }}>Pasnr. & prijs (voor rapport / administratie)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#6db88a', display: 'block', marginBottom: '4px' }}>Pasnummer</label>
            <input
              type="text"
              value={pasnummerLokaal}
              onChange={(e) => setPasnummerLokaal(e.target.value)}
              placeholder="Optioneel"
              style={inputKlein}
              autoComplete="off"
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#6db88a', display: 'block', marginBottom: '4px' }}>€/kWh</label>
            <input
              type="text"
              inputMode="decimal"
              value={prijsLokaal}
              onChange={(e) => setPrijsLokaal(e.target.value)}
              placeholder="0.00"
              style={inputKlein}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={opslaanDetails}
          style={{
            width: '100%',
            marginBottom: '10px',
            background: '#1a5c34',
            border: '1px solid #1f6b3d',
            borderRadius: '10px',
            padding: '8px',
            color: '#c8ff00',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Opslaan pasnr. & prijs
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            flex: 1,
            background: '#0a2e1a',
            border: '1px solid #1f6b3d',
            borderRadius: '10px',
            padding: '8px 10px',
            color: '#6db88a',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          {leeg ? 'Overzicht herstellen' : 'Reset overzicht'}
        </button>
        <button
          type="button"
          onClick={() => onMoveToTrash(pas)}
          style={{
            flex: 1,
            background: 'transparent',
            border: '1px solid #5a4a2a',
            borderRadius: '10px',
            padding: '8px 10px',
            color: '#ffcc80',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Naar prullenbak
        </button>
      </div>
    </div>
  );
}

export default PasKaart;
