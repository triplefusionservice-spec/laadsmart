const STORAGE_KEY = 'laadsmart_administratie_naam';

export function loadAdministratieNaam() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveAdministratieNaam(value) {
  try {
    const raw = String(value ?? '');
    if (raw.trim() === '') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // ignore
  }
}
