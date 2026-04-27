import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths in CRA
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    try {
      map.setView(center, map.getZoom(), { animate: true });
    } catch {
      // ignore
    }
  }, [center, map]);
  return null;
}

function fmtPrijs(usageCost) {
  const raw = String(usageCost ?? '').trim();
  if (!raw) return null;
  return raw.length > 140 ? raw.slice(0, 140) + '…' : raw;
}

export default function LaadpalenKaart({ onToast }) {
  const [center, setCenter] = useState([52.1326, 5.2913]); // NL
  const [distanceKm, setDistanceKm] = useState(10);
  const [laden, setLaden] = useState(false);
  const [punten, setPunten] = useState([]);
  const [error, setError] = useState('');

  const apiUrl = useMemo(() => {
    const [lat, lng] = center;
    const dist = Math.max(1, Math.min(50, Number(distanceKm) || 10));
    const url = new URL('https://api.openchargemap.io/v3/poi/');
    url.searchParams.set('output', 'json');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('distance', String(dist));
    url.searchParams.set('distanceunit', 'KM');
    url.searchParams.set('maxresults', '50');
    url.searchParams.set('compact', 'true');
    url.searchParams.set('verbose', 'false');
    return url.toString();
  }, [center, distanceKm]);

  const vraagLocatie = () => {
    if (!('geolocation' in navigator)) {
      setError('Locatie is niet beschikbaar in deze browser.');
      if (onToast) onToast('Locatie niet beschikbaar in deze browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter([lat, lng]);
        if (onToast) onToast('Locatie gevonden. Kaart bijgewerkt.', 'info');
      },
      () => {
        setError('Toestemming voor locatie geweigerd of locatie niet beschikbaar.');
        if (onToast) onToast('Geen locatie-toestemming. Gebruik de kaart (NL) of probeer opnieuw.', 'error');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  };

  const laad = async () => {
    setLaden(true);
    setError('');
    try {
      const res = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const items = Array.isArray(json) ? json : [];
      setPunten(items);
      if (onToast) onToast(`Gevonden: ${items.length} laadpunt(en).`, 'info');
    } catch (e) {
      setError('Kon laadpalen niet ophalen. Probeer later opnieuw.');
      if (onToast) onToast('Kaart: ophalen mislukt.', 'error');
      setPunten([]);
    } finally {
      setLaden(false);
    }
  };

  useEffect(() => {
    // initial load
    void laad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  return (
    <div style={{ padding: '0 0 16px' }}>
      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '14px 14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>🗺️ Laadpalen in de buurt</div>
            <div style={{ fontSize: '12px', color: '#6db88a', marginTop: '4px', lineHeight: 1.45 }}>
              Bron: OpenChargeMap. Prijzen worden alleen getoond als de aanbieder ze meelevert.
            </div>
          </div>
          <button
            type="button"
            onClick={vraagLocatie}
            style={{ background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '10px 12px', color: '#c8ff00', fontWeight: '800', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
          >
            Gebruik mijn locatie
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6db88a', fontWeight: '700' }}>Afstand</span>
            <select
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              style={{ background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '10px', padding: '10px 10px', color: 'white', fontSize: '13px' }}
            >
              {[5, 10, 15, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n} km
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={laad}
            disabled={laden}
            style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '10px 12px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', opacity: laden ? 0.7 : 1 }}
          >
            {laden ? 'Laden…' : 'Ververs'}
          </button>
          {error && <div style={{ fontSize: '12px', color: '#ffb3b3', fontWeight: '700' }}>{error}</div>}
        </div>
      </div>

      <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #1f6b3d', marginBottom: '12px' }}>
        <MapContainer center={center} zoom={12} style={{ height: '320px', width: '100%', background: '#0a2e1a' }}>
          <Recenter center={center} />
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {punten.map((p) => {
            const lat = p?.AddressInfo?.Latitude;
            const lng = p?.AddressInfo?.Longitude;
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            const titel = p?.AddressInfo?.Title || 'Laadpunt';
            const usage = fmtPrijs(p?.UsageCost);
            return (
              <Marker key={p.ID} position={[lat, lng]}>
                <Popup>
                  <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>{titel}</div>
                  <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                    {p?.AddressInfo?.AddressLine1 ? <div>{p.AddressInfo.AddressLine1}</div> : null}
                    {p?.AddressInfo?.Town ? <div>{p.AddressInfo.Town}</div> : null}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <strong>Prijs</strong>: {usage ? usage : 'Onbekend'}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div style={{ background: '#0f3d22', border: '1px solid #1f6b3d', borderRadius: '16px', padding: '14px 14px' }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#c8ff00', marginBottom: '10px' }}>Resultaten</div>
        {punten.length === 0 ? (
          <div style={{ color: '#6db88a', fontSize: '13px' }}>Geen laadpalen gevonden in deze straal.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {punten.slice(0, 20).map((p) => {
              const titel = p?.AddressInfo?.Title || 'Laadpunt';
              const usage = fmtPrijs(p?.UsageCost);
              const addr = [p?.AddressInfo?.AddressLine1, p?.AddressInfo?.Town].filter(Boolean).join(' · ');
              return (
                <div key={p.ID} style={{ background: '#0a2e1a', border: '1px solid #1f6b3d', borderRadius: '12px', padding: '12px' }}>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '13px' }}>{titel}</div>
                  {addr && <div style={{ color: '#6db88a', fontSize: '12px', marginTop: '4px' }}>{addr}</div>}
                  <div style={{ color: '#a8f0c6', fontSize: '12px', marginTop: '6px' }}>
                    <strong style={{ color: '#c8ff00' }}>Prijs</strong>: {usage ? usage : 'Onbekend'}
                  </div>
                </div>
              );
            })}
            {punten.length > 20 && <div style={{ color: '#6db88a', fontSize: '12px' }}>Toont 20 van {punten.length} resultaten.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

