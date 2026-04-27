const STORAGE_KEY = 'laadsmart_voorblad_reset_passen';

export function loadVoorbladResetPassen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x) => typeof x === 'string' && x.length > 0));
  } catch {
    return new Set();
  }
}

export function saveVoorbladResetPassen(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore quota / private mode
  }
}
