import { useState } from 'react';
import laadpassen from '../data/laadpassen';
import { supabase } from '../supabase';

function SessieForm({ onToevoegen }) {
  const [form, setForm] = useState({ pasId: 1, kwh: '', bedrag: '', datum: new Date().toISOString().split('T')[0] });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    if (name === 'kwh' || name === 'pasId') {
      const pas = laadpassen.find(p => p.id === parseInt(name === 'pasId' ? value : form.pasId));
      const kwh = name === 'kwh' ? parseFloat(value) : parseFloat(form.kwh);
      if (pas && kwh) updates.bedrag = (pas.prijsPerKwh * kwh).toFixed(2);
    }
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    if (!form.kwh || !form.bedrag) { setStatus('❌ Vul kWh in'); return; }
    setStatus('⏳ Bezig met opslaan...');
    const pas = laadpassen.find(p => p.id === parseInt(form.pasId, 10));
    if (!pas) {
      setStatus('❌ Onbekende laadpas');
      return;
    }
    const kwh = Number(form.kwh);
    const bedrag = Number(form.bedrag);
    if (!Number.isFinite(kwh) || kwh <= 0) {
      setStatus('❌ Vul een geldig aantal kWh in');
      return;
    }
    if (!Number.isFinite(bedrag) || bedrag <= 0) {
      setStatus('❌ Ongeldig bedrag');
      return;
    }
    const datumStr = String(form.datum || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datumStr)) {
      setStatus('❌ Kies een geldige datum');
      return;
    }
    const btw = Number((bedrag / 1.21 * 0.21).toFixed(2));
    const { data, error } = await supabase.from('sessies').insert([{
      pas_naam: pas.naam,
      kwh,
      bedrag,
      btw,
      datum: datumStr
    }]).select();
    if (error) {
      setStatus('❌ Fout: ' + error.message);
    } else {
      setStatus('✅ Opgeslagen!');
      onToevoegen(data[0]);
      setForm({ pasId: 1, kwh: '', bedrag: '', datum: new Date().toISOString().split('T')[0] });
    }
  };

  const inputStyle = { background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '12px', color: '#6db88a', marginBottom: '6px', display: 'block' };

  return (
    <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>⚡ Sessie toevoegen</div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Laadpas</label>
        <select name="pasId" value={form.pasId} onChange={handleChange} style={inputStyle}>
          {laadpassen.map(pas => (<option key={pas.id} value={pas.id}>{pas.naam} — €{pas.prijsPerKwh}/kWh</option>))}
        </select>
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
      {status && (
        <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : status.includes('✅') ? '#c8ff00' : '#6db88a', textAlign: 'center' }}>
          {status}
        </div>
      )}
      <button onClick={handleSubmit} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>Sessie opslaan</button>
    </div>
  );
}

export default SessieForm;