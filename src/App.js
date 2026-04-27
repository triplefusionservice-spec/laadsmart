import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabase';
import PasKaart from './components/PasKaart';
import SessieForm from './components/SessieForm';
import ImportModal from './components/ImportModal';
import LaadpasToevoegenModal from './components/LaadpasToevoegenModal';
import MfaSetup from './MfaSetup';
import MfaVerify from './MfaVerify';
import { AccountScherm } from './components/AccountScherm';
import HelpAiModal from './components/HelpAiModal';
import ConfirmModal from './components/ConfirmModal';
import GrafiekKosten from './components/GrafiekKosten';
import { downloadMaandrapportCsv, downloadMaandrapportPdf } from './utils/maandrapportExport';
import {
  getMergedPasses,
  movePassToTrash,
  getTrashPasses,
  restoreTrashItem,
  purgeTrashItem,
  setPassOverride,
  sortPassesByVolgorde,
  savePassOrder,
  loadMijnLaadpassenIngeklapt,
  saveMijnLaadpassenIngeklapt,
  loadPassenTabBlokVolgorde,
  savePassenTabBlokVolgorde,
  reorderPassenTabBlokken,
} from './utils/laadpassenOpslag';
import { loadVoorbladResetPassen, saveVoorbladResetPassen } from './utils/voorbladResetOpslag';
import { loadAdministratieNaam, saveAdministratieNaam } from './utils/administratieNaamOpslag';
import { filterSessies, formatRapportPeriode, eersteEnLaatsteDagVanMaand, formatDatumNlIso } from './utils/sessieFilters';
import {
  clearLaadsmartLocalStorage,
  deleteCurrentUserAuthAccount,
  deleteUserSessies,
} from './utils/accountDeletion';
import { berekenCo2EnBomen, CO2_KG_PER_BOOM_PER_JAAR, CO2_KG_PER_KWH_INDICATIEF } from './utils/co2Bomen';
import { kleurVoorPasNaam } from './data/laadpasAanbiedersCatalogus';

function mfaTotpSkippedStorageKey(userId) {
  return `laadsmart_mfa_totp_skipped_${userId}`;
}

function Disclaimer({ onTerug }) {
  return (
    <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', padding: '24px 20px', fontFamily: 'sans-serif', maxWidth: '390px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div onClick={onTerug} style={{ color: '#6db88a', cursor: 'pointer', fontSize: '18px' }}>←</div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: 0 }}>Juridische informatie</h1>
      </div>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#c8ff00', marginBottom: '12px' }}>📋 Algemene Voorwaarden</div>
        <div style={{ fontSize: '12px', color: '#a8f0c6', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '10px', color: '#6db88a', fontSize: '11px' }}>Versie 1.0 — april 2026</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 1 — Definities</strong><br />1.1 LaadSmart: de webapplicatie ontwikkeld en beheerd door TripleFusionService.<br />1.2 TripleFusionService: de onderneming die LaadSmart heeft ontwikkeld en exploiteert, gevestigd in Nederland.<br />1.3 Gebruiker: iedere natuurlijke of rechtspersoon die een account aanmaakt en gebruik maakt van LaadSmart.<br />1.4 Dienst: het bijhouden en inzichtelijk maken van laadkosten voor elektrische voertuigen, inclusief BTW-berekeningen en rapportages.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 2 — Toepasselijkheid</strong><br />2.1 Deze algemene voorwaarden zijn van toepassing op alle gebruik van LaadSmart.<br />2.2 Door een account aan te maken gaat de gebruiker akkoord met deze voorwaarden.<br />2.3 TripleFusionService behoudt het recht deze voorwaarden te wijzigen. Gewijzigde voorwaarden worden minimaal 30 dagen van tevoren via email aangekondigd.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 3 — De dienst</strong><br />3.1 LaadSmart biedt gebruikers de mogelijkheid laadsessies bij te houden, kosten te overzien en BTW-rapportages te genereren.<br />3.2 LaadSmart is een hulpmiddel en vervangt geen officieel boekhoudpakket of fiscaal advies.<br />3.3 TripleFusionService streeft naar een zo hoog mogelijke nauwkeurigheid van BTW-berekeningen maar garandeert dit niet.<br />3.4 Gebruikers zijn zelf verantwoordelijk voor de juistheid van ingevoerde gegevens.<br />3.5 TripleFusionService behoudt het recht de dienst te wijzigen, uit te breiden of te beëindigen.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 4 — Account en toegang</strong><br />4.1 De gebruiker is verantwoordelijk voor het geheimhouden van zijn inloggegevens.<br />4.2 De gebruiker mag zijn account niet overdragen aan derden.<br />4.3 TripleFusionService mag accounts blokkeren bij misbruik of schending van deze voorwaarden.<br />4.4 De gebruiker kan zijn account op elk moment zelf verwijderen in de app (met bevestiging en wachtwoord) of een verzoek sturen naar privacy@laadsmart.app. Na verwijdering worden persoonsgegevens binnen 30 dagen gewist, conform de privacyverklaring.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 5 — Aansprakelijkheid</strong><br />5.1 TripleFusionService is niet aansprakelijk voor onjuiste BTW-berekeningen of fiscale gevolgen.<br />5.2 TripleFusionService is niet aansprakelijk voor dataverlies door technische storingen of overmacht.<br />5.3 TripleFusionService is niet aansprakelijk voor indirecte schade, gederfde winst of gevolgschade.<br />5.4 De totale aansprakelijkheid is beperkt tot het door de gebruiker betaalde bedrag in de drie maanden voorafgaand aan de schade.<br />5.5 Raadpleeg altijd een gecertificeerd accountant voor officiële belastingaangiften.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 6 — Beschikbaarheid</strong><br />6.1 TripleFusionService streeft naar maximale beschikbaarheid maar garandeert geen ononderbroken beschikbaarheid.<br />6.2 Gepland onderhoud wordt zo mogelijk vooraf aangekondigd via email.<br />6.3 TripleFusionService is niet aansprakelijk voor schade als gevolg van onbeschikbaarheid.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 7 — Intellectueel eigendom</strong><br />7.1 Alle rechten op LaadSmart berusten bij TripleFusionService.<br />7.2 Het is niet toegestaan LaadSmart te kopiëren of te distribueren zonder schriftelijke toestemming.<br />7.3 Gebruikers behouden alle rechten op hun eigen ingevoerde data.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Artikel 8 — Abonnementen en betaling</strong><br />8.1 LaadSmart biedt zowel een gratis als een betaald abonnement aan.<br />8.2 Prijzen worden duidelijk gecommuniceerd voor aanvang van een betaald abonnement.<br />8.3 Betaalde abonnementen worden automatisch verlengd tenzij tijdig opgezegd.<br />8.4 Opzegging dient minimaal 1 maand voor de verlengingsdatum via info@laadsmart.app.</p>
          <p style={{ marginBottom: '0' }}><strong style={{ color: 'white' }}>Artikel 9 — Toepasselijk recht</strong><br />9.1 Op deze voorwaarden is uitsluitend Nederlands recht van toepassing.<br />9.2 Geschillen worden bij voorkeur in onderling overleg opgelost.<br />9.3 De bevoegde rechtbank in Nederland is exclusief bevoegd.<br />9.4 Klachten via info@laadsmart.app.</p>
        </div>
      </div>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#c8ff00', marginBottom: '12px' }}>🔒 Privacyverklaring (AVG/GDPR)</div>
        <div style={{ fontSize: '12px', color: '#a8f0c6', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '10px', color: '#6db88a', fontSize: '11px' }}>Versie 1.0 — april 2026</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Verwerkingsverantwoordelijke</strong><br />TripleFusionService, Nederland<br />Email: privacy@laadsmart.app<br />Applicatie: LaadSmart (laadsmart.vercel.app)</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Welke persoonsgegevens verwerken wij?</strong><br />• E-mailadres (voor inloggen en communicatie)<br />• Laadsessies: datum, kWh, kosten, laadpas naam<br />• Technische gegevens: IP-adres, browsertype (via Supabase Auth)<br />• Geen locatiedata, geen betaalgegevens, geen BSN</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Rechtsgrond voor verwerking</strong><br />• Uitvoering overeenkomst (art. 6 lid 1b AVG)<br />• Gerechtvaardigd belang (art. 6 lid 1f AVG)<br />• Toestemming (art. 6 lid 1a AVG)</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Waarvoor gebruiken wij uw data?</strong><br />• Tonen van uw persoonlijk laadkosten overzicht<br />• Genereren van BTW-rapportages<br />• Technisch beheer en beveiliging<br />• Wij verkopen uw data nooit aan derden<br />• Geen gebruik voor advertenties</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Bewaartermijnen</strong><br />• Accountgegevens: zolang account actief is<br />• Laadsessies: zolang account actief is<br />• Na verwijdering: alle data binnen 30 dagen weg<br />• Technische logs: maximaal 90 dagen</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Delen met derden</strong><br />• Supabase (database en authenticatie) — EU-dataopslag<br />• Vercel (hosting) — EU-datacenters<br />• Geen andere derde partijen</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Uw rechten onder de AVG</strong><br />• Inzage (art. 15) · Rectificatie (art. 16)<br />• Verwijdering (art. 17) · Beperking (art. 18)<br />• Dataportabiliteit (art. 20) · Bezwaar (art. 21)<br /><br />Verzoeken via privacy@laadsmart.app. Reactie binnen 30 dagen.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Klachten</strong><br />U kunt een klacht indienen bij de Autoriteit Persoonsgegevens via autoriteitpersoonsgegevens.nl</p>
          <p style={{ marginBottom: '0' }}><strong style={{ color: 'white' }}>Beveiliging</strong><br />AES-256 encryptie, SSL verbindingen en tweefactorauthenticatie op infrastructuurniveau via Supabase.</p>
        </div>
      </div>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#c8ff00', marginBottom: '12px' }}>🍪 Cookieverklaring</div>
        <div style={{ fontSize: '12px', color: '#a8f0c6', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Functionele cookies alleen</strong><br />LaadSmart gebruikt uitsluitend functionele cookies die strikt noodzakelijk zijn.</p>
          <p style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Sessiecookie (Supabase Auth)</strong><br />Doel: ingelogd blijven<br />Bewaartermijn: sessieduur of maximaal 7 dagen<br />Derde partij: Supabase</p>
          <p style={{ marginBottom: '0' }}><strong style={{ color: 'white' }}>Geen gebruik van:</strong><br />• Tracking cookies<br />• Advertentie cookies<br />• Google Analytics<br />• Social media cookies</p>
        </div>
      </div>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#c8ff00', marginBottom: '12px' }}>📬 Contact</div>
        <div style={{ fontSize: '12px', color: '#a8f0c6', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '6px' }}><strong style={{ color: 'white' }}>TripleFusionService</strong></p>
          <p style={{ marginBottom: '6px' }}>Ontwikkelaar van LaadSmart</p>
          <p style={{ marginBottom: '6px' }}>Algemeen: info@laadsmart.app</p>
          <p style={{ marginBottom: '6px' }}>Privacy: privacy@laadsmart.app</p>
          <p style={{ marginBottom: '0' }}>Website: laadsmart.vercel.app</p>
        </div>
      </div>
      <button onClick={onTerug} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px' }}>
        ← Terug naar app
      </button>
    </div>
  );
}

function Login({ onDisclaimer }) {
  const [email, setEmail] = useState('');
  const [wachtwoord, setWachtwoord] = useState('');
  const [isRegistreren, setIsRegistreren] = useState(false);
  const [akkoord, setAkkoord] = useState(false);
  const [status, setStatus] = useState('');

  const stuurWachtwoordReset = async () => {
    const trimmed = email.trim();
    if (!trimmed) { setStatus('❌ Vul je e-mailadres in om een resetlink te ontvangen.'); return; }
    setStatus('⏳ Resetlink versturen...');
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: `${window.location.origin}/` });
    if (error) setStatus('❌ ' + error.message);
    else setStatus('✅ Als dit adres bij ons bekend is, ontvang je een e-mail om je wachtwoord te herstellen.');
  };

  const inputStyle = { background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };

  const handleSubmit = async () => {
    if (isRegistreren && !akkoord) { setStatus('❌ Ga akkoord met de voorwaarden'); return; }
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
        {isRegistreren && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
            <input type="checkbox" checked={akkoord} onChange={e => setAkkoord(e.target.checked)} style={{ marginTop: '2px', accentColor: '#c8ff00', width: '16px', height: '16px', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#6db88a', lineHeight: '1.5' }}>
              Ik ga akkoord met de{' '}
              <span onClick={onDisclaimer} style={{ color: '#c8ff00', cursor: 'pointer', textDecoration: 'underline' }}>Algemene Voorwaarden en Privacyverklaring</span>{' '}van TripleFusionService
            </div>
          </div>
        )}
        {status && <div style={{ background: '#0a2e1a', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '14px', color: status.includes('❌') ? '#ff6b6b' : '#c8ff00', textAlign: 'center' }}>{status}</div>}
        <button onClick={handleSubmit} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginBottom: '12px' }}>
          {isRegistreren ? 'Account aanmaken' : 'Inloggen'}
        </button>
        <div onClick={() => setIsRegistreren(!isRegistreren)} style={{ color: '#6db88a', fontSize: '13px', textAlign: 'center', cursor: 'pointer' }}>
          {isRegistreren ? 'Al een account? Inloggen' : 'Nog geen account? Registreren'}
        </div>
        {!isRegistreren && (
          <button type="button" onClick={stuurWachtwoordReset} style={{ marginTop: '16px', width: '100%', background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: '#6db88a', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Wachtwoord vergeten?
          </button>
        )}
      </div>
    </div>
  );
}

function AccountVerwijderModal({ open, userEmail, userId, onSluiten, onVerwijderd, onToast }) {
  const [toestemming, setToestemming] = useState(false);
  const [wachtwoord, setWachtwoord] = useState('');
  const [status, setStatus] = useState('');
  const [bezig, setBezig] = useState(false);

  useEffect(() => {
    if (!open) return;
    setToestemming(false);
    setWachtwoord('');
    setStatus('');
    setBezig(false);
  }, [open]);

  if (!open) return null;

  const stuurReset = async () => {
    if (!userEmail) return;
    setStatus('⏳ Resetlink versturen...');
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, { redirectTo: `${window.location.origin}/` });
    if (error) setStatus('❌ ' + error.message);
    else setStatus('✅ Check je e-mail voor een link om je wachtwoord te herstellen.');
  };

  const definitiefVerwijderen = async () => {
    if (!toestemming) { setStatus('❌ Vink de bevestiging aan om door te gaan.'); return; }
    if (!wachtwoord) { setStatus('❌ Vul je wachtwoord in om te bevestigen dat jij dit bent.'); return; }
    setBezig(true);
    setStatus('⏳ Controleren en verwijderen...');
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email: userEmail, password: wachtwoord });
    if (loginErr) { setBezig(false); setStatus('❌ Wachtwoord klopt niet.'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setBezig(false); setStatus('❌ Geen geldige sessie.'); return; }
    const { error: sessieErr } = await deleteUserSessies(supabase, userId);
    try {
      await deleteCurrentUserAuthAccount(session.access_token);
    } catch (e) {
      setBezig(false);
      setStatus('❌ Account verwijderen mislukt: ' + (e?.message || String(e)));
      return;
    }
    clearLaadsmartLocalStorage();
    await supabase.auth.signOut();
    setBezig(false);
    if (sessieErr) {
      if (onToast) onToast('Account verwijderd. Sessies niet automatisch gewist—mail privacy@laadsmart.app.', 'error');
    } else {
      if (onToast) onToast('Account en data verwijderd. Je bent uitgelogd.', 'info');
    }
    onVerwijderd();
  };

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' };
  const modalStyle = { background: '#0a2e1a', border: '1px solid #5a2a2a', borderRadius: '18px', padding: '22px 20px 20px', width: 'min(360px, 94vw)', maxHeight: 'min(88vh, 640px)', overflowY: 'auto', boxSizing: 'border-box' };
  const inputStyle = { background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '14px', width: '100%', outline: 'none', boxSizing: 'border-box', marginBottom: '12px' };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={modalStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ff9b9b', margin: '0 0 10px' }}>Account verwijderen</h2>
        <p style={{ fontSize: '13px', color: '#a8f0c6', lineHeight: 1.55, margin: '0 0 14px' }}>
          Je vraagt hier het <strong style={{ color: 'white' }}>definitief verwijderen</strong> van je LaadSmart-account. Daarna vul je je wachtwoord in en tik je op Verwijderen. Resterende administratie bij hosting/auth kan tot <strong style={{ color: 'white' }}>30 dagen</strong> in logs voorkomen.
        </p>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}>
          <input type="checkbox" checked={toestemming} onChange={(e) => setToestemming(e.target.checked)} style={{ marginTop: '3px', accentColor: '#c8ff00', width: '18px', height: '18px', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#e8fff0', lineHeight: 1.5 }}>
            Ik geef uitdrukkelijk toestemming om mijn account en alle gekoppelde data te verwijderen. Ik weet dat dit niet ongedaan kan worden gemaakt.
          </span>
        </label>
        <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Wachtwoord ter bevestiging</label>
        <input type="password" autoComplete="current-password" placeholder="Je huidige wachtwoord" value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} style={inputStyle} />
        <button type="button" onClick={stuurReset} style={{ width: '100%', marginBottom: '12px', background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '10px', color: '#c8ff00', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          Wachtwoord niet meer weten? Reset per e-mail
        </button>
        {status && (
          <div style={{ background: '#0f3d22', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px', color: status.includes('❌') ? '#ff9b9b' : '#c8ff00', lineHeight: 1.45 }}>{status}</div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" onClick={onSluiten} disabled={bezig} style={{ flex: 1, background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px', color: '#6db88a', fontSize: '14px', fontWeight: '600', cursor: bezig ? 'not-allowed' : 'pointer' }}>Annuleren</button>
          <button type="button" onClick={definitiefVerwijderen} disabled={bezig} style={{ flex: 1, background: '#5a1a1a', border: '1px solid #ff6b6b', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: bezig ? 'not-allowed' : 'pointer' }}>
            {bezig ? '…' : 'Verwijderen'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputKlein = {
  background: '#0a2e1a',
  border: '1px solid #1f6b3d',
  borderRadius: '10px',
  padding: '12px',
  color: 'white',
  fontSize: '15px',
  width: '100%',
  boxSizing: 'border-box',
};

function App() {
  const [sessies, setSessies] = useState([]);
  const [scherm, setScherm] = useState('passen');
  const [laden, setLaden] = useState(true);
  const [gebruiker, setGebruiker] = useState(null);
  const [mfaStatus, setMfaStatus] = useState('laden');
  const [mfaTotpActief, setMfaTotpActief] = useState(false);
  const [toonImport, setToonImport] = useState(false);
  const [toonLaadpasForm, setToonLaadpasForm] = useState(false);
  const [toonDisclaimer, setToonDisclaimer] = useState(false);
  const [toonAccountVerwijder, setToonAccountVerwijder] = useState(false);
  const [toonHelpAi, setToonHelpAi] = useState(false);
  const [laadpassenLijst, setLaadpassenLijst] = useState(() => sortPassesByVolgorde(getMergedPasses()));
  const [mijnLaadpassenIngeklapt, setMijnLaadpassenIngeklapt] = useState(() => loadMijnLaadpassenIngeklapt());
  const [dragPasId, setDragPasId] = useState(null);
  const [dragOverPasId, setDragOverPasId] = useState(null);
  const [passenTabBlokVolgorde, setPassenTabBlokVolgorde] = useState(() => loadPassenTabBlokVolgorde());
  const [dragBlokKey, setDragBlokKey] = useState(null);
  const [dragOverBlokKey, setDragOverBlokKey] = useState(null);
  const [voorbladResetPassen, setVoorbladResetPassen] = useState(() => loadVoorbladResetPassen());
  const [toonReorderInfo, setToonReorderInfo] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolveRef = useRef(null);
  const [rapportMode, setRapportMode] = useState(() => {
    try {
      const v = localStorage.getItem('laadsmart_rapport_mode');
      return v === 'zakelijk' ? 'zakelijk' : 'prive';
    } catch {
      return 'prive';
    }
  });

  const maand0 = eersteEnLaatsteDagVanMaand();
  const [rapportVan, setRapportVan] = useState(maand0.van);
  const [rapportTot, setRapportTot] = useState(maand0.tot);
  const [rapportPasSelectie, setRapportPasSelectie] = useState(() => new Set(getMergedPasses().map((p) => p.naam)));
  const [administratieNaam, setAdministratieNaam] = useState(() => loadAdministratieNaam());
  const [prullenbakVersie, setPrullenbakVersie] = useState(0);
  const [prullenbakOpen, setPrullenbakOpen] = useState(false);
  const pendingAuthActionRef = useRef(null);

  const verversLaadpassen = () => setLaadpassenLijst(sortPassesByVolgorde(getMergedPasses()));
  const bumpPrullenbak = () => setPrullenbakVersie((v) => v + 1);
  const trashLijst = useMemo(() => {
    void prullenbakVersie;
    return getTrashPasses();
  }, [prullenbakVersie]);

  useEffect(() => { saveAdministratieNaam(administratieNaam); }, [administratieNaam]);
  useEffect(() => { saveMijnLaadpassenIngeklapt(mijnLaadpassenIngeklapt); }, [mijnLaadpassenIngeklapt]);
  useEffect(() => {
    try {
      localStorage.setItem('laadsmart_rapport_mode', rapportMode);
    } catch {
      // ignore
    }
  }, [rapportMode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setRapportPasSelectie((prev) => {
      const namen = new Set(laadpassenLijst.map((p) => p.naam));
      const next = new Set();
      for (const n of namen) { if (prev.has(n)) next.add(n); }
      if (next.size === 0) namen.forEach((n) => next.add(n));
      return next;
    });
  }, [laadpassenLijst]);

  const statsPerNaam = useMemo(() => {
    const m = {};
    for (const s of sessies) {
      const n = s.pas_naam || '?';
      if (!m[n]) m[n] = { sessies: 0, bedrag: 0, btw: 0 };
      m[n].sessies += 1;
      m[n].bedrag += Number(s.bedrag ?? 0);
      m[n].btw += Number(s.btw ?? 0);
    }
    return m;
  }, [sessies]);

  const totaalKwhOpgeladen = useMemo(
    () => sessies.reduce((sum, s) => sum + Number(s.kwh ?? 0), 0),
    [sessies]
  );
  const co2Bomen = useMemo(() => berekenCo2EnBomen(totaalKwhOpgeladen), [totaalKwhOpgeladen]);

  const sessiesGefilterd = useMemo(
    () => filterSessies(sessies, rapportVan, rapportTot, rapportPasSelectie),
    [sessies, rapportVan, rapportTot, rapportPasSelectie]
  );

  const totalenPerPas = useMemo(() => {
    const m = {};
    for (const s of sessiesGefilterd) {
      const n = s.pas_naam || '?';
      if (!m[n]) m[n] = { sessies: 0, bedrag: 0, btw: 0 };
      m[n].sessies += 1;
      m[n].bedrag += Number(s.bedrag ?? 0);
      m[n].btw += Number(s.btw ?? 0);
    }
    return m;
  }, [sessiesGefilterd]);

  const totaal = sessiesGefilterd.reduce((sum, s) => sum + Number(s.bedrag ?? 0), 0);
  const totaalBtw = sessiesGefilterd.reduce((sum, s) => sum + Number(s.btw ?? 0), 0);
  const exclBtw = totaal - totaalBtw;
  const rapportTotalen = { totaal, exclBtw, totaalBtw };
  const periodeLabel = formatRapportPeriode(rapportVan, rapportTot);

  const pasnummerByNaam = useMemo(
    () => Object.fromEntries(laadpassenLijst.map((p) => [p.naam, (p.pasnummer && String(p.pasnummer).trim()) || ''])),
    [laadpassenLijst]
  );

  const exportMeta = useMemo(
    () => ({
      email: gebruiker?.email ?? '',
      administratieNaam: administratieNaam.trim(),
      van: rapportVan,
      tot: rapportTot,
      periodeLabel,
      geselecteerdePassen: [...rapportPasSelectie].sort((a, b) => a.localeCompare(b, 'nl')),
      totalenPerPas,
      pasnummerByNaam,
    }),
    [gebruiker, administratieNaam, rapportVan, rapportTot, periodeLabel, rapportPasSelectie, totalenPerPas, pasnummerByNaam]
  );

  const checkMfa = async (user) => {
    if (!user) {
      setGebruiker(null);
      setMfaTotpActief(false);
      setMfaStatus('niet_ingelogd');
      setLaden(false);
      return;
    }
    setGebruiker(user);
    try {
      const [{ data: aal }, { data: factorsData }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);
      const all = factorsData?.all ?? [];
      const hasVerifiedTotp = all.some((f) => f.factor_type === 'totp' && f.status === 'verified');
      setMfaTotpActief(hasVerifiedTotp);
      if (hasVerifiedTotp && aal?.currentLevel !== 'aal2' && aal?.nextLevel === 'aal2') {
        setMfaStatus('verificatie_nodig');
        setLaden(false);
        return;
      }
      if (!hasVerifiedTotp) {
        try {
          if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(mfaTotpSkippedStorageKey(user.id)) === '1') {
            setMfaStatus('klaar');
            haalSessiesOp();
            return;
          }
        } catch { }
        setMfaStatus('setup_nodig');
        setLaden(false);
        return;
      }
      setMfaStatus('klaar');
      haalSessiesOp();
    } catch {
      setMfaTotpActief(false);
      setMfaStatus('klaar');
      haalSessiesOp();
    }
  };

  const refreshGebruikerUitAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setGebruiker(user);
      const { data: fd } = await supabase.auth.mfa.listFactors();
      const hasV = (fd?.all ?? []).some((f) => f.factor_type === 'totp' && f.status === 'verified');
      setMfaTotpActief(hasV);
    }
  };

  const uitvoerPendingAuthNaMfa = async () => {
    const p = pendingAuthActionRef.current;
    pendingAuthActionRef.current = null;
    if (!p) return;
    if (p.type === 'password') {
      const { error } = await supabase.auth.updateUser({ password: p.newPassword });
      if (error) showToast('Wachtwoord wijzigen mislukt: ' + error.message, 'error');
      else showToast('Wachtwoord gewijzigd.', 'info');
    } else if (p.type === 'email') {
      const { error } = await supabase.auth.updateUser(
        { email: p.newEmail },
        { emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/` }
      );
      if (error) showToast('E-mail wijzigen mislukt: ' + error.message, 'error');
      else showToast('Bevestig je nieuwe e-mailadres via je inbox.', 'info');
    }
    await supabase.auth.refreshSession().catch(() => { });
    await refreshGebruikerUitAuth();
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) { setGebruiker(null); setMfaTotpActief(false); setMfaStatus('niet_ingelogd'); setLaden(false); return; }
      checkMfa(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setGebruiker(null); setSessies([]); setMfaTotpActief(false); setMfaStatus('niet_ingelogd'); setLaden(false); return; }
      checkMfa(session.user);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const haalSessiesOp = async () => {
    setLaden(true);
    const { data, error } = await supabase.from('sessies').select('*').order('created_at', { ascending: false });
    if (!error) setSessies(data || []);
    setLaden(false);
  };

  const voegSessieToe = (sessie) => setSessies((prev) => [sessie, ...prev]);

  const resetOfHerstelVoorblad = async (pas) => {
    if (voorbladResetPassen.has(pas.naam)) {
      setVoorbladResetPassen((prev) => { const n = new Set(prev); n.delete(pas.naam); saveVoorbladResetPassen(n); return n; });
      return;
    }
    const ok = await vraagConfirm({
      title: 'Overzicht legen?',
      message: `Overzicht voor “${pas.naam}” legen op dit scherm?\n\nSessies blijven bewaard (Rapport).`,
      confirmLabel: 'Leegmaken',
      danger: false,
    });
    if (!ok) return;
    setVoorbladResetPassen((prev) => { const n = new Set(prev); n.add(pas.naam); saveVoorbladResetPassen(n); return n; });
    showToast('Overzicht geleegd.', 'info');
  };

  const bewaarPasDetails = (id, patch) => { setPassOverride(id, patch); verversLaadpassen(); };

  const zetPasInPrullenbak = async (pas) => {
    const ok = await vraagConfirm({
      title: 'Naar prullenbak?',
      message: `“${pas.naam}” naar de prullenbak?\n\nLaadsessies blijven bewaard.`,
      confirmLabel: 'Naar prullenbak',
      danger: false,
    });
    if (!ok) return;
    movePassToTrash(pas);
    verversLaadpassen();
    bumpPrullenbak();
    showToast('Naar prullenbak verplaatst.', 'info');
  };

  const herstelUitPrullenbak = (trashId) => {
    const { ok, error } = restoreTrashItem(trashId);
    if (!ok) { showToast(error || 'Kon niet herstellen.', 'error'); return; }
    verversLaadpassen();
    bumpPrullenbak();
  };

  const wisDefinitiefUitPrullenbak = async (trashId) => {
    const ok = await vraagConfirm({
      title: 'Definitief verwijderen?',
      message: 'Deze actie kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    purgeTrashItem(trashId);
    verversLaadpassen();
    bumpPrullenbak();
    showToast('Definitief verwijderd.', 'info');
  };

  const herzetPasVolgorde = (draggedId, targetId) => {
    if (draggedId === targetId) return;
    const ids = laadpassenLijst.map((p) => p.id);
    if (!ids.includes(draggedId) || !ids.includes(targetId)) return;
    const next = ids.filter((id) => id !== draggedId);
    const ti = next.indexOf(targetId);
    if (ti < 0) return;
    next.splice(ti, 0, draggedId);
    savePassOrder(next);
    setLaadpassenLijst(sortPassesByVolgorde(getMergedPasses()));
  };

  const herzetBlokVolgorde = (dragKey, targetKey) => {
    const next = reorderPassenTabBlokken(passenTabBlokVolgorde, dragKey, targetKey);
    savePassenTabBlokVolgorde(next);
    setPassenTabBlokVolgorde(next);
  };

  const verplaatsBlok = (blokKey, delta) => {
    const idx = passenTabBlokVolgorde.indexOf(blokKey);
    if (idx < 0) return;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= passenTabBlokVolgorde.length) return;
    const next = passenTabBlokVolgorde.slice();
    const [item] = next.splice(idx, 1);
    next.splice(nextIdx, 0, item);
    savePassenTabBlokVolgorde(next);
    setPassenTabBlokVolgorde(next);
  };

  const verplaatsPas = (pasId, delta) => {
    const ids = laadpassenLijst.map((p) => p.id);
    const idx = ids.indexOf(pasId);
    if (idx < 0) return;
    const nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= ids.length) return;
    const next = ids.slice();
    const [id] = next.splice(idx, 1);
    next.splice(nextIdx, 0, id);
    savePassOrder(next);
    setLaadpassenLijst(sortPassesByVolgorde(getMergedPasses()));
  };

  const showToast = (message, type = 'info') => setToast({ message, type, ts: Date.now() });

  const vraagConfirm = ({ title, message, confirmLabel, cancelLabel, danger } = {}) =>
    new Promise((resolve) => {
      confirmResolveRef.current = resolve;
      setConfirmState({
        open: true,
        title: title || 'Bevestigen',
        message: message || '',
        confirmLabel: confirmLabel || 'Doorgaan',
        cancelLabel: cancelLabel || 'Annuleren',
        danger: Boolean(danger),
      });
    });

  const zetHuidigeMaand = () => { const { van, tot } = eersteEnLaatsteDagVanMaand(); setRapportVan(van); setRapportTot(tot); };
  const toggleRapportPas = (naam) => { setRapportPasSelectie((prev) => { const n = new Set(prev); if (n.has(naam)) n.delete(naam); else n.add(naam); return n; }); };
  const selecteerAllePassenRapport = () => setRapportPasSelectie(new Set(laadpassenLijst.map((p) => p.naam)));
  const uitloggen = async () => { pendingAuthActionRef.current = null; await supabase.auth.signOut(); setSessies([]); setScherm('passen'); };

  if (toonDisclaimer) return <Disclaimer onTerug={() => setToonDisclaimer(false)} />;
  if (mfaStatus === 'laden') return <div style={{ backgroundColor: '#0a2e1a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6db88a', fontFamily: 'sans-serif', fontSize: '16px' }}>⏳ Laden...</div>;
  if (!gebruiker || mfaStatus === 'niet_ingelogd') return <Login onDisclaimer={() => setToonDisclaimer(true)} />;
  if (mfaStatus === 'setup_nodig') {
    return (
      <MfaSetup
        onKlaar={() => {
          try { if (gebruiker?.id) sessionStorage.removeItem(mfaTotpSkippedStorageKey(gebruiker.id)); } catch { }
          setMfaTotpActief(true);
          setMfaStatus('klaar');
          haalSessiesOp();
        }}
        onOverslaan={() => {
          try { if (gebruiker?.id) sessionStorage.setItem(mfaTotpSkippedStorageKey(gebruiker.id), '1'); } catch { }
          setMfaStatus('klaar');
          haalSessiesOp();
        }}
      />
    );
  }
  if (mfaStatus === 'verificatie_nodig') {
    return (
      <MfaVerify
        onVerified={async () => {
          await uitvoerPendingAuthNaMfa();
          setMfaTotpActief(true);
          setMfaStatus('klaar');
          haalSessiesOp();
        }}
        onUitloggen={uitloggen}
      />
    );
  }

  return (
    <div style={{ height: '100vh', maxWidth: '390px', margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0a2e1a', fontFamily: 'sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 999, width: 'min(360px, 92vw)' }}>
          <div
            role="status"
            style={{
              background: toast.type === 'error' ? '#5a1a1a' : '#0f3d22',
              border: `1px solid ${toast.type === 'error' ? '#ff6b6b' : '#1f6b3d'}`,
              borderRadius: '14px',
              padding: '12px 14px',
              color: 'white',
              fontSize: '13px',
              lineHeight: 1.4,
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            }}
          >
            <span style={{ color: toast.type === 'error' ? '#ff9b9b' : '#e8fff0' }}>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} style={{ background: 'transparent', border: 'none', color: '#6db88a', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }} aria-label="Melding sluiten">
              ✕
            </button>
          </div>
        </div>
      )}
      <div style={{ flexShrink: 0, padding: '16px 20px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0 }}>Laad<span style={{ color: '#c8ff00' }}>Smart</span></h1>
            <p style={{ color: '#6db88a', fontSize: '13px', marginTop: '4px' }}>{gebruiker.email}</p>
            {mfaTotpActief ? (
              <div style={{ marginTop: '8px' }}>
                <span style={{ display: 'inline-block', background: '#1a5c34', border: '1px solid #2a8f52', color: '#c8ff00', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '999px' }} title="Er staat een geverifieerde authenticator-app (TOTP) op je account.">
                  2FA / authenticator actief
                </span>
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6db88a', lineHeight: 1.45, maxWidth: '260px' }}>
                  Na uitloggen en opnieuw inloggen vragen we steeds je wachtwoord én een 6-cijferige code uit je app.
                </p>
              </div>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6db88a', lineHeight: 1.45, maxWidth: '260px' }}>
                Geen authenticator (TOTP) gekoppeld op dit account.
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={uitloggen} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '8px 12px', color: '#6db88a', fontSize: '12px', cursor: 'pointer' }}>Uitloggen</button>
            <button type="button" onClick={() => setScherm('account')} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '8px 12px', color: '#c8ff00', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Account</button>
            <button type="button" onClick={() => setToonHelpAi(true)} style={{ background: 'transparent', border: '1px solid #2a6b4d', borderRadius: '10px', padding: '8px 12px', color: '#a8f0c6', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Help</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 12px' }}>

        {laden && <div style={{ color: '#6db88a', textAlign: 'center', padding: '20px' }}>⏳ Laden...</div>}

        {!laden && scherm === 'passen' && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setToonReorderInfo((v) => !v)}
                style={{ width: '100%', background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '10px 12px', cursor: 'pointer', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}
              >
                <span style={{ fontSize: '12px', color: '#e8fff0', fontWeight: '700' }}>
                  Tip: verplaatsen met ⋮⋮ (blok of pas)
                </span>
                <span style={{ color: '#c8ff00', fontSize: '12px', flexShrink: 0 }}>{toonReorderInfo ? '▲' : '▼'}</span>
              </button>
              {toonReorderInfo && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#6db88a', lineHeight: 1.45, padding: '10px 12px', borderRadius: '12px', border: '1px solid #1f6b3d', background: '#0a2e1a' }}>
                  <div><strong style={{ color: '#a8f0c6' }}>⋮⋮ links</strong> = blokken</div>
                  <div><strong style={{ color: '#a8f0c6' }}>⋮⋮ bij kaart</strong> = passen</div>
                  <div style={{ marginTop: '6px' }}>Op mobiel kun je ook ▲/▼ gebruiken.</div>
                </div>
              )}
            </div>
            {passenTabBlokVolgorde.map((blokKey, blokIndex) => (
              <div
                key={blokKey}
                onDragOverCapture={(e) => {
                  if (!dragBlokKey) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverBlokKey(blokKey);
                }}
                onDragLeave={() => setDragOverBlokKey((cur) => (cur === blokKey ? null : cur))}
                onDrop={(e) => {
                  if (!dragBlokKey) return;
                  e.preventDefault();
                  const from = e.dataTransfer.getData('application/x-passen-tab-blok');
                  setDragBlokKey(null);
                  setDragOverBlokKey(null);
                  if (from && from !== blokKey) herzetBlokVolgorde(from, blokKey);
                }}
                style={{ marginBottom: '14px', borderRadius: '14px', opacity: dragBlokKey === blokKey ? 0.65 : 1, boxShadow: dragOverBlokKey === blokKey && dragBlokKey && dragBlokKey !== blokKey ? '0 0 0 2px #c8ff00' : 'none' }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData('application/x-passen-tab-blok', blokKey); e.dataTransfer.effectAllowed = 'move'; setDragBlokKey(blokKey); }}
                      onDragEnd={() => { setDragBlokKey(null); setDragOverBlokKey(null); }}
                      title="Sleep dit blok"
                      style={{ width: '34px', minHeight: '44px', borderRadius: '10px', background: '#0a2e1a', border: '1px solid #1f6b3d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: '#6db88a', fontSize: '15px', userSelect: 'none', touchAction: 'none' }}
                      aria-label={`Blok verslepen: ${blokKey}`}
                    >
                      ⋮⋮
                    </div>
                    <button
                      type="button"
                      onClick={() => verplaatsBlok(blokKey, -1)}
                      disabled={blokIndex === 0}
                      title="Blok omhoog"
                      style={{ width: '34px', height: '28px', borderRadius: '10px', border: '1px solid #1f6b3d', background: '#0a2e1a', color: '#6db88a', cursor: blokIndex === 0 ? 'not-allowed' : 'pointer', opacity: blokIndex === 0 ? 0.4 : 1, fontSize: '12px' }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => verplaatsBlok(blokKey, +1)}
                      disabled={blokIndex === passenTabBlokVolgorde.length - 1}
                      title="Blok omlaag"
                      style={{ width: '34px', height: '28px', borderRadius: '10px', border: '1px solid #1f6b3d', background: '#0a2e1a', color: '#6db88a', cursor: blokIndex === passenTabBlokVolgorde.length - 1 ? 'not-allowed' : 'pointer', opacity: blokIndex === passenTabBlokVolgorde.length - 1 ? 0.4 : 1, fontSize: '12px' }}
                    >
                      ▼
                    </button>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {blokKey === 'acties' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={() => setToonImport(true)} style={{ flex: 1, background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px 10px', color: '#c8ff00', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Importeren</button>
                        <button type="button" onClick={() => setToonLaadpasForm(true)} style={{ flex: 1, background: '#1a5c34', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px 10px', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>+ Laadpas</button>
                      </div>
                    )}
                    {blokKey === 'impact' && (
                      totaalKwhOpgeladen > 0 ? (
                        <div style={{ background: 'linear-gradient(135deg, #0f4a28, #0a3d22)', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '8px' }}>Je laad-impact (indicatief)</div>
                          <div style={{ fontSize: '12px', color: '#6db88a', lineHeight: 1.5, marginBottom: '10px' }}>
                            Som van alle kWh in je account ({totaalKwhOpgeladen.toFixed(1)} kWh); grove schatting vermeden CO₂ t.o.v. gemiddeld benzineverkeer (~{CO2_KG_PER_KWH_INDICATIEF} kg/kWh).
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#6db88a' }}>CO₂ (indicatief)</div>
                              <div style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>≈ {co2Bomen.co2Kg < 10 ? co2Bomen.co2Kg.toFixed(2) : co2Bomen.co2Kg.toFixed(0)} kg</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#6db88a' }}>Bomen-equivalent</div>
                              <div style={{ fontSize: '22px', fontWeight: '800', color: '#a8f0c6' }}>≈ {co2Bomen.bomenJaren < 10 ? co2Bomen.bomenJaren.toFixed(1) : co2Bomen.bomenJaren.toFixed(0)} bomen × 1 jr</div>
                            </div>
                          </div>
                          <p style={{ margin: '10px 0 0', fontSize: '10px', color: '#5a9e7a', lineHeight: 1.45 }}>
                            "Bomen" = hoeveel bomen ongeveer een jaar zouden moeten opnemen om dezelfde hoeveelheid CO₂ te binden (~{CO2_KG_PER_BOOM_PER_JAAR} kg/boom/jaar). Geen formele milieudocumentatie.
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: '#0a2e1a', border: '1px dashed #2a5c3d', borderRadius: '14px', padding: '12px 14px' }}>
                          <div style={{ fontSize: '12px', color: '#6db88a', lineHeight: 1.45 }}>Laad-impact (CO₂ / bomen) verschijnt zodra je kWh laadt.</div>
                        </div>
                      )
                    )}
                    {blokKey === 'passen' && (
                      <>
                        <div style={{ marginBottom: '12px' }}>
                          <button type="button" onClick={() => setMijnLaadpassenIngeklapt((v) => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px 14px', color: 'white', fontSize: '16px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' }}>
                            <span>Mijn laadpassen{laadpassenLijst.length > 0 && <span style={{ fontWeight: '600', color: '#6db88a', fontSize: '13px', marginLeft: '8px' }}>({laadpassenLijst.length})</span>}</span>
                            <span style={{ color: '#c8ff00', fontSize: '14px', flexShrink: 0 }} aria-hidden>{mijnLaadpassenIngeklapt ? '▼ Uitklappen' : '▲ Inklappen'}</span>
                          </button>
                        </div>
                        {!mijnLaadpassenIngeklapt && (
                          laadpassenLijst.length === 0 ? (
                            <div style={{ color: '#6db88a', fontSize: '14px', lineHeight: 1.45 }}>Geen actieve laadpassen.</div>
                          ) : (
                            laadpassenLijst.map((pas, pasIndex) => (
                              <div
                                key={pas.id}
                                onDragOver={(e) => { if (dragBlokKey) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverPasId(pas.id); }}
                                onDragLeave={() => setDragOverPasId((cur) => (cur === pas.id ? null : cur))}
                                onDrop={(e) => { if (dragBlokKey) return; e.preventDefault(); const raw = e.dataTransfer.getData('application/x-laadpas-id'); const draggedId = parseInt(raw, 10); setDragOverPasId(null); setDragPasId(null); if (Number.isFinite(draggedId)) herzetPasVolgorde(draggedId, pas.id); }}
                                style={{ marginBottom: '12px', borderRadius: '16px', opacity: dragPasId === pas.id ? 0.55 : 1, boxShadow: dragOverPasId === pas.id && dragPasId != null && dragPasId !== pas.id ? '0 0 0 2px #c8ff00' : 'none' }}
                              >
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div
                                      draggable
                                      onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('application/x-laadpas-id', String(pas.id)); e.dataTransfer.effectAllowed = 'move'; setDragPasId(pas.id); }}
                                      onDragEnd={(e) => { e.stopPropagation(); setDragPasId(null); setDragOverPasId(null); }}
                                      title="Sleep om volgorde te wijzigen"
                                      style={{ width: '34px', borderRadius: '10px', background: '#0a2e1a', border: '1px solid #1f6b3d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: '#6db88a', fontSize: '15px', lineHeight: 1, userSelect: 'none', touchAction: 'none' }}
                                      aria-label="Verslepen: volgorde van laadpas"
                                    >
                                      ⋮⋮
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => verplaatsPas(pas.id, -1)}
                                      disabled={pasIndex === 0}
                                      title="Pas omhoog"
                                      style={{ width: '34px', height: '28px', borderRadius: '10px', border: '1px solid #1f6b3d', background: '#0a2e1a', color: '#6db88a', cursor: pasIndex === 0 ? 'not-allowed' : 'pointer', opacity: pasIndex === 0 ? 0.4 : 1, fontSize: '12px' }}
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => verplaatsPas(pas.id, +1)}
                                      disabled={pasIndex === laadpassenLijst.length - 1}
                                      title="Pas omlaag"
                                      style={{ width: '34px', height: '28px', borderRadius: '10px', border: '1px solid #1f6b3d', background: '#0a2e1a', color: '#6db88a', cursor: pasIndex === laadpassenLijst.length - 1 ? 'not-allowed' : 'pointer', opacity: pasIndex === laadpassenLijst.length - 1 ? 0.4 : 1, fontSize: '12px' }}
                                    >
                                      ▼
                                    </button>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <PasKaart pas={pas} stats={statsPerNaam[pas.naam]} voorbladLeeg={voorbladResetPassen.has(pas.naam)} onReset={() => resetOfHerstelVoorblad(pas)} onMoveToTrash={zetPasInPrullenbak} onSavePassDetails={bewaarPasDetails} onToast={showToast} />
                                  </div>
                                </div>
                              </div>
                            ))
                          )
                        )}
                      </>
                    )}
                    {blokKey === 'prullen' && (
                      <div>
                        <button type="button" onClick={() => setPrullenbakOpen((o) => !o)} style={{ width: '100%', background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px 14px', color: '#ffcc80', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Prullenbak</span>
                          <span style={{ background: '#5a4a2a', color: '#fff', borderRadius: '10px', padding: '2px 10px', fontSize: '12px' }}>{trashLijst.length}</span>
                        </button>
                        {prullenbakOpen && (
                          <div style={{ marginTop: '12px', background: '#0a2e1a', border: '1px solid #2a2a1f', borderRadius: '14px', padding: '12px' }}>
                            {trashLijst.length === 0 ? (
                              <div style={{ color: '#6db88a', fontSize: '13px', textAlign: 'center', padding: '12px' }}>Prullenbak is leeg.</div>
                            ) : (
                              trashLijst.map((t) => (
                                <div key={t.trashId} style={{ border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px', marginBottom: '10px', background: '#0f3d22' }}>
                                  <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{t.snapshot.naam}</div>
                                  <div style={{ color: '#6db88a', fontSize: '12px', marginTop: '4px' }}>{t.source === 'custom' ? 'Eigen pas' : 'Standaardpas'} · €{Number(t.snapshot.prijsPerKwh).toFixed(2)}/kWh{t.snapshot.pasnummer ? ` · Pasnr. ${t.snapshot.pasnummer}` : ''}</div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button type="button" onClick={() => { herstelUitPrullenbak(t.trashId); showToast('Pas hersteld.', 'info'); }} style={{ flex: 1, background: '#1a5c34', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '8px', color: '#c8ff00', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Herstellen</button>
                                    <button type="button" onClick={() => { void wisDefinitiefUitPrullenbak(t.trashId); }} style={{ flex: 1, background: 'transparent', border: '1px solid #5a2a2a', borderRadius: '10px', padding: '8px', color: '#ff9b9b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Verwijderen</button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div onClick={() => setToonDisclaimer(true)} style={{ color: '#6db88a', fontSize: '11px', textAlign: 'center', marginTop: '8px', marginBottom: '24px', cursor: 'pointer', textDecoration: 'underline' }}>
              Algemene Voorwaarden & Privacyverklaring — TripleFusionService
            </div>
          </>
        )}

        {!laden && scherm === 'toevoegen' && (
          <>
            <SessieForm onToevoegen={voegSessieToe} laadpassen={laadpassenLijst} authUserId={gebruiker.id} />
            {sessies.length > 0 && (
              <>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Recente sessies</div>
                {sessies.map((s, i) => (
                  <div key={s.id ?? i} style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderLeft: `4px solid ${kleurVoorPasNaam(s.pas_naam, laadpassenLijst)}`, borderRadius: '16px', padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <>
            <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '10px', marginBottom: '12px', display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRapportMode('prive')}
                style={{
                  flex: 1,
                  background: rapportMode === 'prive' ? '#c8ff00' : 'transparent',
                  color: rapportMode === 'prive' ? '#0a2e1a' : '#c8ff00',
                  border: '2px solid #c8ff00',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Privé · kosten
              </button>
              <button
                type="button"
                onClick={() => setRapportMode('zakelijk')}
                style={{
                  flex: 1,
                  background: rapportMode === 'zakelijk' ? '#c8ff00' : 'transparent',
                  color: rapportMode === 'zakelijk' ? '#0a2e1a' : '#c8ff00',
                  border: '2px solid #c8ff00',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Zakelijk · BTW
              </button>
            </div>

            {rapportMode === 'prive' && (
              <>
                <GrafiekKosten sessies={sessies} />
                <div style={{ background: 'linear-gradient(135deg, #1a5c34, #0f4a25)', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid #1f6b3d' }}>
                  <div style={{ fontSize: '13px', color: '#a8f0c6', fontWeight: '700', letterSpacing: '0.02em' }}>Totaal over selectie</div>
                  <div style={{ fontSize: '12px', color: '#6db88a', marginTop: '6px', lineHeight: 1.45 }}>
                    {formatDatumNlIso(rapportVan)} t/m {formatDatumNlIso(rapportTot)}
                    {rapportPasSelectie.size < laadpassenLijst.length && ` · ${rapportPasSelectie.size} van ${laadpassenLijst.length} laadpas(s)`}
                  </div>
                  <div style={{ fontSize: '13px', color: '#c8ff00', marginTop: '4px', textTransform: 'capitalize' }}>{periodeLabel}</div>
                  <div style={{ fontSize: '40px', fontWeight: '800', color: 'white', margin: '10px 0' }}>€{totaal.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#6db88a', lineHeight: 1.4, marginBottom: '12px' }}>Bedrag incl. BTW (indicatief). Voor administratie: kies Zakelijk.</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #ffffff15', flexWrap: 'wrap' }}>
                    <div><div style={{ fontSize: '12px', color: '#6db88a' }}>Sessies</div><div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{sessiesGefilterd.length}</div></div>
                    <div><div style={{ fontSize: '12px', color: '#6db88a' }}>Gem./sessie</div><div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>€{sessiesGefilterd.length ? (totaal / sessiesGefilterd.length).toFixed(2) : '0.00'}</div></div>
                  </div>
                </div>
              </>
            )}

            {rapportMode === 'zakelijk' && (
              <>
                <GrafiekKosten sessies={sessies} />

            <div style={{ background: 'linear-gradient(135deg, #1a5c34, #0f4a25)', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid #1f6b3d' }}>
              <div style={{ fontSize: '13px', color: '#a8f0c6', fontWeight: '700', letterSpacing: '0.02em' }}>Totaal over selectie (BTW)</div>
              <div style={{ fontSize: '12px', color: '#6db88a', marginTop: '6px', lineHeight: 1.45 }}>
                {formatDatumNlIso(rapportVan)} t/m {formatDatumNlIso(rapportTot)}
                {rapportPasSelectie.size < laadpassenLijst.length && ` · ${rapportPasSelectie.size} van ${laadpassenLijst.length} laadpas(s)`}
              </div>
              <div style={{ fontSize: '13px', color: '#c8ff00', marginTop: '4px', textTransform: 'capitalize' }}>{periodeLabel}</div>
              <div style={{ fontSize: '40px', fontWeight: '800', color: 'white', margin: '10px 0' }}>€{totaal.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#6db88a', lineHeight: 1.4, marginBottom: '12px' }}>Bedrag incl. 21% BTW. PDF/CSV gebruikt exact deze periode en passen.</div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #ffffff15', flexWrap: 'wrap' }}>
                <div><div style={{ fontSize: '12px', color: '#6db88a' }}>Excl. BTW</div><div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>€{exclBtw.toFixed(2)}</div></div>
                <div><div style={{ fontSize: '12px', color: '#6db88a' }}>BTW hoog (21%)</div><div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>€{totaalBtw.toFixed(2)}</div><div style={{ background: '#c8ff00', color: '#0a2e1a', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '4px' }}>VOOR AANGIFTE</div></div>
                <div><div style={{ fontSize: '12px', color: '#6db88a' }}>Sessies</div><div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>{sessiesGefilterd.length}</div></div>
              </div>
            </div>

            <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Rapportage: periode en laadpassen</div>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6db88a', lineHeight: 1.45 }}>Kies de periode en welke passen in dit overzicht en in de download moeten zitten.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Van</label>
                  <input type="date" value={rapportVan} onChange={(e) => setRapportVan(e.target.value)} style={inputKlein} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Tot</label>
                  <input type="date" value={rapportTot} onChange={(e) => setRapportTot(e.target.value)} style={inputKlein} />
                </div>
              </div>
              <button type="button" onClick={zetHuidigeMaand} style={{ width: '100%', marginBottom: '14px', background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '12px', color: '#c8ff00', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Huidige kalendermaand</button>
              <div style={{ fontSize: '12px', color: '#6db88a', marginBottom: '8px', fontWeight: '600' }}>Laadpassen in dit rapport</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                {laadpassenLijst.map((p) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'white', cursor: 'pointer', background: rapportPasSelectie.has(p.naam) ? '#1a5c34' : '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '8px 12px' }}>
                    <input type="checkbox" checked={rapportPasSelectie.has(p.naam)} onChange={() => toggleRapportPas(p.naam)} style={{ width: '18px', height: '18px', accentColor: '#c8ff00' }} />
                    {p.naam}
                  </label>
                ))}
              </div>
              <button type="button" onClick={selecteerAllePassenRapport} style={{ background: 'transparent', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '10px', color: '#6db88a', fontSize: '13px', cursor: 'pointer', width: '100%', fontWeight: '600' }}>Alle passen selecteren</button>
              <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #1f6b3d' }}>
                <label htmlFor="administratie-naam" style={{ fontSize: '12px', color: '#6db88a', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Administratienaam / onderneming <span style={{ fontWeight: '500', opacity: 0.95 }}>(optioneel, voor op de PDF)</span></label>
                <input id="administratie-naam" type="text" value={administratieNaam} onChange={(e) => setAdministratieNaam(e.target.value)} placeholder="Bijv. Handelsnaam BV of privé-administratie" autoComplete="organization" style={inputKlein} />
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#6db88a', lineHeight: 1.4 }}>Staat op het PDF-overzicht. Wordt lokaal bewaard.</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px', background: '#0a2e1a', border: '2px solid #c8ff00', borderRadius: '16px', padding: '16px 16px 18px' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#c8ff00', marginBottom: '6px' }}>Download (PDF of CSV)</div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#e8fff0', lineHeight: 1.45 }}>Gebruikt <strong style={{ color: 'white' }}>exact</strong> de periode en laadpassen die je hierboven hebt gekozen.</p>
              <div style={{ fontSize: '12px', color: '#6db88a', marginBottom: '14px', padding: '10px 12px', background: '#0f3d22', borderRadius: '10px', border: '1px solid #1f6b3d', lineHeight: 1.4 }}>
                <strong style={{ color: '#a8f0c6' }}>Huidige selectie:</strong> {formatDatumNlIso(rapportVan)} t/m {formatDatumNlIso(rapportTot)}<br />
                {rapportPasSelectie.size} laadpas(s) · {sessiesGefilterd.length} sessie(s)
              </div>
              {!sessies.length ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#6db88a', lineHeight: 1.45 }}>Voeg eerst sessies toe om een export te maken.</p>
              ) : rapportPasSelectie.size === 0 ? (
                <p style={{ margin: 0, fontSize: '13px', color: '#ff9b9b', lineHeight: 1.45 }}>Vink minstens één laadpas aan om te downloaden.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button type="button" onClick={() => downloadMaandrapportPdf(sessiesGefilterd, rapportTotalen, exportMeta)} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '14px 16px', width: '100%', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>PDF downloaden</button>
                    <button type="button" onClick={() => downloadMaandrapportCsv(sessiesGefilterd, rapportTotalen, exportMeta)} style={{ background: 'transparent', color: '#c8ff00', border: '2px solid #c8ff00', borderRadius: '12px', padding: '12px 16px', width: '100%', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>CSV downloaden</button>
                  </div>
                  {sessiesGefilterd.length === 0 && (
                    <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#a8f0c6', lineHeight: 1.45 }}>Geen sessies in deze selectie. Bestand bevat totalen op € 0,00.</p>
                  )}
                </>
              )}
            </div>

            <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: 'white', marginBottom: '6px' }}>BTW-overzicht</div>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#6db88a', lineHeight: 1.45 }}>Zelfde selectie als hierboven.</p>
              {sessies.length === 0 ? (
                <div style={{ color: '#6db88a', fontSize: '14px', textAlign: 'center', padding: '20px' }}>Voeg eerst sessies toe.</div>
              ) : rapportPasSelectie.size === 0 ? (
                <div style={{ color: '#ff9b9b', fontSize: '13px', textAlign: 'center', padding: '12px' }}>Selecteer minstens één laadpas hierboven.</div>
              ) : (
                <>
                  {sessiesGefilterd.length === 0 && (
                    <div style={{ color: '#a8f0c6', fontSize: '13px', padding: '12px 14px', marginBottom: '14px', background: '#0a2e1a', borderRadius: '12px', border: '1px solid #1f6b3d', lineHeight: 1.45 }}>Geen sessies in deze periode.</div>
                  )}
                  {Object.keys(totalenPerPas).length > 0 && (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '10px' }}>Samenvatting per leverancier</div>
                      <div style={{ borderRadius: '12px', border: '1px solid #1f6b3d', overflow: 'hidden', marginBottom: '16px' }}>
                        {Object.keys(totalenPerPas).sort((a, b) => a.localeCompare(b, 'nl')).map((naam, idx, arr) => {
                          const r = totalenPerPas[naam];
                          return (
                            <div key={naam} style={{ padding: '12px 14px', borderBottom: idx < arr.length - 1 ? '1px solid #1f6b3d' : 'none', background: idx % 2 === 0 ? '#0a2e1a' : '#0f3d22', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{naam}</div>
                                <div style={{ color: '#6db88a', fontSize: '12px', marginTop: '2px' }}>{r.sessies} sessie{r.sessies !== 1 ? 's' : ''}{pasnummerByNaam[naam] ? <span style={{ color: '#a8f0c6' }}> · Pasnr. {pasnummerByNaam[naam]}</span> : null}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>€{Number(r.bedrag).toFixed(2)} <span style={{ color: '#6db88a', fontWeight: '500', fontSize: '11px' }}>incl. BTW</span></div>
                                <div style={{ color: '#a8f0c6', fontSize: '12px', marginTop: '2px' }}>BTW €{Number(r.btw).toFixed(2)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Totalen</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Totaal incl. BTW</span><span style={{ color: 'white', fontWeight: '600' }}>€{totaal.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Totaal excl. BTW</span><span style={{ color: 'white', fontWeight: '600' }}>€{exclBtw.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>BTW 21%</span><span style={{ color: '#c8ff00', fontWeight: '600' }}>€{totaalBtw.toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1f6b3d', color: '#6db88a', fontSize: '13px' }}><span>Aantal sessies</span><span style={{ color: 'white', fontWeight: '600' }}>{sessiesGefilterd.length}</span></div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', margin: '18px 0 8px' }}>Specificatie</div>
                  <div style={{ maxHeight: 'min(50vh, 420px)', overflowY: 'auto', borderRadius: '12px', border: '1px solid #1f6b3d' }}>
                    {sessiesGefilterd.length === 0 ? (
                      <div style={{ padding: '16px', color: '#6db88a', fontSize: '13px', textAlign: 'center' }}>Geen regels.</div>
                    ) : (
                      sessiesGefilterd.map((s, i) => (
                        <div key={s.id ?? i} style={{ padding: '12px 14px', borderBottom: i < sessiesGefilterd.length - 1 ? '1px solid #1f6b3d' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e8fff0', background: i % 2 === 0 ? '#0a2e1a' : 'transparent' }}>
                          <span style={{ minWidth: 0 }}><span style={{ color: 'white', fontWeight: '600' }}>{formatDatumNlIso(s.datum)}</span><span style={{ color: '#6db88a' }}> · {s.pas_naam}</span></span>
                          <span style={{ flexShrink: 0, textAlign: 'right' }}>{s.kwh} kWh · €{Number(s.bedrag ?? 0).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <p style={{ fontSize: '11px', color: '#6db88a', lineHeight: 1.4, margin: '14px 0 0' }}>Geen rechtsgeldige factuur. Bewaar altijd je originele laadfacturen.</p>
                </>
              )}
            </div>
              </>
            )}
          </>
        )}

        {!laden && scherm === 'account' && (
          <AccountScherm
            user={gebruiker}
            mfaTotpActief={mfaTotpActief}
            pendingAuthActionRef={pendingAuthActionRef}
            onOpenAccountVerwijder={() => setToonAccountVerwijder(true)}
            onUserRefresh={refreshGebruikerUitAuth}
            onDisclaimer={() => setToonDisclaimer(true)}
            onToast={showToast}
          />
        )}
      </div>

      {toonImport && <ImportModal onSluiten={() => setToonImport(false)} onImport={haalSessiesOp} authUserId={gebruiker.id} />}
      {toonLaadpasForm && <LaadpasToevoegenModal onSluiten={() => setToonLaadpasForm(false)} onToegevoegd={verversLaadpassen} />}
      {toonHelpAi && <HelpAiModal onSluiten={() => setToonHelpAi(false)} huidigScherm={scherm} />}
      <ConfirmModal
        open={Boolean(confirmState?.open)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        danger={Boolean(confirmState?.danger)}
        onCancel={() => {
          const r = confirmResolveRef.current;
          confirmResolveRef.current = null;
          setConfirmState(null);
          if (r) r(false);
        }}
        onConfirm={() => {
          const r = confirmResolveRef.current;
          confirmResolveRef.current = null;
          setConfirmState(null);
          if (r) r(true);
        }}
      />
      <AccountVerwijderModal open={toonAccountVerwijder} userEmail={gebruiker.email} userId={gebruiker.id} onSluiten={() => setToonAccountVerwijder(false)} onVerwijderd={() => { setToonAccountVerwijder(false); setSessies([]); setScherm('passen'); }} onToast={showToast} />

      <div style={{ flexShrink: 0, width: '100%', maxWidth: '390px', margin: '0 auto', background: '#0a2e1a', borderTop: '1px solid #1f6b3d', padding: '12px 12px calc(12px + env(safe-area-inset-bottom, 0px))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '4px' }}>
        {[{ id: 'passen', icon: '💳', label: 'Passen' }, { id: 'toevoegen', icon: '⚡', label: 'Toevoegen' }, { id: 'rapport', icon: '📄', label: 'Rapport' }, { id: 'account', icon: '👤', label: 'Account' }].map((item) => (
          <div key={item.id} role="button" tabIndex={0} onClick={() => setScherm(item.id)} onKeyDown={(e) => e.key === 'Enter' && setScherm(item.id)} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', opacity: scherm === item.id ? 1 : 0.4 }}>
            <div style={{ fontSize: '20px' }}>{item.icon}</div>
            <div style={{ fontSize: '9px', color: scherm === item.id ? '#c8ff00' : '#6db88a', textAlign: 'center', lineHeight: 1.1 }}>{item.label}</div>
            {scherm === item.id && <div style={{ width: '4px', height: '4px', background: '#c8ff00', borderRadius: '50%' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;