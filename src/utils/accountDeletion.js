import { supabaseUrl, supabaseAnonKey } from '../supabase';

const LAADSMART_STORAGE_PREFIX = 'laadsmart_';

function removeStorageKeysWithPrefix(storage) {
  if (!storage) return;
  let keys;
  try {
    keys = Object.keys(storage);
  } catch {
    return;
  }
  for (const key of keys) {
    if (key.startsWith(LAADSMART_STORAGE_PREFIX)) {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Wist alle LaadSmart-appdata in de browser (localStorage + sessionStorage, alle sleutels `laadsmart_*`).
 * Supabase Auth-sessie wist je daarna met `signOut()`.
 */
export function clearLaadsmartLocalStorage() {
  removeStorageKeysWithPrefix(typeof localStorage !== 'undefined' ? localStorage : null);
  removeStorageKeysWithPrefix(typeof sessionStorage !== 'undefined' ? sessionStorage : null);
}

/**
 * Verwijdert alle cloud-rijen in `public.sessies` voor dit account (kolom `user_id` + RLS die delete toestaat).
 */
export async function deleteUserSessies(supabase, userId) {
  const { error } = await supabase.from('sessies').delete().eq('user_id', userId);
  return { error };
}

/**
 * Zelf verwijderen bij Supabase Auth (JWT). Vereist een actief access token.
 * Zet in Supabase Dashboard → Authentication → ondersteuning voor gebruikers zelf te laten verwijderen indien nodig.
 */
export async function deleteCurrentUserAuthAccount(accessToken) {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseAnonKey,
    },
  });
  if (!res.ok) {
    let message = `Verwijderen mislukt (HTTP ${res.status}).`;
    try {
      const body = await res.json();
      message =
        body.error_description ||
        body.msg ||
        body.message ||
        body.error ||
        message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text.slice(0, 240);
      } catch {
        // keep default
      }
    }
    throw new Error(message);
  }
}
