import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import laadpassen from './data/laadpassen';
import PasKaart from './components/PasKaart';
import SessieForm from './components/SessieForm';
import { downloadMaandrapportCsv, downloadMaandrapportPdf } from './utils/maandrapportExport';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [isRegistreren, setIsRegistreren] = useState(false);
  const [status, setStatus] = useState('');

  const inputStyle = { background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };

  const handleSubmit = async () => {
    setStatus('⏳ Bezig...');
    if (isRegistreren) {
      const { error } = await supabase.auth.signUp({ email, password: wachtwoord });
      if (error) { setStatus('❌ ' + error.message); }
      else { setStatus('✅ Check je email om te bevestigen!'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord });
      if (error) { setStatus('❌ ' + error.message); }
    }
  };

  return (
    <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', padding: '60px 24px', fontFamily: 'sans-serif', maxWidth: '390px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>Laad<span style={{ color: '#c8ff00' }}>Smart</span></h1>
      <p style={{ color: '#6db88a', fontSize: '13px', marginBottom: '40px' }}>Jouw laadkosten overzicht</p>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>{isRegistreren ? '📝 Account aanmaken' : '🔑 Inloggen'}</div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Wachtwoord" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} style={inputStyle} />
        {status && <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : '#c8ff00', textAlign: 'center' }}>{status}</div>}
        <button onClick={handleSubmit} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
          {isRegistreren ? 'Account aanmaken' : 'Inloggen'}
        </button>
        <div onClick={() => setIsRegistreren(!isRegistreren)} style={{ color: '#6db88a', fontSize: '13px', textAlign: 'center', cursor: 'pointer' }}>
          {isRegistreren ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [sessies, setSessies] = useState([]);
  const [scherm, setScherm] = useState('passen');
  const [laden, setLaden] = useState(true);
  const [gebruiker, setGebruiker] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setGebruiker(session?.user ?? null);
      if (session?.user) haalSessiesOp();
      else setLaden(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setGebruiker(session?.user ?? null);
      if (session?.user) haalSessiesOp();
      else { setSessies([]); setLaden(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const haalSessiesOp = async () => {
    setLaden(true);
    const { data, error } = await supabase.from('sessies').select('*').order('created_at', { ascending: false });
    if (!error) setSessies(data || []);
    setLaden(false);
  };

  const voegSessieToe = (sessie) => setSessies(prev => [sessie, ...prev]);

  const uitloggen = async () => {
    await supabase.auth.signOut();
    setSessies([]);
    setScherm('passen');
  };

  const totaal = sessies.reduce((sum, s) => sum + Number(s.bedrag ?? 0), 0);
  const totaalBtw = sessies.reduce((sum, s) => sum + Number(s.btw ?? 0), 0);
  const exclBtw = totaal - totaalBtw;
  const rapportTotalen = { totaal, exclBtw, totaalBtw };

  if (!gebruiker) return <Login />;

  return (
    <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', padding: '24px 20px 100px', fontFamily: 'sans-serif', maxWidth: '390px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0 }}>Laad<span style={{ color: '#c8ff00' }}>Smart</span></h1>
          <p style={{ color: '#6db88a', fontSize: '13px', marginTop: '4px' }}>{gebruiker.email}</p>
        </div>
        <button onClick={uitloggen} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '8px 12px', color: '#6db88a', fontSize: '12px', cursor: 'pointer' }}>Uitloggen</button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #1a5c34, #0f4a25)', borderRadius: '20px', padding: '20px', marginBottom: '24px', border: '1px solid #1f6b3d' }}>
        <div style={{ fontSize: '12px', color: '#a8f0c6', textTransform: 'uppercase', letterSpacing: '1px' }}>April 2026 — Totaal</div>
        <div style={{ fontSize: '42px', fontWeight: '800', color: 'white', margin: '4px 0' }}>€{totaal.toFixed(2)}</div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #ffffff15' }}>
          <div><div style={{ fontSize: '11px', color: '#6db88a' }}>Excl. BTW</div><div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>€{exclBtw.toFixed(2)}</div></div>
          <div><div style={{ fontSize: '11px', color: '#6db88a' }}>BTW 21%</div><div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>€{totaalBtw.toFixed(2)}</div><div style={{ background: '#c8ff00', color: '#0a2e1a', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '3px' }}>DECLARABEL</div></div>
          <div><div style={{ fontSize: '11px', color: '#6db88a' }}>Sessies</div><div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{sessies.length}x</div></div>
        </div>
      </div>

      {laden && <div style={{ color: '#6db88a', textAlign: 'center', padding: '20px' }}>⏳ Laden...</div>}

      {!laden && scherm === 'passen' && (
        <>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Mijn laadpassen</div>
          {laadpassen.map(pas => (<PasKaart key={pas.id} pas={pas} />))}
        </>
      )}

      {!laden && scherm === 'toevoegen' && (
        <>
          <SessieForm onToevoegen={voegSessieToe} />
          {sessies.length > 0 && (
            <>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Recente sessies</div>
              {sessies.map((s, i) => (
                <div key={s.id ?? i} style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderLeft: `4px solid ${laadpassen.find(p => p.naam === s.pas_naam)?.kleur || '#6db88a'}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{s.pas_naam}</div>
                    <div style={{ color: '#6db88a', fontSize: '12px', marginTop: '2px' }}>{s.datum} · {s.kwh} kWh</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'white', fontWeight: '600' }}>€{Number(s.bedrag ?? 0).toFixed(2)}</div>
                    <div style={{ color: '#6db88a', fontSize: '11px' }}>BTW €{Number(s.btw ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {!laden && scherm === 'rapport' && (
        <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>📄 Maandrapport</div>
          {sessies.length === 0 ? (
            <div style={{ color: '#6db88a', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Voeg eerst sessies toe</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Totaal incl. BTW</span><span style={{ color: 'white', fontWeight: '600' }}>€{totaal.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Totaal excl. BTW</span><span style={{ color: 'white', fontWeight: '600' }}>€{exclBtw.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Terug te vorderen BTW</span><span style={{ color: '#c8ff00', fontWeight: '600' }}>€{totaalBtw.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Aantal sessies</span><span style={{ color: 'white', fontWeight: '600' }}>{sessies.length}x</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => downloadMaandrapportPdf(sessies, rapportTotalen, gebruiker?.email ?? '')}
                  style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}
                >
                  📄 Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadMaandrapportCsv(sessies, rapportTotalen, gebruiker?.email ?? '')}
                  style={{ background: 'transparent', color: '#c8ff00', border: '2px solid #c8ff00', borderRadius: '12px', padding: '12px', width: '100%', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                >
                  📊 Download CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '390px', background: '#0a2e1a', borderTop: '1px solid #1f6b3d', padding: '12px 20px 28px', display: 'flex', justifyContent: 'space-around' }}>
        {[{ id: 'passen', icon: '💳', label: 'Passen' }, { id: 'toevoegen', icon: '⚡', label: 'Toevoegen' }, { id: 'rapport', icon: '📄', label: 'Rapport' }].map(item => (
          <div key={item.id} onClick={() => setScherm(item.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: scherm === item.id ? 1 : 0.4 }}>
            <div style={{ fontSize: '22px' }}>{item.icon}</div>
            <div style={{ fontSize: '10px', color: scherm === item.id ? '#c8ff00' : '#6db88a' }}>{item.label}</div>
            {scherm === item.id && <div style={{ width: '4px', height: '4px', background: '#c8ff00', borderRadius: '50%' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;