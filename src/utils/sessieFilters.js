const MAANDEN_NL = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
];

function parseYmd(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

function toLocalYmd(date) {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const da = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Eerste en laatste kalenderdag van de huidige maand (YYYY-MM-DD, lokale tijd). */
export function eersteEnLaatsteDagVanMaand(datum = new Date()) {
  const y = datum.getFullYear();
  const m = datum.getMonth();
  const eerste = new Date(y, m, 1);
  const laatste = new Date(y, m + 1, 0);
  return { van: toLocalYmd(eerste), tot: toLocalYmd(laatste) };
}

/** ISO-datum (YYYY-MM-DD) naar Nederlands notatie dd-mm-jjjj. */
export function formatDatumNlIso(yyyymmdd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(yyyymmdd ?? '').trim());
  if (!m) return String(yyyymmdd ?? '');
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Leesbare periode voor het dashboard (Nederlands). */
export function formatRapportPeriode(van, tot) {
  const a = parseYmd(van);
  const b = parseYmd(tot);
  if (!a || !b) return 'Periode';
  if (van === tot) {
    return `${MAANDEN_NL[a.getMonth()]} ${a.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) {
    return `${MAANDEN_NL[a.getMonth()]} ${a.getFullYear()}`;
  }
  if (a.getFullYear() === b.getFullYear()) {
    return `${MAANDEN_NL[a.getMonth()]} – ${MAANDEN_NL[b.getMonth()]} ${b.getFullYear()}`;
  }
  return `${MAANDEN_NL[a.getMonth()]} ${a.getFullYear()} – ${MAANDEN_NL[b.getMonth()]} ${b.getFullYear()}`;
}

/**
 * Sessies binnen [van, tot] (inclusief, op datumstring YYYY-MM-DD) en gekozen passen.
 */
export function filterSessies(sessies, van, tot, rapportPasSelectie) {
  const lijst = Array.isArray(sessies) ? sessies : [];
  return lijst.filter((s) => {
    const naam = s.pas_naam || '';
    if (!rapportPasSelectie || rapportPasSelectie.size === 0) return false;
    if (!rapportPasSelectie.has(naam)) return false;
    const d = String(s.datum || '').trim();
    if (!van || !tot) return true;
    return d >= van && d <= tot;
  });
}
