function PasKaart({ pas }) {
  return (
    <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', borderLeft: `4px solid ${pas.kleur}` }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${pas.kleur}20`, color: pas.kleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '700', flexShrink: 0 }}>{pas.letter}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{pas.naam}</div>
        <div style={{ fontSize: '12px', color: '#6db88a', marginTop: '3px' }}>{pas.sessies} sessies · €{pas.prijsPerKwh}/kWh</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>€{pas.kostenMaand.toFixed(2)}</div>
        <div style={{ fontSize: '11px', color: '#6db88a', marginTop: '2px' }}>BTW €{pas.btw.toFixed(2)}</div>
      </div>
    </div>
  );
}
export default PasKaart;
