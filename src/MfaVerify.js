import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { MfaAuthenticatorAppHint } from './components/MfaAuthenticatorAppHint';

function MfaVerify({ onVerified, onUitloggen }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase.auth.refreshSession().catch(() => {});
  }, []);

  const verifieer = async () => {
    if (code.length !== 6) { setStatus('❌ Code moet 6 cijfers zijn'); return; }
    setStatus('⏳ Bezig...');
    await supabase.auth.refreshSession().catch(() => {});
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) { setStatus('❌ ' + factorsError.message); return; }
    const totpFactor =
      factorsData?.totp?.[0] ??
      factorsData?.all?.find((f) => f.factor_type === 'totp' && f.status === 'verified');
    if (!totpFactor) {
      setStatus('❌ Geen geverifieerde authenticator gevonden. Uitloggen en opnieuw inloggen, of MFA opnieuw instellen.');
      return;
    }
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeError) { setStatus('❌ ' + challengeError.message); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: totpFactor.id,
      challengeId: challengeData.id,
      code
    });
    if (verifyError) { setStatus('❌ Verkeerde code. Probeer opnieuw.'); setCode(''); return; }
    setStatus('✅ Ingelogd!');
    setTimeout(() => onVerified(), 500);
  };

  return (
    <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', padding: '60px 24px', fontFamily: 'sans-serif', maxWidth: '390px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>
        Laad<span style={{ color: '#c8ff00' }}>Smart</span>
      </h1>
      <p style={{ color: '#6db88a', fontSize: '13px', marginBottom: '40px' }}>Verificatie vereist</p>

      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>🔐 Voer je authenticator code in</div>
        <p style={{ fontSize: '13px', color: '#6db88a', marginBottom: '12px', lineHeight: 1.5 }}>
          <MfaAuthenticatorAppHint suffix={<> en voer de 6-cijferige code in voor LaadSmart.</>} />
        </p>
        <p style={{ fontSize: '12px', color: '#a8f0c6', marginBottom: '20px', lineHeight: 1.5, padding: '10px 12px', background: '#0a2e1a', borderRadius: '10px', border: '1px solid #1f6b3d' }}>
          Dit is de <strong style={{ color: 'white' }}>tweede stap</strong> na je wachtwoord. Bij <strong style={{ color: 'white' }}>elke nieuwe aanmelding</strong> (na uitloggen of op een ander apparaat) vragen we opnieuw om deze code zolang 2FA op je account staat.
        </p>
        <input
          type="number"
          placeholder="000000"
          value={code}
          onChange={e => setCode(e.target.value.slice(0, 6))}
          onKeyDown={e => e.key === 'Enter' && verifieer()}
          autoFocus
          style={{
            background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px',
            padding: '16px', color: 'white', fontSize: '28px', width: '100%',
            outline: 'none', boxSizing: 'border-box', textAlign: 'center',
            letterSpacing: '12px', fontWeight: '700',
          }}
        />
        {status && (
          <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : '#c8ff00', textAlign: 'center' }}>
            {status}
          </div>
        )}
        <button onClick={verifieer} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' }}>
          Bevestigen
        </button>
        <button onClick={onUitloggen} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px', width: '100%', fontSize: '14px', color: '#6db88a', cursor: 'pointer', marginTop: '10px' }}>
          Uitloggen
        </button>
      </div>
    </div>
  );
}

export default MfaVerify;