import { useState, useLayoutEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import laadpasAanbiedersCatalogus, { catalogusVoorSelectie } from '../data/laadpasAanbiedersCatalogus';

function SessieForm({ onToevoegen, laadpassen, authUserId }) {
  const [form, setForm] = useState({
    pasSelect: '',
    kwh: '',
    bedrag: '',
    datum: new Date().toISOString().split('T')[0],
  });
  const [status, setStatus] = useState('');

  const pasOpties = useMemo(() => {
    const userOpts = laadpassen.map((p) => ({
      value: `u:${p.id}`,
      label: `${p.naam} — €${Number(p.prijsPerKwh).toFixed(2)}/kWh`,
      pas: p,
      tpl: null,
    }));
    const cat = catalogusVoorSelectie(laadpassen);
    const catOpts = cat.map((t) => ({
      value: `c:${encodeURIComponent(t.naam)}`,
      label: `${t.naam} — €${Number(t.prijsPerKwh).toFixed(2)}/kWh`,
      pas: null,
      tpl: t,
    }));
    return [...userOpts, ...catOpts];
  }, [laadpassen]);

  useLayoutEffect(() => {
    setForm((prev) => {
      const geldig = pasOpties.some((o) => o.value === prev.pasSelect);
      if (geldig) return prev;
      const first = pasOpties[0]?.value ?? '';
      return { ...prev, pasSelect: first };
    });
  }, [pasOpties]);

  const resolvePas = (pasSelect) => {
    if (!pasSelect || !pasSelect.includes(':')) return null;
    const [kind, rest] = pasSelect.split(':');
    if (kind === 'u') {
      const id = parseInt(rest, 10);
      const pas = laadpassen.find((p) => p.id === id);
      return pas ? { naam: pas.naam, prijsPerKwh: Number(pas.prijsPerKwh) } : null;
    }
    if (kind === 'c') {
      const naam = decodeURIComponent(rest);
      const tpl = laadpasAanbiedersCatalogus.find((t) => t.naam === naam);
      return tpl ? { naam: tpl.naam, prijsPerKwh: Number(tpl.prijsPerKwh) } : null;
    }
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    if (name === 'kwh' || name === 'pasSelect') {
      const sel = name === 'pasSelect' ? value : form.pasSelect;
      const resolved = resolvePas(sel);
      const kwh = name === 'kwh' ? parseFloat(value) : parseFloat(form.kwh);
      if (resolved && kwh) updates.bedrag = (resolved.prijsPerKwh * kwh).toFixed(2);
    }
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    if (!form.kwh || !form.bedrag) { setStatus('❌ Vul kWh in'); return; }
    setStatus('⏳ Bezig met opslaan...');
    const resolved = resolvePas(form.pasSelect);
    if (!resolved) { setStatus('❌ Kies een laadpas'); return; }
    const kwh = Number(form.kwh);
    const bedrag = Number(form.bedrag);
    if (!Number.isFinite(kwh) || kwh <= 0) { setStatus('❌ Vul een geldig aantal kWh in'); return; }
    if (!Number.isFinite(bedrag) || bedrag <= 0) { setStatus('❌ Ongeldig bedrag'); return; }
    const datumStr = String(form.datum || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datumStr)) { setStatus('❌ Kies een geldige datum'); return; }

    const btw = Number((bedrag / 1.21 * 0.21).toFixed(2));

    const row = {
      pas_naam: resolved.naam,
      kwh,
      bedrag,
      btw,
      excl_btw: Number((bedrag - btw).toFixed(2)),
      datum: datumStr,
    };

    if (authUserId) {
      row.user_id = authUserId;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) row.user_id = user.id;
    }

    const { data, error } = await supabase.from('sessies').insert([row]).select();
    if (error) {
      setStatus('❌ Fout: ' + error.message);
    } else {
      setStatus('✅ Opgeslagen!');
      onToevoegen(data[0]);
      const nextSel = pasOpties[0]?.value ?? '';
      setForm({ pasSelect: nextSel, kwh: '', bedrag: '', datum: new Date().toISOString().split('T')[0] });
    }
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
    maxHeight: 'min(40vh, 220px)',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingRight: '8px',
  };
  const labelStyle = { fontSize: '12px', color: '#6db88a', marginBottom: '6px', display: 'block' };

  return (
    <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>⚡ Sessie toevoegen</div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Laadpas / aanbieder</label>
        {pasOpties.length === 0 ? (
          <div style={{ ...inputStyle, color: '#ff9b9b', fontSize: '13px' }}>Geen laadpas of sjabloon beschikbaar. Voeg eerst een pas toe op het tabblad Passen.</div>
        ) : (
          <select name="pasSelect" value={form.pasSelect} onChange={handleChange} style={selectScrollStyle} size={Math.min(8, pasOpties.length)}>
            {pasOpties.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6db88a', lineHeight: 1.45 }}>
          Mijn passen bovenaan; sjablonen kun je gebruiken zonder aparte pas. Prijs is indicatief — pas eventueel je eigen pas aan op het tabblad Passen.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>kWh geladen</label>
          <input type="number" name="kwh" value={form.kwh} onChange={handleChange} placeholder="bijv. 45" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Bedrag (auto)</label>
          <input type="number" name="bedrag" value={form.bedrag} onChange={handleChange} placeholder="€0.00" style={{ ...inputStyle, color: '#c8ff00' }} />
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>Datum</label>
        <input type="date" name="datum" value={form.datum} onChange={handleChange} style={inputStyle} />
      </div>
      {form.bedrag && (
        <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6db88a', marginBottom: '4px' }}>
            <span>Excl. BTW</span>
            <span>€{(parseFloat(form.bedrag) / 1.21).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6db88a', marginBottom: '4px' }}>
            <span>BTW 21%</span>
            <span>€{(parseFloat(form.bedrag) / 1.21 * 0.21).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: '600', paddingTop: '8px', borderTop: '1px solid #1f6b3d' }}>
            <span>Totaal</span>
            <span>€{parseFloat(form.bedrag).toFixed(2)}</span>
          </div>
        </div>
      )}
      {status && (
        <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : status.includes('✅') ? '#c8ff00' : '#6db88a', textAlign: 'center' }}>
          {status}
        </div>
      )}
      <button type="button" onClick={handleSubmit} disabled={pasOpties.length === 0} style={{ background: pasOpties.length === 0 ? '#3d5c45' : '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: pasOpties.length === 0 ? 'not-allowed' : 'pointer' }}>
        Sessie opslaan
      </button>
    </div>
  );
}

export default SessieForm;
