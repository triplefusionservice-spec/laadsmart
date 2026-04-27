import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';

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
  marginBottom: '12px',
};

const btnPrim = {
  background: '#c8ff00',
  color: '#0a2e1a',
  border: 'none',
  borderRadius: '12px',
  padding: '14px',
  width: '100%',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
};

const btnSec = {
  background: 'transparent',
  border: '1px solid #1f6b3d',
  borderRadius: '12px',
  padding: '12px',
  width: '100%',
  fontSize: '14px',
  color: '#6db88a',
  cursor: 'pointer',
  marginTop: '10px',
};

function WachtwoordModal({ user, mfaTotpActief, pendingAuthActionRef, onSluiten, onGelukt, onToast }) {
  const [oud, setOud] = useState('');
  const [nieuw, setNieuw] = useState('');
  const [bevestig, setBevestig] = useState('');
  const [status, setStatus] = useState('');
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    setStatus('');
    if (!oud) {
      setStatus('❌ Vul eerst je huidige wachtwoord in.');
      return;
    }
    if (!nieuw || nieuw.length < 8) {
      setStatus('❌ Nieuw wachtwoord moet minstens 8 tekens zijn.');
      return;
    }
    if (nieuw !== bevestig) {
      setStatus('❌ Nieuw wachtwoord en herhaling komen niet overeen.');
      return;
    }
    if (nieuw === oud) {
      setStatus('❌ Het nieuwe wachtwoord moet anders zijn dan het oude.');
      return;
    }
    setBezig(true);
    setStatus('⏳ Controleren...');
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oud,
    });
    if (signErr) {
      setBezig(false);
      setStatus('❌ Huidig wachtwoord is onjuist.');
      return;
    }
    if (mfaTotpActief) {
      pendingAuthActionRef.current = { type: 'password', newPassword: nieuw };
      setBezig(false);
      if (onToast) onToast('Controle ok. Vul je 2FA-code in.', 'info');
      onSluiten();
      setStatus('');
      return;
    }
    const { error: upErr } = await supabase.auth.updateUser({ password: nieuw });
    setBezig(false);
    if (upErr) {
      if (/reauth|nonce|session/i.test(upErr.message)) {
        setStatus(
          '❌ Supabase vereist extra bevestiging. Zet in het dashboard bij Auth → e-mail «Secure password change» aan of probeer het over een uur opnieuw (recente sessie). Fout: ' +
            upErr.message
        );
        return;
      }
      setStatus('❌ ' + upErr.message);
      return;
    }
    await supabase.auth.refreshSession().catch(() => {});
    onGelukt();
    onSluiten();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wachtwoord-wijzigen-titel"
    >
      <div
        style={{
          background: '#0a2e1a',
          border: '1px solid #1f6b3d',
          borderRadius: '18px',
          padding: '22px 20px',
          width: 'min(360px, 94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h2 id="wachtwoord-wijzigen-titel" style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>
          Wachtwoord wijzigen
        </h2>
        <p style={{ fontSize: '12px', color: '#6db88a', margin: '0 0 14px', lineHeight: 1.5 }}>
          Eerst je huidige wachtwoord. Daarna nieuw wachtwoord (min. 8 tekens). Met 2FA volgt een code.
        </p>
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Huidig wachtwoord</label>
        <input type="password" autoComplete="current-password" value={oud} onChange={(e) => setOud(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Nieuw wachtwoord (min. 8 tekens)</label>
        <input type="password" autoComplete="new-password" value={nieuw} onChange={(e) => setNieuw(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Nieuw wachtwoord herhalen</label>
        <input type="password" autoComplete="new-password" value={bevestig} onChange={(e) => setBevestig(e.target.value)} style={inputStyle} />
        {status ? (
          <div style={{ fontSize: '13px', color: status.includes('❌') ? '#ff9b9b' : '#c8ff00', marginBottom: '12px', lineHeight: 1.45 }}>{status}</div>
        ) : null}
        <button type="button" disabled={bezig} onClick={opslaan} style={{ ...btnPrim, opacity: bezig ? 0.7 : 1, cursor: bezig ? 'wait' : 'pointer' }}>
          {bezig ? 'Bezig…' : mfaTotpActief ? 'Controleren en door naar 2FA' : 'Wachtwoord opslaan'}
        </button>
        <button type="button" disabled={bezig} onClick={onSluiten} style={btnSec}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

function EmailModal({ user, mfaTotpActief, pendingAuthActionRef, onSluiten, onGelukt, onToast }) {
  const [oudWachtwoord, setOudWachtwoord] = useState('');
  const [nieuwEmail, setNieuwEmail] = useState('');
  const [bevestigEmail, setBevestigEmail] = useState('');
  const [inboxOk, setInboxOk] = useState(false);
  const [status, setStatus] = useState('');
  const [bezig, setBezig] = useState(false);

  const opslaan = async () => {
    setStatus('');
    if (!inboxOk) {
      setStatus('❌ Bevestig dat je toegang hebt tot je huidige e-mail om verificatie te kunnen ontvangen.');
      return;
    }
    if (!oudWachtwoord) {
      setStatus('❌ Vul je huidige wachtwoord in ter beveiliging.');
      return;
    }
    const a = nieuwEmail.trim().toLowerCase();
    const b = bevestigEmail.trim().toLowerCase();
    if (!a || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)) {
      setStatus('❌ Vul een geldig nieuw e-mailadres in.');
      return;
    }
    if (a !== b) {
      setStatus('❌ Nieuwe e-mail en herhaling komen niet overeen.');
      return;
    }
    if (a === (user.email || '').toLowerCase()) {
      setStatus('❌ Het nieuwe adres moet anders zijn dan je huidige e-mail.');
      return;
    }
    setBezig(true);
    setStatus('⏳ Controleren...');
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oudWachtwoord,
    });
    if (signErr) {
      setBezig(false);
      setStatus('❌ Wachtwoord is onjuist.');
      return;
    }
    if (mfaTotpActief) {
      pendingAuthActionRef.current = { type: 'email', newEmail: a };
      setBezig(false);
      if (onToast) onToast('Controle ok. Vul je 2FA-code in.', 'info');
      onSluiten();
      return;
    }
    const { error: upErr } = await supabase.auth.updateUser(
      { email: a },
      { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/` }
    );
    setBezig(false);
    if (upErr) {
      setStatus('❌ ' + upErr.message);
      return;
    }
    await supabase.auth.refreshSession().catch(() => {});
    onGelukt();
    onSluiten();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-wijzigen-titel"
    >
      <div
        style={{
          background: '#0a2e1a',
          border: '1px solid #1f6b3d',
          borderRadius: '18px',
          padding: '22px 20px',
          width: 'min(360px, 94vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <h2 id="email-wijzigen-titel" style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>
          E-mailadres wijzigen
        </h2>
        <p style={{ fontSize: '12px', color: '#6db88a', margin: '0 0 14px', lineHeight: 1.5 }}>
          Supabase stuurt een bevestigingslink naar je nieuwe adres. Pas na bevestiging is de wijziging definitief.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={inboxOk} onChange={(e) => setInboxOk(e.target.checked)} style={{ marginTop: '3px', accentColor: '#c8ff00', width: '18px', height: '18px', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#e8fff0', lineHeight: 1.45 }}>
            Ik heb toegang tot mijn <strong style={{ color: 'white' }}>huidige</strong> én <strong style={{ color: 'white' }}>nieuwe</strong> inbox om verificatie-e-mails te kunnen openen.
          </span>
        </label>
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Huidig wachtwoord</label>
        <input type="password" autoComplete="current-password" value={oudWachtwoord} onChange={(e) => setOudWachtwoord(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Nieuw e-mailadres</label>
        <input type="email" autoComplete="email" value={nieuwEmail} onChange={(e) => setNieuwEmail(e.target.value)} style={inputStyle} />
        <label style={{ fontSize: '12px', color: '#6db88a', fontWeight: '600' }}>Nieuw e-mailadres herhalen</label>
        <input type="email" autoComplete="email" value={bevestigEmail} onChange={(e) => setBevestigEmail(e.target.value)} style={inputStyle} />
        {status ? (
          <div style={{ fontSize: '13px', color: status.includes('❌') ? '#ff9b9b' : '#c8ff00', marginBottom: '12px', lineHeight: 1.45 }}>{status}</div>
        ) : null}
        <button type="button" disabled={bezig} onClick={opslaan} style={{ ...btnPrim, opacity: bezig ? 0.7 : 1, cursor: bezig ? 'wait' : 'pointer' }}>
          {bezig ? 'Bezig…' : mfaTotpActief ? 'Controleren en door naar 2FA' : 'Wijziging aanvragen'}
        </button>
        <button type="button" disabled={bezig} onClick={onSluiten} style={btnSec}>
          Annuleren
        </button>
      </div>
    </div>
  );
}

export function AccountScherm({ user, mfaTotpActief, pendingAuthActionRef, onOpenAccountVerwijder, onUserRefresh, onDisclaimer, onToast }) {
  const [modal, setModal] = useState(null);
  const [abonnement, setAbonnement] = useState(null);
  const [abonnementLaden, setAbonnementLaden] = useState(false);
  const [abonnementError, setAbonnementError] = useState('');
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const email = user?.email ?? '';
  const emailVerified = Boolean(user?.email_confirmed_at);
  const pendingEmail = user?.new_email;
  const idShort = user?.id ? `${user.id.slice(0, 8)}…` : '—';

  const abonnementLabel = useMemo(() => {
    const plan = abonnement?.plan || 'free';
    if (plan === 'business') return 'Business';
    if (plan === 'pro') return 'Pro';
    return 'Free';
  }, [abonnement?.plan]);

  const statusLabel = useMemo(() => {
    const s = (abonnement?.status || '').toLowerCase();
    return s || 'onbekend';
  }, [abonnement?.status]);

  const laadAbonnement = async () => {
    if (!user?.id) return;
    setAbonnementLaden(true);
    setAbonnementError('');
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan,status,current_period_end,stripe_customer_id,stripe_subscription_id,updated_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      setAbonnement(data || null);
    } catch (e) {
      setAbonnement(null);
      setAbonnementError(e?.message || 'Kon abonnement niet laden.');
    } finally {
      setAbonnementLaden(false);
    }
  };

  useEffect(() => {
    void laadAbonnement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startCheckout = async (plan) => {
    setCheckoutBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;
      if (!access_token) { if (onToast) onToast('Geen geldige sessie.', 'error'); return; }
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, access_token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) throw new Error(json?.error || 'Checkout starten mislukt.');
      window.location.href = json.url;
    } catch (e) {
      if (onToast) onToast(e?.message || 'Checkout starten mislukt.', 'error');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token;
      if (!access_token) { if (onToast) onToast('Geen geldige sessie.', 'error'); return; }
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) throw new Error(json?.error || 'Portal openen mislukt.');
      window.location.href = json.url;
    } catch (e) {
      if (onToast) onToast(e?.message || 'Portal openen mislukt.', 'error');
    } finally {
      setPortalBusy(false);
    }
  };

  return (
    <>
      <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '14px' }}>Mijn account</div>

      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '12px' }}>Gegevens</div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600' }}>E-mail</div>
          <div style={{ fontSize: '15px', color: 'white', fontWeight: '600', wordBreak: 'break-all' }}>{email || '—'}</div>
          {pendingEmail ? (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#ffcc80', lineHeight: 1.45 }}>
              In behandeling: bevestig <strong style={{ color: 'white' }}>{pendingEmail}</strong>
            </div>
          ) : null}
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600' }}>E-mail geverifieerd</div>
          <div style={{ fontSize: '14px', color: emailVerified ? '#c8ff00' : '#ff9b9b' }}>{emailVerified ? 'Ja' : 'Nee'}</div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600' }}>Gebruikers-ID</div>
          <div style={{ fontSize: '12px', color: '#a8f0c6', fontFamily: 'monospace' }}>{idShort}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600' }}>Authenticator (2FA)</div>
          <div style={{ fontSize: '14px', color: mfaTotpActief ? '#c8ff00' : '#6db88a' }}>{mfaTotpActief ? 'Actief' : 'Niet actief'}</div>
        </div>
      </div>

      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '10px' }}>Abonnement</div>
        <div style={{ color: '#6db88a', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px' }}>
          Huidig: <strong style={{ color: 'white' }}>{abonnementLabel}</strong> · status: <strong style={{ color: 'white' }}>{statusLabel}</strong>
        </div>
        {abonnement?.current_period_end ? (
          <div style={{ color: '#a8f0c6', fontSize: '12px', marginBottom: '10px' }}>
            Periode-einde: {new Date(abonnement.current_period_end).toLocaleDateString('nl-NL')}
          </div>
        ) : null}
        {abonnementError ? <div style={{ color: '#ffb3b3', fontSize: '12px', marginBottom: '10px' }}>{abonnementError}</div> : null}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" disabled={checkoutBusy} onClick={() => startCheckout('pro')} style={{ ...btnPrim, width: 'auto', padding: '12px 14px', fontSize: '13px', opacity: checkoutBusy ? 0.7 : 1 }}>
            {checkoutBusy ? 'Bezig…' : 'Upgrade: Pro'}
          </button>
          <button type="button" disabled={checkoutBusy} onClick={() => startCheckout('business')} style={{ ...btnPrim, width: 'auto', padding: '12px 14px', fontSize: '13px', opacity: checkoutBusy ? 0.7 : 1 }}>
            {checkoutBusy ? 'Bezig…' : 'Upgrade: Business'}
          </button>
          <button type="button" disabled={portalBusy} onClick={openPortal} style={{ ...btnSec, width: 'auto', marginTop: 0, padding: '12px 14px', fontSize: '13px', opacity: portalBusy ? 0.7 : 1 }}>
            {portalBusy ? 'Openen…' : 'Beheer in Stripe'}
          </button>
          <button type="button" disabled={abonnementLaden} onClick={laadAbonnement} style={{ ...btnSec, width: 'auto', marginTop: 0, padding: '12px 14px', fontSize: '13px', opacity: abonnementLaden ? 0.7 : 1 }}>
            {abonnementLaden ? 'Laden…' : 'Ververs status'}
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#6db88a', lineHeight: 1.4 }}>
          Status wordt bijgewerkt via Stripe webhooks. Na betaling kan dit 10–30 seconden duren.
        </div>
      </div>

      <button type="button" onClick={() => setModal('wachtwoord')} style={{ ...btnPrim, marginBottom: '10px' }}>
        Wachtwoord wijzigen
      </button>
      <button type="button" onClick={() => setModal('email')} style={{ ...btnPrim, background: '#1a5c34', color: 'white', border: '1px solid #2a8f52' }}>
        E-mailadres wijzigen
      </button>

      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #1f6b3d' }}>
        <button type="button" onClick={onOpenAccountVerwijder} style={{ ...btnSec, color: '#ff9b9b', borderColor: '#5a2a2a', marginTop: 0 }}>
          Account verwijderen…
        </button>
      </div>

      <div onClick={onDisclaimer} style={{ color: '#6db88a', fontSize: '11px', textAlign: 'center', marginTop: '24px', marginBottom: '24px', cursor: 'pointer', textDecoration: 'underline' }}>
        Algemene Voorwaarden & Privacyverklaring
      </div>

      {modal === 'wachtwoord' && (
        <WachtwoordModal
          user={user}
          mfaTotpActief={mfaTotpActief}
          pendingAuthActionRef={pendingAuthActionRef}
          onSluiten={() => setModal(null)}
          onGelukt={async () => {
            if (onToast) onToast('Wachtwoord gewijzigd.', 'info');
            await onUserRefresh();
          }}
          onToast={onToast}
        />
      )}
      {modal === 'email' && (
        <EmailModal
          user={user}
          mfaTotpActief={mfaTotpActief}
          pendingAuthActionRef={pendingAuthActionRef}
          onSluiten={() => setModal(null)}
          onGelukt={async () => {
            if (onToast) onToast('Controleer je inbox voor bevestiging.', 'info');
            await onUserRefresh();
          }}
          onToast={onToast}
        />
      )}
    </>
  );
}
