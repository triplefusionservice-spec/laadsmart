import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[";\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function sortedSessies(sessies) {
  return [...sessies].sort((a, b) => {
    const da = String(a.datum ?? '');
    const db = String(b.datum ?? '');
    if (da !== db) return da.localeCompare(db);
    return Number(a.id ?? 0) - Number(b.id ?? 0);
  });
}

function rapportFilename(ext) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `LaadSmart_rapport_${stamp}.${ext}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {object[]} sessies
 * @param {{ totaal: number; exclBtw: number; totaalBtw: number }} totals
 * @param {string} [accountEmail]
 */
export function downloadMaandrapportCsv(sessies, totals, accountEmail = '') {
  const rows = sortedSessies(sessies);
  const sep = ';';
  const header = ['Datum', 'Laadpas', 'kWh', 'Bedrag incl. BTW (EUR)', 'BTW (EUR)', 'Excl. BTW (EUR)'];
  const lines = ['LaadSmart maandrapport'];
  if (accountEmail) lines.push(`Account: ${accountEmail}`);
  lines.push(
    '',
    ['Totaal incl. BTW', totals.totaal.toFixed(2)].map(escapeCsvCell).join(sep),
    ['Totaal excl. BTW', totals.exclBtw.toFixed(2)].map(escapeCsvCell).join(sep),
    ['Terug te vorderen BTW', totals.totaalBtw.toFixed(2)].map(escapeCsvCell).join(sep),
    ['Aantal sessies', String(rows.length)].map(escapeCsvCell).join(sep),
    '',
    header.map(escapeCsvCell).join(sep),
    ...rows.map((s) => {
      const bed = Number(s.bedrag ?? 0);
      const btw = Number(s.btw ?? 0);
      const excl = bed - btw;
      return [
        escapeCsvCell(s.datum),
        escapeCsvCell(s.pas_naam),
        escapeCsvCell(s.kwh),
        escapeCsvCell(bed.toFixed(2)),
        escapeCsvCell(btw.toFixed(2)),
        escapeCsvCell(excl.toFixed(2)),
      ].join(sep);
    }),
  );
  const csv = `\uFEFF${lines.join('\r\n')}`;
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), rapportFilename('csv'));
}

/**
 * @param {object[]} sessies
 * @param {{ totaal: number; exclBtw: number; totaalBtw: number }} totals
 * @param {string} [accountEmail]
 */
export function downloadMaandrapportPdf(sessies, totals, accountEmail = '') {
  const rows = sortedSessies(sessies);
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 16;

  doc.setFontSize(16);
  doc.setTextColor(10, 46, 26);
  doc.text('LaadSmart — maandrapport', 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  if (accountEmail) {
    doc.text(`Account: ${accountEmail}`, 14, y);
    y += 6;
  }
  doc.text(`Gegenereerd: ${new Date().toLocaleString('nl-NL')}`, 14, y);
  y += 10;

  doc.setDrawColor(31, 107, 61);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageW - 14, y);
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(10, 46, 26);
  doc.text('Samenvatting', 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  const sam = [
    ['Totaal incl. BTW', `€ ${totals.totaal.toFixed(2)}`],
    ['Totaal excl. BTW', `€ ${totals.exclBtw.toFixed(2)}`],
    ['Terug te vorderen BTW', `€ ${totals.totaalBtw.toFixed(2)}`],
    ['Aantal sessies', String(rows.length)],
  ];
  sam.forEach(([label, val]) => {
    doc.text(label, 14, y);
    doc.text(val, pageW - 14, y, { align: 'right' });
    y += 6;
  });
  y += 4;

  const body = rows.map((s) => {
    const bed = Number(s.bedrag ?? 0);
    const btw = Number(s.btw ?? 0);
    return [
      String(s.datum ?? ''),
      String(s.pas_naam ?? ''),
      String(s.kwh ?? ''),
      bed.toFixed(2),
      btw.toFixed(2),
      (bed - btw).toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Datum', 'Laadpas', 'kWh', 'Incl. BTW', 'BTW', 'Excl. BTW']],
    body,
    theme: 'striped',
    headStyles: { fillColor: [26, 92, 52], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 28 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const footerY = doc.internal.pageSize.getHeight() - 8;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('LaadSmart — laadkosten overzicht', 14, footerY);
      doc.text(`Pagina ${data.pageNumber}`, pageW - 14, footerY, { align: 'right' });
    },
  });

  doc.save(rapportFilename('pdf'));
}
