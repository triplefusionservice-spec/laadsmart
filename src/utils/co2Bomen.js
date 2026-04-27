/**
 * Indicatieve besparing t.o.v. gemiddelde benzineauto (vereenvoudigde schatting, geen formeel milieurapport).
 * Bronnen variëren; factor ca. 0,35–0,55 kg CO₂/kWh in NL-literatuur voor EV vs ICE.
 */
export const CO2_KG_PER_KWH_INDICATIEF = 0.41;

/** Grove schatting opname één volwassen boom per jaar (kg CO₂-eq), afgerond voor leesbaarheid. */
export const CO2_KG_PER_BOOM_PER_JAAR = 22;

export function berekenCo2EnBomen(totaalKwh) {
  const kwh = Number(totaalKwh);
  if (!Number.isFinite(kwh) || kwh <= 0) return { co2Kg: 0, bomenJaren: 0 };
  const co2Kg = kwh * CO2_KG_PER_KWH_INDICATIEF;
  const bomenJaren = co2Kg / CO2_KG_PER_BOOM_PER_JAAR;
  return { co2Kg, bomenJaren };
}
