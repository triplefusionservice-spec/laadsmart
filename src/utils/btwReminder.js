const STORAGE_BTW_REMINDER_ENABLED = 'laadsmart_btw_reminder_enabled';
const STORAGE_BTW_REMINDER_BROWSER_NOTIF = 'laadsmart_btw_reminder_browser_notif';
const STORAGE_BTW_REMINDER_LAST_SHOWN = 'laadsmart_btw_reminder_last_shown';

export function loadBtwReminderEnabled() {
  try {
    return localStorage.getItem(STORAGE_BTW_REMINDER_ENABLED) === '1';
  } catch {
    return false;
  }
}

export function saveBtwReminderEnabled(enabled) {
  try {
    localStorage.setItem(STORAGE_BTW_REMINDER_ENABLED, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

export function loadBtwReminderBrowserNotif() {
  try {
    return localStorage.getItem(STORAGE_BTW_REMINDER_BROWSER_NOTIF) === '1';
  } catch {
    return false;
  }
}

export function saveBtwReminderBrowserNotif(enabled) {
  try {
    localStorage.setItem(STORAGE_BTW_REMINDER_BROWSER_NOTIF, enabled ? '1' : '0');
  } catch {
    // ignore
  }
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatDatumNl(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function volgendeBtwDeadline(vanaf = new Date()) {
  const d = new Date(vanaf);
  if (Number.isNaN(d.getTime())) return null;

  const y = d.getFullYear();
  const m = d.getMonth(); // 0-based

  // Kwartaal-einde maanden: maart (2), juni (5), sep (8), dec (11)
  // Deadline: laatste dag van maand ná kwartaal-einde:
  // Q1 -> 30 apr, Q2 -> 31 jul, Q3 -> 31 okt, Q4 -> 31 jan (volgend jaar)
  let deadlineYear = y;
  let deadlineMonth;
  if (m <= 2) deadlineMonth = 3; // apr
  else if (m <= 5) deadlineMonth = 6; // jul
  else if (m <= 8) deadlineMonth = 9; // okt
  else { deadlineMonth = 0; deadlineYear = y + 1; } // jan next year

  // laatste dag van deadlineMonth
  const lastDay = new Date(deadlineYear, deadlineMonth + 1, 0);
  return lastDay;
}

export function dagenTot(target, vanaf = new Date()) {
  const t = new Date(target);
  const v = new Date(vanaf);
  if (Number.isNaN(t.getTime()) || Number.isNaN(v.getTime())) return null;
  const ms = t.getTime() - v.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function shouldShowBtwReminderToday(now = new Date()) {
  try {
    const key = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    return localStorage.getItem(STORAGE_BTW_REMINDER_LAST_SHOWN) !== key;
  } catch {
    return true;
  }
}

export function markBtwReminderShownToday(now = new Date()) {
  try {
    const key = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    localStorage.setItem(STORAGE_BTW_REMINDER_LAST_SHOWN, key);
  } catch {
    // ignore
  }
}

