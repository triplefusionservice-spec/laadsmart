import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDatumNlIso } from './sessieFilters';

function escapeCsvCell(val) {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const DISCLAIMER =
  'Dit overzicht is een hulpmiddel voor administratie en BTW-verwerking. ' +
  'Controleer bedragen aan de hand van je facturen en bankafschriften. ' +
  'Bij twijfel of complexe situaties: raadpleeg je belastingadviseur of de Belastingdienst.';

function bestandsnaamFragment(van, tot) {
  const v = String(van || '').replace(/\//g, '-');
  const t = String(tot || '').replace(/\//g, '-');
  if (v && t) return `${v}_${t}`;
  return new Date().toISOString().slice(0, 10);
}

function pasnrVoorNaam(meta, naam) {
  const m = meta?.pasnummerByNaam;
  if (!m || naam == null) return '';
  const v = m[String(naam)];
  if (v == null || String(v).trim() === '') return '';
  return String(v).trim();
}

function buildCsvRows(sessies, totalen, meta) {
  const lines = [];
  lines.push(['LaadSmart — overzicht elektrisch laden (BTW)'].map(escapeCsvCell).join(','));
  lines.push(['Rapportperiode (filter)', `${meta.van} t/m ${meta.tot}`].map(escapeCsvCell).join(','));
  if (meta.periodeLabel) lines.push(['Periode (label)', meta.periodeLabel].map(escapeCsvCell).join(','));
  if (meta.administratieNaam?.trim()) {
    lines.push(['Administratie / onderneming', meta.administratieNaam.trim()].map(escapeCsvCell).join(','));
  }
  if (meta.email) lines.push(['Account (referentie)', meta.email].map(escapeCsvCell).join(','));
  if (meta.geselecteerdePassen?.length) {
    lines.push(['Geselecteerde laadpassen', meta.geselecteerdePassen.join('; ')].map(escapeCsvCell).join(','));
  }
  lines.push(['BTW-tarief sessies', '21% (hoog)'].map(escapeCsvCell).join(','));
  lines.push('');
  if (meta.totalenPerPas && Object.keys(meta.totalenPerPas).length > 0) {
    lines.push(['Samenvatting per leverancier'].map(escapeCsvCell).join(','));
    lines.push(['Leverancier', 'Pasnr.', 'Sessies', 'Excl. BTW', 'BTW 21%', 'Incl. BTW'].map(escapeCsvCell).join(','));
    const namen = Object.keys(meta.totalenPerPas).sort((a, b) => a.localeCompare(b, 'nl'));
    for (const naam of namen) {
      const r = meta.totalenPerPas[naam];
      const incl = Number(r.bedrag ?? 0);
      const btw = Number(r.btw ?? 0);
      lines.push(
        [naam, pasnrVoorNaam(meta, naam), r.sessies, (incl - btw).toFixed(2), btw.toFixed(2), incl.toFixed(2)]
          .map(escapeCsvCell)
          .join(',')
      );
    }
    lines.push('');
  }
  lines.push(['Specificatie (alle sessies in selectie)'].map(escapeCsvCell).join(','));
  lines.push(['Datum (dd-mm-jjjj)', 'Leverancier', 'Pasnr.', 'kWh', 'Excl. BTW', 'BTW 21%', 'Incl. BTW'].map(escapeCsvCell).join(','));
  if (!sessies.length) {
    lines.push(
      ['—', 'Geen sessies in deze periode voor de gekozen laadpassen', '', '', '0.00', '0.00', '0.00'].map(escapeCsvCell).join(',')
    );
  }
  for (const s of sessies) {
    const incl = Number(s.bedrag ?? 0);
    const btw = Number(s.btw ?? 0);
    const excl = incl - btw;
    lines.push(
      [
        formatDatumNlIso(s.datum),
        s.pas_naam,
        pasnrVoorNaam(meta, s.pas_naam),
        s.kwh,
        excl.toFixed(2),
        btw.toFixed(2),
        incl.toFixed(2),
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  lines.push('');
  lines.push(
    ['Totaal excl. BTW', '', '', '', Number(totalen.exclBtw ?? 0).toFixed(2), '', ''].map(escapeCsvCell).join(',')
  );
  lines.push(
    ['Totaal BTW 21%', '', '', '', '', Number(totalen.totaalBtw ?? 0).toFixed(2), ''].map(escapeCsvCell).join(',')
  );
  lines.push(
    ['Totaal incl. BTW', '', '', '', '', '', Number(totalen.totaal ?? 0).toFixed(2)].map(escapeCsvCell).join(',')
  );
  lines.push('');
  lines.push([DISCLAIMER].map(escapeCsvCell).join(','));
  return lines.join('\r\n');
}

/**
 * @param {object} meta — { email, administratieNaam, van, tot, periodeLabel, geselecteerdePassen, totalenPerPas, pasnummerByNaam }
 */
export function downloadMaandrapportCsv(sessies, rapportTotalen, meta = {}) {
  const csv = buildCsvRows(sessies, rapportTotalen, meta);
  const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laadsmart-btw-${bestandsnaamFragment(meta.van, meta.tot)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {object} meta — zie downloadMaandrapportCsv
 */
export function downloadMaandrapportPdf(sessies, rapportTotalen, meta = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = 16;
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('Overzicht elektrisch laden (BTW)', margin, y);
  y += 7;
  if (meta.administratieNaam?.trim()) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(18, 70, 38);
    const orgLines = doc.splitTextToSize(`Administratie / onderneming: ${meta.administratieNaam.trim()}`, 182);
    doc.text(orgLines, margin, y);
    y += orgLines.length * 5.2;
    doc.setFont('helvetica', 'normal');
  }
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Rapportperiode: ${formatDatumNlIso(meta.van)} t/m ${formatDatumNlIso(meta.tot)}`, margin, y);
  y += 5;
  if (meta.periodeLabel) {
    doc.text(`(${meta.periodeLabel})`, margin, y);
    y += 5;
  }
  if (meta.email) {
    doc.text(`Referentie account: ${meta.email}`, margin, y);
    y += 5;
  }
  if (meta.geselecteerdePassen?.length) {
    const passen = meta.geselecteerdePassen.join(', ');
    const split = doc.splitTextToSize(`Geselecteerde laadpassen: ${passen}`, 180);
    doc.text(split, margin, y);
    y += 4 + split.length * 4.5;
  }
  doc.text('BTW-tarief op sessies: 21% (hoog)', margin, y);
  y += 6;
  doc.setTextColor(0, 0, 0);

  const totalenPerPas = meta.totalenPerPas || {};
  const pasNamen = Object.keys(totalenPerPas).sort((a, b) => a.localeCompare(b, 'nl'));
  if (pasNamen.length > 0) {
    const bodySamen = pasNamen.map((naam) => {
      const r = totalenPerPas[naam];
      const incl = Number(r.bedrag ?? 0);
      const btw = Number(r.btw ?? 0);
      const excl = incl - btw;
      return [naam, pasnrVoorNaam(meta, naam) || '—', String(r.sessies), `€${excl.toFixed(2)}`, `€${btw.toFixed(2)}`, `€${incl.toFixed(2)}`];
    });
    autoTable(doc, {
      startY: y,
      head: [['Leverancier', 'Pasnr.', 'Sessies', 'Excl. BTW', 'BTW 21%', 'Incl. BTW']],
      body: bodySamen,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [26, 92, 52], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 8;
  }

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Specificatie — alle sessies in bovenstaande selectie', margin, y);
  y += 5;
  doc.setTextColor(0, 0, 0);

  const body = sessies.map((s) => {
    const incl = Number(s.bedrag ?? 0);
    const btw = Number(s.btw ?? 0);
    const excl = incl - btw;
    return [
      formatDatumNlIso(s.datum),
      String(s.pas_naam ?? ''),
      pasnrVoorNaam(meta, s.pas_naam) || '—',
      String(s.kwh ?? ''),
      `€${excl.toFixed(2)}`,
      `€${btw.toFixed(2)}`,
      `€${incl.toFixed(2)}`,
    ];
  });

  if (body.length === 0) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Geen sessieregels in deze selectie (lege specificatie, totalen € 0,00).', margin, y + 4);
    y += 12;
    doc.setTextColor(0, 0, 0);
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Datum', 'Leverancier', 'Pasnr.', 'kWh', 'Excl. BTW', 'BTW', 'Incl. BTW']],
      body,
      styles: { fontSize: 7, cellPadding: 1.8 },
      headStyles: { fillColor: [15, 61, 34], textColor: 255 },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable?.finalY ?? y + 40;
  }

  let sumY = y + 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Totaal incl. BTW: €${Number(rapportTotalen.totaal ?? 0).toFixed(2)}`, margin, sumY);
  sumY += 6;
  doc.text(`Totaal excl. BTW: €${Number(rapportTotalen.exclBtw ?? 0).toFixed(2)}`, margin, sumY);
  sumY += 6;
  doc.setTextColor(26, 92, 52);
  doc.text(`Terug te vorderen / te verrekenen BTW (21%): €${Number(rapportTotalen.totaalBtw ?? 0).toFixed(2)}`, margin, sumY);
  sumY += 10;
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const disc = doc.splitTextToSize(DISCLAIMER, 182);
  doc.text(disc, margin, sumY);
  sumY += disc.length * 3.6 + 4;
  doc.setTextColor(120, 120, 120);
  doc.text(`Gegenereerd: ${new Date().toLocaleString('nl-NL')}`, margin, sumY);

  doc.save(`laadsmart-btw-${bestandsnaamFragment(meta.van, meta.tot)}.pdf`);
}
