import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MAANDEN = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

function GrafiekKosten({ sessies }) {
  const data = useMemo(() => {
    const perMaand = {};
    for (const s of sessies) {
      if (!s.datum) continue;
      const datum = new Date(s.datum);
      const key = `${datum.getFullYear()}-${datum.getMonth()}`;
      if (!perMaand[key]) {
        perMaand[key] = {
          naam: `${MAANDEN[datum.getMonth()]} ${datum.getFullYear()}`,
          incl: 0,
          btw: 0,
          excl: 0,
          sessies: 0,
          jaar: datum.getFullYear(),
          maand: datum.getMonth(),
        };
      }
      perMaand[key].incl += Number(s.bedrag ?? 0);
      perMaand[key].btw += Number(s.btw ?? 0);
      perMaand[key].excl += Number(s.bedrag ?? 0) - Number(s.btw ?? 0);
      perMaand[key].sessies += 1;
    }
    return Object.values(perMaand)
      .sort((a, b) => a.jaar !== b.jaar ? a.jaar - b.jaar : a.maand - b.maand)
      .map(m => ({
        ...m,
        incl: parseFloat(m.incl.toFixed(2)),
        btw: parseFloat(m.btw.toFixed(2)),
        excl: parseFloat(m.excl.toFixed(2)),
      }));
  }, [sessies]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px 16px', fontSize: '13px' }}>
        <div style={{ color: 'white', fontWeight: '700', marginBottom: '8px' }}>{label}</div>
        <div style={{ color: '#c8ff00', marginBottom: '4px' }}>Totaal incl. BTW: €{d?.incl?.toFixed(2)}</div>
        <div style={{ color: '#6db88a', marginBottom: '4px' }}>Excl. BTW: €{d?.excl?.toFixed(2)}</div>
        <div style={{ color: '#a8f0c6', marginBottom: '4px' }}>BTW: €{d?.btw?.toFixed(2)}</div>
        <div style={{ color: '#6db88a' }}>Sessies: {d?.sessies}</div>
      </div>
    );
  };

  if (sessies.length === 0) {
    return (
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '24px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
        <div style={{ color: '#6db88a', fontSize: '14px' }}>Voeg sessies toe om je grafiek te zien</div>
      </div>
    );
  }

  if (data.length === 0) return null;

  const maxWaarde = Math.max(...data.map(d => d.incl));
  const gemiddeld = data.reduce((sum, d) => sum + d.incl, 0) / data.length;
  const totaalAlles = data.reduce((sum, d) => sum + d.incl, 0);
  const totaalBtwAlles = data.reduce((sum, d) => sum + d.btw, 0);

  return (
    <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>📊 Kosten per maand</div>
      <p style={{ fontSize: '12px', color: '#6db88a', marginBottom: '16px', lineHeight: 1.4 }}>
        Overzicht van al je laadkosten per maand inclusief BTW.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '80px', background: '#0a2e1a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', marginBottom: '4px' }}>Totaal</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#c8ff00' }}>€{totaalAlles.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: '80px', background: '#0a2e1a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', marginBottom: '4px' }}>Gem./maand</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>€{gemiddeld.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: '80px', background: '#0a2e1a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', marginBottom: '4px' }}>Totaal BTW</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#a8f0c6' }}>€{totaalBtwAlles.toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, minWidth: '80px', background: '#0a2e1a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#6db88a', marginBottom: '4px' }}>Hoogste</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>€{maxWaarde.toFixed(2)}</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f6b3d" vertical={false} />
          <XAxis
            dataKey="naam"
            tick={{ fill: '#6db88a', fontSize: 10 }}
            axisLine={{ stroke: '#1f6b3d' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6db88a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `€${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1f6b3d55' }} />
          <Bar dataKey="excl" name="Excl. BTW" stackId="a" fill="#2ecc71" radius={[0, 0, 0, 0]} />
          <Bar dataKey="btw" name="BTW 21%" stackId="a" fill="#c8ff00" radius={[6, 6, 0, 0]} />
          <Legend
            formatter={(value) => <span style={{ color: '#6db88a', fontSize: '11px' }}>{value}</span>}
            wrapperStyle={{ paddingTop: '8px' }}
          />
        </BarChart>
      </ResponsiveContainer>

      <p style={{ fontSize: '11px', color: '#6db88a', marginTop: '12px', lineHeight: 1.4 }}>
        Groen = excl. BTW · Geel-groen = BTW 21% · Samen = totaal incl. BTW
      </p>
    </div>
  );
}

export default GrafiekKosten;
