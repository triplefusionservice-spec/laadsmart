import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { QRCodeSVG } from 'qrcode.react';
import { MfaAuthenticatorAppHint } from './components/MfaAuthenticatorAppHint';

const MFA_FRIENDLY_NAME = 'LaadSmart Authenticator';

function MfaSetup({ onKlaar, onOverslaan }) {
  /** otpauth://… voor QRCodeSVG (kort). Niet `totp.qr_code` — dat is al volledige SVG → "Data too long". */
  const [totpUri, setTotpUri] = useState('');
  /** Fallback: server-SVG als data-URL als er geen uri is */
  const [totpImgSrc, setTotpImgSrc] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [stap, setStap] = useState('laden');

  const startMfa = useCallback(async () => {
    setStap('laden');
    const { data: factorsData, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) {
      setStatus('❌ Fout: ' + listErr.message);
      setStap('fout');
      return;
    }
    const all = factorsData?.all ?? [];
    const hasVerifiedTotp = all.some((f) => f.factor_type === 'totp' && f.status === 'verified');
    if (hasVerifiedTotp) {
      onKlaar();
      return;
    }
    // Niet-afgeronde TOTP-factors verwijderen — anders: "friendly name ... already exists"
    const pendingTotp = all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified');
    for (const f of pendingTotp) {
      const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId: f.id });
      if (unErr) {
        setStatus('❌ Fout: ' + unErr.message);
        setStap('fout');
        return;
      }
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: MFA_FRIENDLY_NAME,
    });
    if (error) {
      setStatus('❌ Fout: ' + error.message);
      setStap('fout');
      return;
    }
    // Nieuwe factor staat in de JWT pas na refresh — zonder dit geeft challenge vaak "Factor not found".
    const { error: refreshErr } = await supabase.auth.refreshSession();
    if (refreshErr) {
      setStatus('❌ Sessie vernieuwen mislukt: ' + refreshErr.message);
      setStap('fout');
      return;
    }
    const totp = data.totp;
    if (totp.uri && totp.uri.startsWith('otpauth:')) {
      setTotpUri(totp.uri);
      setTotpImgSrc('');
    } else if (totp.qr_code) {
      setTotpUri('');
      const raw = totp.qr_code;
      setTotpImgSrc(
        raw.startsWith('data:')
          ? raw
          : `data:image/svg+xml;utf-8,${encodeURIComponent(raw)}`
      );
    } else {
      setStatus('❌ Geen QR-gegevens van de server ontvangen.');
      setStap('fout');
      return;
    }
    const factorIdFromEnroll = data?.id ?? data?.factor_id;
    if (!factorIdFromEnroll) {
      setStatus('❌ Geen factor-id van de server. Probeer opnieuw.');
      setStap('fout');
      return;
    }
    setFactorId(factorIdFromEnroll);
    setStap('scannen');
  }, [onKlaar]);

  useEffect(() => {
    startMfa();
  }, [startMfa]);

  const verifieerCode = async () => {
    if (code.length !== 6) { setStatus('❌ Code moet 6 cijfers zijn'); return; }
    setStatus('⏳ Bezig...');
    await supabase.auth.refreshSession().catch(() => {});
    let fid = factorId;
    if (!fid) {
      const { data: lf, error: lfErr } = await supabase.auth.mfa.listFactors();
      if (lfErr) { setStatus('❌ ' + lfErr.message); return; }
      const pending = lf?.all?.find((f) => f.factor_type === 'totp' && f.status === 'unverified');
      fid = pending?.id ?? '';
    }
    if (!fid) {
      setStatus('❌ Geen MFA-factor gevonden. Tik op «Opnieuw proberen» onderaan.');
      return;
    }
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: fid });
    if (challengeError) { setStatus('❌ ' + challengeError.message); return; }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: fid,
      challengeId: challengeData.id,
      code
    });
    if (verifyError) { setStatus('❌ Verkeerde code. Probeer opnieuw.'); return; }
    setStatus('✅ MFA ingesteld!');
    setTimeout(() => onKlaar(), 1500);
  };

  const inputStyle = {
    background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px',
    padding: '12px', color: 'white', fontSize: '20px', width: '100%',
    outline: 'none', boxSizing: 'border-box', textAlign: 'center',
    letterSpacing: '8px', fontWeight: '700',
  };

  return (
    <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', padding: '40px 24px', fontFamily: 'sans-serif', maxWidth: '390px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>
        Laad<span style={{ color: '#c8ff00' }}>Smart</span>
      </h1>
      <p style={{ color: '#6db88a', fontSize: '13px', marginBottom: '32px' }}>Extra beveiliging instellen</p>

      {stap === 'laden' && (
        <div style={{ color: '#6db88a', textAlign: 'center', padding: '40px' }}>⏳ Laden...</div>
      )}

      {stap === 'scannen' && (
        <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>🔐 Stap 1: Scan de QR code</div>
          <p style={{ fontSize: '13px', color: '#6db88a', marginBottom: '20px', lineHeight: 1.5 }}>
            <MfaAuthenticatorAppHint suffix={<> op je telefoon en scan deze QR code.</>} />
          </p>
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            {totpUri ? (
              <QRCodeSVG value={totpUri} size={180} level="M" />
            ) : totpImgSrc ? (
              <img src={totpImgSrc} alt="QR-code voor authenticator" width={180} height={180} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
            ) : null}
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>🔢 Stap 2: Voer de 6-cijferige code in</div>
          <p style={{ fontSize: '13px', color: '#6db88a', marginBottom: '10px', lineHeight: 1.5 }}>
            Na het scannen zie je een 6-cijferige code in de app. Voer die hier in.
          </p>
          <p style={{ fontSize: '11px', color: '#a8f0c6', marginBottom: '16px', lineHeight: 1.45, padding: '8px 10px', background: '#0a2e1a', borderRadius: '8px', border: '1px solid #1f6b3d' }}>
            Daarna staat <strong style={{ color: 'white' }}>2FA aan</strong> op je account. Bij elke nieuwe aanmelding (na uitloggen) volgt eerst je wachtwoord, daarna weer zo’n code.
          </p>
          <input
            type="number"
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.slice(0, 6))}
            style={inputStyle}
          />
          {status && (
            <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginTop: '12px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : '#c8ff00', textAlign: 'center' }}>
              {status}
            </div>
          )}
          <button onClick={verifieerCode} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '16px' }}>
            ✅ Bevestigen
          </button>
          <button onClick={onOverslaan} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px', width: '100%', fontSize: '14px', color: '#6db88a', cursor: 'pointer', marginTop: '10px' }}>
            Nu overslaan
          </button>
        </div>
      )}

      {stap === 'fout' && (
        <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
          <div style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '16px' }}>{status}</div>
          <button onClick={startMfa} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
            Opnieuw proberen
          </button>
        </div>
      )}
    </div>
  );
}

export default MfaSetup;