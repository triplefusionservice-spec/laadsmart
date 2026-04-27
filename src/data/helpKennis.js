/**
 * Vaste helpteksten + trefwoorden voor de ingebouwde “help-assistent”.
 * Geen externe AI: antwoorden komen alleen uit deze lijst.
 */
export const HELP_ONDERWERPEN = [
  {
    id: 'snelstart',
    titel: 'Hoe werkt de app? (snelstart)',
    trefwoorden: [
      'hoe werkt',
      'hoe werkt de app',
      'handleiding',
      'uitleg',
      'snelstart',
      'beginnen',
      'starten',
      'eerste keer',
      'tutorial',
      'help',
      'werkt',
    ],
    inhoud:
      '**Snelstart in 3 stappen**\n\n1) Ga naar **Passen** → voeg een laadpas toe (of importeer).\n2) Ga naar **Toevoegen** → vul kWh + datum → **Opslaan**.\n3) Ga naar **Rapport** → kies **Privé** (kosten per maand) of **Zakelijk** (BTW + export).\n\n**Tip:** op Passen kun je blokken/passen herschikken (⋮⋮ of ▲/▼).',
  },
  {
    id: 'troubleshooting',
    titel: 'Problemen oplossen (werkt niet / foutmelding)',
    trefwoorden: ['werkt niet', 'fout', 'foutmelding', 'error', 'bug', 'crash', 'laden', 'opslaan lukt niet', 'import lukt niet', 'login lukt niet'],
    inhoud:
      '**Snelle checklist**\n\n1) **Internet + refresh**: herlaad de pagina en check je verbinding.\n2) **Ingelogd?**: als je sessie verlopen is, log opnieuw in (met 2FA-code als die actief is).\n3) **Opslaan faalt?**: probeer één sessie handmatig toe te voegen (Toevoegen). Als dat lukt is je CSV-formaat waarschijnlijk anders.\n4) **Bedrag klopt niet?**: controleer €/kWh bij je pas (Passen).\n5) **E-mail/wachtwoord wijziging**: check inbox/spam en of je Supabase redirect-URL goed staat.\n\nKom je er niet uit? Noteer de tekst van de fout en op welk scherm het gebeurt.',
  },
  {
    id: 'algemeen',
    titel: 'Wat doet LaadSmart?',
    trefwoorden: ['laadsmart', 'app', 'begin', 'start', 'overzicht', 'wat', 'doel', 'functie', 'kosten', 'btw', 'administratie'],
    inhoud:
      'LaadSmart is jouw persoonlijke app om **elektrisch laden** bij te houden: per laadpas (aanbieder) zie je sessies, kosten en een **indicatieve BTW-split**. Je kunt **PDF/CSV** exporteren voor administratie.\n\n**Waar staan gegevens?** Sessies en je account staan bij **Supabase** (cloud). Volgorde van passen, prullenbak en een deel van de scherminstellingen staan **lokaal** in je browser (localStorage).',
  },
  {
    id: 'bedrag_klopt_niet',
    titel: 'Bedrag klopt niet (te hoog/laag)',
    trefwoorden: [
      'bedrag',
      'klopt niet',
      'fout bedrag',
      'te hoog',
      'te laag',
      'prijs',
      'kwh',
      'kWh',
      'tarief',
      'starttarief',
      'idle',
      'blokkeren',
      'abonnement',
      'kosten',
      'factuur',
    ],
    inhoud:
      '**Meestal komt dit door het €/kWh tarief van je laadpas.**\n\n- Ga naar **Passen** → open je pas → pas **€/kWh** aan → opslaan.\n\n**Let op:** sommige laadproviders rekenen extra’s die niet in €/kWh zitten (starttarief, abonnement, ‘idle fee’/parkeerkosten). LaadSmart rekent nu vooral met jouw ingevoerde €/kWh + kWh.\n\nTip: gebruik **Rapport → Zakelijk** voor een compleet overzicht, maar blijf altijd je originele facturen controleren.',
  },
  {
    id: 'sessie_verwijderen',
    titel: 'Sessie verwijderen of aanpassen',
    trefwoorden: [
      'sessie verwijderen',
      'sessie aanpassen',
      'sessie wijzigen',
      'verkeerde datum',
      'datum fout',
      'corrigeren',
      'edit',
      'delete',
      'verwijder',
      'wijzig',
    ],
    inhoud:
      'Op dit moment kun je sessies niet direct bewerken in de app.\n\n**Workaround:** voeg een correctie-sessie toe (bijv. met dezelfde laadpas en datum) zodat je totalen weer kloppen.\n\nWil je dat sessies echt **bewerkbaar/verwijderbaar** worden, dan kan dat als volgende feature (met een prullenbak voor sessies).',
  },
  {
    id: 'meerdere_autos',
    titel: 'Meerdere auto’s / administraties scheiden',
    trefwoorden: ['meerdere autos', 'meerdere auto', 'auto', 'administratie', 'scheiden', 'project', 'bedrijf', 'privé', 'prive', 'split'],
    inhoud:
      'Alles in LaadSmart is nu per **account** bij elkaar.\n\n**Praktische tip:** geef laadpassen een naam met context, bijv. “Fastned (Auto 1)” of “Shell (Zakelijk)”. Dan kun je in Rapport makkelijker filteren.\n\nAls je echte “administraties” wilt (privé vs zakelijk als aparte buckets), kunnen we dat later toevoegen.',
  },
  {
    id: 'btw_uitleg',
    titel: 'BTW (21%) uitgelegd',
    trefwoorden: ['btw', '21', 'tarief', 'hoe berekend', 'excl', 'incl', 'belasting', 'aangifte', 'factuur'],
    inhoud:
      'LaadSmart gaat uit van **21% BTW**.\n\n- **Incl.** = totaalbedrag\n- **Excl.** = incl / 1.21\n- **BTW** = incl − excl\n\nGebruik **Rapport → Zakelijk** voor administratie/export. Het blijft een hulpmiddel: bewaar je originele laadfacturen.',
  },
  {
    id: 'email_blijft_hangen',
    titel: 'E-mail wijziging blijft hangen',
    trefwoorden: ['email', 'e-mail', 'wijzigen', 'blijft', 'hangen', 'pending', 'new_email', 'verificatie', 'bevestiging', 'spam'],
    inhoud:
      'Supabase maakt een e-mailwijziging pas definitief na **bevestiging via een link** in je inbox.\n\n- Check ook **spam**\n- Soms moet je ook je **oude inbox** bevestigen\n\nIn Account zie je “In behandeling” als er een nieuw adres klaarstaat om te bevestigen.',
  },
  {
    id: '2fa_steeds',
    titel: 'Waarom vraagt hij steeds 2FA?',
    trefwoorden: ['2fa', 'mfa', 'totp', 'authenticator', 'steeds', 'altijd', 'code', 'verificatie', 'aal2'],
    inhoud:
      'Als 2FA (authenticator/TOTP) actief is, is het normaal dat je bij (opnieuw) inloggen een **code** moet invullen.\n\nDit beschermt je account als iemand je wachtwoord kent. Op een nieuw apparaat of na uitloggen kan de app opnieuw om de code vragen.',
  },
  {
    id: 'slepen_mobiel',
    titel: 'Slepen werkt niet op mijn telefoon',
    trefwoorden: ['slepen', 'drag', 'telefoon', 'mobiel', 'iphone', 'android', 'werkt niet', 'volgorde', 'verplaatsen'],
    inhoud:
      'Op sommige telefoons werkt “drag & drop” beperkt.\n\nGebruik daarom op **Passen** de **▲/▼** knoppen om blokken of passen te verplaatsen. Op desktop werkt slepen met ⋮⋮ meestal het beste.',
  },
  {
    id: 'lokaal_vs_cloud',
    titel: 'Wat wordt lokaal onthouden?',
    trefwoorden: ['lokaal', 'localstorage', 'browser', 'cloud', 'supabase', 'onthouden', 'instellingen', 'volgorde'],
    inhoud:
      '**Cloud (Supabase):** je account + sessies.\n\n**Lokaal (browser):** volgorde van blokken/passen, inklappen en sommige voorkeuren.\n\nOp een ander apparaat kunnen die lokale voorkeuren anders zijn (dat is normaal).',
  },
  {
    id: 'import_csv',
    titel: 'CSV import: welk formaat?',
    trefwoorden: ['csv', 'import', 'formaat', 'kolommen', 'header', 'bestand', 'fastned', 'shell', 'allego', 'tap'],
    inhoud:
      'Import is bedoeld voor een paar vaste aanbieders (zoals Fastned/Shell/Allego/Tap) en verwacht een CSV met datum/kWh/bedrag.\n\nAls jouw export afwijkt, kun je sessies ook handmatig toevoegen via **Toevoegen**. Als je een voorbeeld-CSV hebt, kunnen we de import uitbreiden.',
  },
  {
    id: 'passen',
    titel: 'Tab Passen',
    trefwoorden: ['passen', 'laadpas', 'pas', 'kaart', 'prullenbak', 'importeren', 'blok', 'sleep', 'slepen', 'volgorde', 'sorteren', 'verplaatsen', 'inklappen', 'co2', 'bomen', 'impact', 'grafiek'],
    inhoud:
      '**Importeren / + Laadpas:** voeg CSV-sessies toe of maak een pas met naam en €/kWh.\n\n**Volgorde:**\n- **⋮⋮ links** = blokken verslepen\n- **⋮⋮ bij kaart** = passen verslepen\n- **▲/▼** = verplaatsen (handig op mobiel)\n\n**Prullenbak:** herstellen of definitief verwijderen.\n\n**Laad-impact:** grove schatting CO₂/bomen op basis van opgetelde kWh.',
  },
  {
    id: 'prive_zakelijk',
    titel: 'Rapport: Privé vs Zakelijk',
    trefwoorden: ['prive', 'privé', 'zakelijk', 'btw', 'modus', 'toggle', 'switch', 'kosten per maand', 'maandkosten', 'aangifte'],
    inhoud:
      '**Privé · kosten:** bedoeld voor “wat ben ik kwijt per maand?” (grafiek + totalen).\n\n**Zakelijk · BTW:** bedoeld voor administratie (incl/excl/BTW + PDF/CSV export). Gebruik deze modus voor aangifte en boekhouding.',
  },
  {
    id: 'toevoegen',
    titel: 'Tab Toevoegen (sessies)',
    trefwoorden: ['sessie', 'sessies', 'toevoegen', 'kwh', 'laden', 'datum', 'bedrag', 'laadpas', 'dropdown', 'select', 'aanbieder', 'prijs', 'opslaan'],
    inhoud:
      'Kies een **laadpas** (jouw passen bovenaan; daaronder aanbieders uit de catalogus met indicatieve prijs). Vul **kWh** in; het bedrag wordt meestal automatisch berekend. Controleer de **datum** en tik **Sessie opslaan**.\n\nSessies gaan naar de **database** en tellen mee in Rapport en op je pas-kaarten.',
  },
  {
    id: 'rapport',
    titel: 'Tab Rapport',
    trefwoorden: ['rapport', 'pdf', 'csv', 'download', 'periode', 'btw', 'maand', 'belasting', 'export'],
    inhoud:
      'Stel **van/tot** in en vink **welke laadpassen** mee moeten.\n\n- In **Privé** zie je vooral kosten per maand.\n- In **Zakelijk** zie je **incl/excl/BTW** en kun je **PDF/CSV** exporteren.\n\nDownload gebruikt exact de gekozen periode en passen.',
  },
  {
    id: 'account',
    titel: 'Tab Account',
    trefwoorden: ['account', 'email', 'e-mail', 'wachtwoord', 'verwijderen', 'privacy', 'gegevens', '2fa', 'mfa', 'authenticator'],
    inhoud:
      'Hier zie je o.a. je **e-mail** en of die geverifieerd is. **Wachtwoord wijzigen** en **e-mail wijzigen** vragen eerst je **huidige wachtwoord**; bij actieve **2FA (TOTP)** volgt daarna een code uit je authenticator-app.\n\n**Account verwijderen** wist je cloud-sessies en auth-account (met bevestiging). **Disclaimer** staat onderaan meerdere schermen.',
  },
  {
    id: 'mfa',
    titel: 'Inloggen & tweestaps (2FA)',
    trefwoorden: ['inloggen', 'login', 'wachtwoord', 'vergeten', 'reset', 'mfa', '2fa', 'totp', 'authenticator', 'code', 'qr'],
    inhoud:
      'Na inloggen kan de app om **MFA-setup** vragen of om een **verificatiecode** (als er al een authenticator op je account staat). Je kunt setup **overslaan** op dit apparaat (wordt in de browser onthouden), maar 2FA is wel veiliger.\n\n**Wachtwoord vergeten?** Gebruik de link op het inlogscherm voor een resetmail van Supabase.',
  },
  {
    id: 'technisch',
    titel: 'Techniek & beperkingen',
    trefwoorden: ['vercel', 'supabase', 'internet', 'offline', 'browser', 'telefoon', 'slepen', 'drag', 'fout', 'bug'],
    inhoud:
      'De app draait in je **browser**; voor **slepen** (volgorde) werkt dat het beste op **desktop**. Op sommige telefoons is HTML5-drag beperkt.\n\n**Fouten bij opslaan?** Controleer internet, of je ingelogd bent, en of je **Supabase**-project (URL/keys) klopt. Bij e-mail/wachtwoord-wijziging moeten **redirect-URLs** in Supabase Auth goed staan.',
  },
];

const CONTEXT_TIPS = {
  passen: 'Tip: op dit scherm kun je blokken en kaarten herschikken met ⋮⋮.',
  toevoegen: 'Tip: hier voeg je losse laadsessies toe; kies eerst de juiste laadpas of catalogusregel.',
  rapport: 'Tip: kies Privé (kosten) of Zakelijk (BTW/export).',
  account: 'Tip: gevoelige wijzigingen vragen je wachtwoord (en eventueel 2FA-code).',
};

export function tipVoorScherm(scherm) {
  return CONTEXT_TIPS[scherm] || 'Kies een onderwerp hieronder of stel een korte vraag — de assistent zoekt in vaste uitleg.';
}

/** @param {string} vraag */
export function zoekHelpAntwoord(vraag) {
  const raw = String(vraag || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const words = raw.split(/[^a-z0-9]+/).filter((w) => w.length >= 2);
  if (words.length === 0) {
    return { type: 'leeg', items: [] };
  }

  // Special case: “werkt niet / fout” → altijd troubleshooting bovenaan.
  if (
    raw.includes('werkt niet') ||
    raw.includes('fout') ||
    raw.includes('error') ||
    raw.includes('bug') ||
    raw.includes('crash')
  ) {
    const t = HELP_ONDERWERPEN.find((o) => o.id === 'troubleshooting');
    const extra = HELP_ONDERWERPEN.filter((o) => o.id !== 'troubleshooting');
    const scoredRest = extra
      .map((o) => {
        let s = 0;
        const titel = o.titel.toLowerCase();
        const inhoud = o.inhoud.toLowerCase();
        for (const w of words) {
          for (const k of o.trefwoorden) {
            const tl = String(k).toLowerCase();
            if (tl === w || tl.includes(w) || w.includes(tl)) s += 5;
          }
          if (titel.includes(w)) s += 3;
          if (inhoud.includes(w)) s += 1;
        }
        return { o, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const items = [t, ...scoredRest.slice(0, 2).map((x) => x.o)].filter(Boolean);
    return { type: 'treffers', items };
  }

  // Special case: “hoe werkt …” → altijd snelstart bovenaan.
  if (raw.includes('hoe werkt') || raw.includes('uitleg') || raw.includes('handleiding')) {
    const snelstart = HELP_ONDERWERPEN.find((o) => o.id === 'snelstart');
    const extra = HELP_ONDERWERPEN.filter((o) => o.id !== 'snelstart');
    const scoredRest = extra
      .map((o) => {
        let s = 0;
        const titel = o.titel.toLowerCase();
        const inhoud = o.inhoud.toLowerCase();
        for (const w of words) {
          for (const t of o.trefwoorden) {
            const tl = t.toLowerCase();
            if (tl === w || tl.includes(w) || w.includes(tl)) s += 5;
          }
          if (titel.includes(w)) s += 3;
          if (inhoud.includes(w)) s += 1;
        }
        return { o, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const items = [snelstart, ...scoredRest.slice(0, 2).map((x) => x.o)].filter(Boolean);
    return { type: 'treffers', items };
  }

  const scored = HELP_ONDERWERPEN.map((o) => {
    let s = 0;
    const titel = o.titel.toLowerCase();
    const inhoud = o.inhoud.toLowerCase();
    for (const w of words) {
      for (const t of o.trefwoorden) {
        const tl = t.toLowerCase();
        if (tl === w || tl.includes(w) || w.includes(tl)) s += 5;
      }
      if (titel.includes(w)) s += 3;
      if (inhoud.includes(w)) s += 1;
    }
    return { o, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  if (scored.length === 0) return { type: 'geen_treffer', items: [] };
  return { type: 'treffers', items: scored.slice(0, 3).map((x) => x.o) };
}
