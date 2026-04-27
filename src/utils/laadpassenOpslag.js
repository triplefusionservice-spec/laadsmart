import defaultPasses from '../data/laadpassen';

const STORAGE_CUSTOM = 'laadsmart_custom_passen';
const STORAGE_OVERRIDES = 'laadsmart_pass_overrides';
const STORAGE_HIDDEN_DEFAULTS = 'laadsmart_hidden_default_ids';
const STORAGE_TRASH = 'laadsmart_pass_trash';
const STORAGE_PASS_ORDER = 'laadsmart_pass_order';
const STORAGE_MIJN_LADPASSEN_MIN = 'laadsmart_mijn_laadpassen_min';

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCustom(list) {
  try {
    localStorage.setItem(STORAGE_CUSTOM, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_OVERRIDES);
    const o = raw ? JSON.parse(raw) : {};
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function saveOverrides(obj) {
  try {
    localStorage.setItem(STORAGE_OVERRIDES, JSON.stringify(obj));
  } catch {
    // ignore
  }
}

function loadHiddenDefaultIds() {
  try {
    const raw = localStorage.getItem(STORAGE_HIDDEN_DEFAULTS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : []);
  } catch {
    return new Set();
  }
}

function saveHiddenDefaultIds(set) {
  try {
    localStorage.setItem(STORAGE_HIDDEN_DEFAULTS, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

function loadTrash() {
  try {
    const raw = localStorage.getItem(STORAGE_TRASH);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveTrash(list) {
  try {
    localStorage.setItem(STORAGE_TRASH, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function applyOverrides(p) {
  const ov = loadOverrides()[String(p.id)] || {};
  const prijsOv = ov.prijsPerKwh;
  const prijs =
    prijsOv != null && Number.isFinite(Number(prijsOv)) && Number(prijsOv) > 0 ? Number(prijsOv) : Number(p.prijsPerKwh);
  const pasnummer = ov.pasnummer != null ? String(ov.pasnummer).trim() : String(p.pasnummer || '').trim();
  return {
    ...p,
    prijsPerKwh: prijs,
    pasnummer,
  };
}

export function getMergedPasses() {
  const hidden = loadHiddenDefaultIds();
  const defaults = defaultPasses
    .filter((p) => !hidden.has(p.id))
    .map((p) => ({ ...applyOverrides(p), custom: false }));
  const custom = loadCustom().map((p) => ({ ...applyOverrides(p), custom: true }));
  return [...defaults, ...custom];
}

export function loadPassOrder() {
  try {
    const raw = localStorage.getItem(STORAGE_PASS_ORDER);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

export function savePassOrder(ids) {
  try {
    localStorage.setItem(STORAGE_PASS_ORDER, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

/** Sorteert passen volgens opgeslagen id-volgorde; onbekende id's blijven onderaan in oorspronkelijke volgorde. */
export function sortPassesByVolgorde(passes) {
  const order = loadPassOrder();
  if (!order.length) return [...passes];
  const idx = new Map(order.map((id, i) => [id, i]));
  return [...passes].sort((a, b) => {
    const ia = idx.get(a.id);
    const ib = idx.get(b.id);
    const ha = ia !== undefined;
    const hb = ib !== undefined;
    if (ha && hb) return ia - ib;
    if (ha) return -1;
    if (hb) return 1;
    return 0;
  });
}

export function loadMijnLaadpassenIngeklapt() {
  try {
    return localStorage.getItem(STORAGE_MIJN_LADPASSEN_MIN) === '1';
  } catch {
    return false;
  }
}

export function saveMijnLaadpassenIngeklapt(ingeklapt) {
  try {
    localStorage.setItem(STORAGE_MIJN_LADPASSEN_MIN, ingeklapt ? '1' : '0');
  } catch {
    // ignore
  }
}

const STORAGE_PASSEN_TAB_BLOK = 'laadsmart_passen_tab_blok_volgorde';

/** Vaste sleutels voor het tabblad Passen (volgorde sleepbaar). */
export const PASSEN_TAB_BLOK_KEYS = ['acties', 'impact', 'passen', 'prullen'];

export function loadPassenTabBlokVolgorde() {
  try {
    const raw = localStorage.getItem(STORAGE_PASSEN_TAB_BLOK);
    const arr = raw ? JSON.parse(raw) : null;
    const valid = new Set(PASSEN_TAB_BLOK_KEYS);
    if (!Array.isArray(arr)) return [...PASSEN_TAB_BLOK_KEYS];
    const filtered = arr.filter((k) => typeof k === 'string' && valid.has(k));
    const missing = PASSEN_TAB_BLOK_KEYS.filter((k) => !filtered.includes(k));
    return [...filtered, ...missing];
  } catch {
    return [...PASSEN_TAB_BLOK_KEYS];
  }
}

export function savePassenTabBlokVolgorde(keys) {
  try {
    localStorage.setItem(STORAGE_PASSEN_TAB_BLOK, JSON.stringify(keys));
  } catch {
    // ignore
  }
}

export function reorderPassenTabBlokken(keys, dragKey, targetKey) {
  if (dragKey === targetKey) return keys;
  const next = keys.filter((k) => k !== dragKey);
  const ti = next.indexOf(targetKey);
  if (ti < 0) return keys;
  next.splice(ti, 0, dragKey);
  return next;
}

/** Velden die op alle passen (standaard + custom) gelden. */
export function setPassOverride(id, patch) {
  const o = loadOverrides();
  const key = String(id);
  const cur = { ...(o[key] || {}) };
  if ('pasnummer' in patch) {
    const v = String(patch.pasnummer ?? '').trim();
    if (v === '') delete cur.pasnummer;
    else cur.pasnummer = v;
  }
  if ('prijsPerKwh' in patch && patch.prijsPerKwh != null && patch.prijsPerKwh !== '') {
    const n = Number(String(patch.prijsPerKwh).replace(',', '.'));
    if (Number.isFinite(n) && n > 0) cur.prijsPerKwh = n;
    else delete cur.prijsPerKwh;
  }
  if (Object.keys(cur).length === 0) delete o[key];
  else o[key] = cur;
  saveOverrides(o);
}

export function getTrashPasses() {
  return loadTrash().slice().sort((a, b) => String(b.trashedAt).localeCompare(String(a.trashedAt)));
}

export function movePassToTrash(pas) {
  const snapshot = {
    naam: pas.naam,
    kleur: pas.kleur,
    prijsPerKwh: pas.prijsPerKwh,
    letter: pas.letter,
    pasnummer: pas.pasnummer || '',
    kostenMaand: pas.kostenMaand ?? 0,
    sessies: pas.sessies ?? 0,
    btw: pas.btw ?? 0,
  };
  const trash = loadTrash();
  trash.push({
    trashId: `${Date.now()}_${pas.id}`,
    trashedAt: Date.now(),
    id: pas.id,
    source: pas.custom ? 'custom' : 'default',
    snapshot,
  });
  saveTrash(trash);
  if (pas.custom) {
    const list = loadCustom().filter((p) => p.id !== pas.id);
    saveCustom(list);
  } else {
    const hidden = loadHiddenDefaultIds();
    hidden.add(pas.id);
    saveHiddenDefaultIds(hidden);
  }
}

export function restoreTrashItem(trashId) {
  const trash = loadTrash();
  const idx = trash.findIndex((t) => t.trashId === trashId);
  if (idx === -1) return { ok: false, error: 'Item niet gevonden.' };
  const item = trash[idx];
  const next = trash.filter((_, i) => i !== idx);
  saveTrash(next);
  if (item.source === 'custom') {
    const list = loadCustom();
    const snap = { ...item.snapshot, id: item.id, custom: true };
    delete snap.custom;
    list.push(snap);
    saveCustom(list);
  } else {
    const hidden = loadHiddenDefaultIds();
    hidden.delete(item.id);
    saveHiddenDefaultIds(hidden);
  }
  return { ok: true };
}

/** Verwijdert het item uit de prullenbak. Daarna is herstel niet meer mogelijk; de pas blijft uit je actieve lijst (ook standaardpassen). */
export function purgeTrashItem(trashId) {
  const trash = loadTrash();
  const item = trash.find((t) => t.trashId === trashId);
  if (!item) return;
  saveTrash(trash.filter((t) => t.trashId !== trashId));
  // Standaardpas: niet opnieuw tonen — id blijft in 'hidden'. Custom was al uit de actieve lijst bij naar prullenbak.
}

export function addCustomPass({ naam, kleur, prijsPerKwh, letter, pasnummer }) {
  const trimmed = String(naam || '').trim();
  if (!trimmed) return { ok: false, error: 'Vul een naam in.' };
  const bestaand = getMergedPasses().some((p) => p.naam.toLowerCase() === trimmed.toLowerCase());
  if (bestaand) return { ok: false, error: 'Die laadpasnaam bestaat al.' };
  const prijs = Number(prijsPerKwh);
  if (!Number.isFinite(prijs) || prijs <= 0) return { ok: false, error: 'Vul een geldige prijs per kWh in.' };
  const kleurNorm = String(kleur || '').trim() || '#6db88a';
  const letterNorm = String(letter || trimmed.charAt(0) || '?')
    .trim()
    .charAt(0)
    .toUpperCase();
  const id = Date.now();
  const entry = {
    id,
    naam: trimmed,
    kleur: kleurNorm,
    prijsPerKwh: prijs,
    letter: letterNorm,
    kostenMaand: 0,
    sessies: 0,
    btw: 0,
    custom: true,
  };
  const list = loadCustom();
  list.push(entry);
  saveCustom(list);
  const pn = String(pasnummer ?? '').trim();
  if (pn) setPassOverride(id, { pasnummer: pn });
  return { ok: true };
}

/** Alleen voor migratie/tests; gebruik movePassToTrash in de UI. */
export function removeCustomPass(id) {
  const list = loadCustom().filter((p) => p.id !== id);
  saveCustom(list);
}
