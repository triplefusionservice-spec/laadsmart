/**
 * Sjablonen voor laadpas-aanbieders (NL/EU). Prijzen zijn indicatief voor snelle invoer;
 * gebruiker past ze na aan. Gebruikt voor: nieuwe pas kiezen, sessie kiezen (ook zonder eigen pas).
 */
const laadpasAanbiedersCatalogus = [
  { naam: 'Fastned', kleur: '#ff6b35', prijsPerKwh: 0.49, letter: 'F' },
  { naam: 'Shell Recharge', kleur: '#f7d117', prijsPerKwh: 0.42, letter: 'S' },
  { naam: 'Allego', kleur: '#00aaff', prijsPerKwh: 0.39, letter: 'A' },
  { naam: 'Tap Electric', kleur: '#2ecc71', prijsPerKwh: 0.35, letter: 'T' },
  { naam: 'Ionity', kleur: '#e8eaed', prijsPerKwh: 0.79, letter: 'I' },
  { naam: 'EVBox', kleur: '#005eb8', prijsPerKwh: 0.41, letter: 'E' },
  { naam: 'Vattenfall InCharge', kleur: '#ff6600', prijsPerKwh: 0.44, letter: 'V' },
  { naam: 'Eneco eMobility', kleur: '#00b140', prijsPerKwh: 0.43, letter: 'N' },
  { naam: 'ANWB Opladen', kleur: '#ffd200', prijsPerKwh: 0.45, letter: 'O' },
  { naam: 'TotalEnergies / Total', kleur: '#e4002b', prijsPerKwh: 0.46, letter: 'L' },
  { naam: 'BP Pulse', kleur: '#00a651', prijsPerKwh: 0.44, letter: 'B' },
  { naam: 'EWE Go', kleur: '#00965e', prijsPerKwh: 0.42, letter: 'W' },
  { naam: 'E.ON Drive', kleur: '#ea1b0a', prijsPerKwh: 0.43, letter: 'D' },
  { naam: 'Q8 / Q8Qua', kleur: '#003d7d', prijsPerKwh: 0.45, letter: 'Q' },
  { naam: 'Last Mile Solutions', kleur: '#6b5b95', prijsPerKwh: 0.4, letter: 'M' },
  { naam: 'Swarco eVolt', kleur: '#c41230', prijsPerKwh: 0.41, letter: 'R' },
  { naam: 'Joulz', kleur: '#7cb342', prijsPerKwh: 0.38, letter: 'J' },
  { naam: 'Blue Current', kleur: '#1976d2', prijsPerKwh: 0.4, letter: 'U' },
  { naam: 'Porsche Charging', kleur: '#c9a227', prijsPerKwh: 0.55, letter: 'P' },
  { naam: 'Tesla Supercharger', kleur: '#cc0000', prijsPerKwh: 0.52, letter: 'X' },
  { naam: 'Mercedes me Charge', kleur: '#00adef', prijsPerKwh: 0.48, letter: 'M' },
  { naam: 'Plugsurfing', kleur: '#00c896', prijsPerKwh: 0.42, letter: 'H' },
  { naam: 'Chargemap', kleur: '#0fce83', prijsPerKwh: 0.41, letter: 'C' },
  { naam: 'Mobility+', kleur: '#5c6bc0', prijsPerKwh: 0.4, letter: 'Y' },
];

export default laadpasAanbiedersCatalogus;

/** @param {{ naam: string }[]} laadpassen */
export function catalogusVoorSelectie(laadpassen) {
  const namen = new Set(laadpassen.map((p) => p.naam.toLowerCase()));
  return laadpasAanbiedersCatalogus.filter((c) => !namen.has(c.naam.toLowerCase()));
}

export function vindCatalogusTemplate(naam) {
  const n = String(naam || '').trim().toLowerCase();
  return laadpasAanbiedersCatalogus.find((c) => c.naam.toLowerCase() === n);
}

export function kleurVoorPasNaam(pasNaam, laadpassen) {
  const p = laadpassen.find((x) => x.naam === pasNaam);
  if (p?.kleur) return p.kleur;
  const t = vindCatalogusTemplate(pasNaam);
  return t?.kleur || '#6db88a';
}
