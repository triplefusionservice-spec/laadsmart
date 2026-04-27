import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { HELP_ONDERWERPEN, tipVoorScherm, zoekHelpAntwoord } from '../data/helpKennis';

function formatInhoudMarkdownLight(text) {
  return String(text || '').split('\n').map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ margin: i === 0 ? '0 0 8px' : '8px 0', fontSize: '13px', color: '#e8fff0', lineHeight: 1.55 }}>
        {parts.map((chunk, j) => {
          if (chunk.startsWith('**') && chunk.endsWith('**')) {
            return (
              <strong key={j} style={{ color: 'white' }}>
                {chunk.slice(2, -2)}
              </strong>
            );
          }
          return chunk;
        })}
      </p>
    );
  });
}

/**
 * “Help AI”: vaste kennis + trefwoordzoeker. Geen externe modellen.
 */
function HelpAiModal({ onSluiten, huidigScherm }) {
  const [filter, setFilter] = useState('');
  const [vraag, setVraag] = useState('');
  const [chat, setChat] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [activeQuickVraag, setActiveQuickVraag] = useState(null);
  const [quickAntwoordOpen, setQuickAntwoordOpen] = useState(true);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const quickAntwoordRef = useRef(null);
  const chatRef = useRef(null);

  const handleClose = useCallback(() => {
    // Reset zodat openen weer “bovenaan” start.
    setFilter('');
    setVraag('');
    setChat([]);
    setOpenId(null);
    setActiveQuickVraag(null);
    setQuickAntwoordOpen(true);
    try {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    } catch {
      // ignore
    }
    onSluiten();
  }, [onSluiten]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const gefilterdeOnderwerpen = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return HELP_ONDERWERPEN;
    return HELP_ONDERWERPEN.filter((o) => {
      const blob = `${o.titel} ${o.trefwoorden.join(' ')} ${o.inhoud}`.toLowerCase();
      return blob.includes(q);
    });
  }, [filter]);

  const quickVragen = useMemo(
    () => [
      'Hoe werkt de app?',
      'Werkt niet / foutmelding',
      'Hoe voeg ik een sessie toe?',
      'Hoe wijzig ik de volgorde van passen?',
      'Slepen werkt niet op mijn telefoon',
      'Bedrag klopt niet (te hoog/laag)',
      'Hoe download ik een rapport (PDF/CSV)?',
      'Wat is het verschil tussen Privé en Zakelijk?',
      'Hoe werkt de prullenbak?',
      'Sessie verwijderen of aanpassen',
      'Hoe wijzig ik mijn wachtwoord?',
      'Hoe wijzig ik mijn e-mail?',
      'Wat is 2FA en hoe stel ik het in?',
      'Wat wordt lokaal onthouden?',
    ],
    []
  );

  const stuurVraag = () => {
    const trimmed = vraag.trim();
    if (!trimmed) return;
    // “Snelle vraag” antwoord (indien open) wegklappen zodat je naar het gesprek scrollt.
    if (activeQuickVraag) {
      setActiveQuickVraag(null);
      setQuickAntwoordOpen(true);
    }
    const result = zoekHelpAntwoord(trimmed);
    setChat((prev) => [...prev, { rol: 'jij', tekst: trimmed }]);
    setVraag('');
    if (result.type === 'leeg') {
      setChat((prev) => [
        ...prev,
        {
          rol: 'help',
          tekst:
            'Stel een concrete vraag (bijv. “hoe werkt de prullenbak?” of “waar staat BTW?”). Ik zoek in vaste uitleg in de app — geen live verbinding met een externe AI.',
        },
      ]);
      return;
    }
    if (result.type === 'geen_treffer') {
      setChat((prev) => [
        ...prev,
        {
          rol: 'help',
          tekst:
            'Geen passend antwoord gevonden in de vaste uitleg. Probeer woorden als: laadpas, sessie, rapport, PDF, account, wachtwoord, 2FA, import, prullenbak. Of open een onderwerp hieronder.',
        },
      ]);
      return;
    }
    setChat((prev) => [...prev, { rol: 'help', items: result.items }]);
  };

  const setQuickVraag = (q) => {
    const trimmed = String(q || '').trim();
    if (!trimmed) return;
    if (activeQuickVraag === trimmed) {
      // Uitklikken: terug naar boven, antwoord weg.
      setActiveQuickVraag(null);
      setChat([]);
      setQuickAntwoordOpen(true);
      try {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      } catch {
        // ignore
      }
      return;
    }
    setActiveQuickVraag(trimmed);
    setQuickAntwoordOpen(true);
    const result = zoekHelpAntwoord(trimmed);
    if (result.type === 'treffers') setChat([{ rol: 'jij', tekst: trimmed }, { rol: 'help', items: result.items }]);
    else setChat([{ rol: 'jij', tekst: trimmed }, { rol: 'help', tekst: 'Geen passend antwoord gevonden. Probeer andere woorden of open een onderwerp.' }]);
  };

  useEffect(() => {
    if (!activeQuickVraag) return;
    if (!quickAntwoordOpen) return;
    // Na render: scroll naar antwoord.
    const el = quickAntwoordRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    try {
      const top = el.offsetTop - 12;
      container.scrollTo({ top, behavior: 'smooth' });
    } catch {
      // ignore
    }
  }, [activeQuickVraag, quickAntwoordOpen, chat.length]);

  useEffect(() => {
    if (activeQuickVraag) return;
    if (chat.length === 0) return;
    const el = chatRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;
    // Na render: scroll naar “Gesprek” / antwoord.
    try {
      const top = el.offsetTop - 12;
      container.scrollTo({ top, behavior: 'smooth' });
    } catch {
      // ignore
    }
  }, [chat.length, activeQuickVraag]);

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.78)',
    zIndex: 400,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 12px max(16px, env(safe-area-inset-bottom))',
    boxSizing: 'border-box',
  };

  const panelStyle = {
    background: '#0a2e1a',
    border: '1px solid #1f6b3d',
    borderRadius: '20px 20px 12px 12px',
    width: 'min(390px, 100%)',
    maxHeight: 'min(88vh, 720px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const inputStyle = {
    background: '#0f3d22',
    border: '1px solid #1f6b3d',
    borderRadius: '12px',
    padding: '12px',
    color: 'white',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div style={overlayStyle} role="presentation" onClick={handleClose}>
      <div style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="help-ai-title" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1f6b3d', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <h2 id="help-ai-title" style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'white' }}>
                Help <span style={{ color: '#c8ff00' }}>&amp; uitleg</span>
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#6db88a', lineHeight: 1.45 }}>
                Geen externe AI: antwoorden komen uit vaste teksten in de app. Je gegevens worden niet naar een chatmodel gestuurd.
              </p>
            </div>
            <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', color: '#6db88a', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }} aria-label="Sluiten">
              ✕
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#a8f0c6', lineHeight: 1.45, padding: '8px 10px', background: '#0f3d22', borderRadius: '10px', border: '1px solid #1f6b3d' }}>
            {tipVoorScherm(huidigScherm)}
          </div>
        </div>

        <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 18px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="help-zoek" style={{ fontSize: '11px', color: '#6db88a', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Zoek in onderwerpen
            </label>
            <input
              id="help-zoek"
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="bijv. rapport, BTW, prullenbak…"
              style={inputStyle}
              autoComplete="off"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#c8ff00', marginBottom: '8px' }}>Snelle vragen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {quickVragen.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuickVraag(q)}
                  style={{
                    background: activeQuickVraag === q ? '#1a5c34' : '#0f3d22',
                    border: activeQuickVraag === q ? '1px solid #2a8f52' : '1px solid #1f6b3d',
                    borderRadius: '999px',
                    padding: '8px 10px',
                    color: '#e8fff0',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {activeQuickVraag && (
            <div ref={quickAntwoordRef} style={{ marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setQuickAntwoordOpen((v) => !v)}
                style={{
                  width: '100%',
                  background: '#0f3d22',
                  border: '1px solid #1f6b3d',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#c8ff00' }}>Antwoord</span>
                <span style={{ fontSize: '12px', color: '#c8ff00' }}>{quickAntwoordOpen ? '▲' : '▼'}</span>
              </button>
              {quickAntwoordOpen && (
                <div style={{ marginTop: '10px' }}>
                  {chat.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: '10px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        background: b.rol === 'jij' ? '#1a5c34' : '#0f3d22',
                        border: `1px solid ${b.rol === 'jij' ? '#2a8f52' : '#1f6b3d'}`,
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#6db88a', marginBottom: '4px' }}>{b.rol === 'jij' ? 'Jij' : 'Assistent'}</div>
                      {b.rol === 'help' && b.items ? (
                        <div>
                          {b.items.map((o) => (
                            <div key={o.id} style={{ marginBottom: '10px' }}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '6px' }}>{o.titel}</div>
                              {formatInhoudMarkdownLight(o.inhoud)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#e8fff0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{b.tekst ?? ''}</div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuickVraag(activeQuickVraag)}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      background: 'transparent',
                      border: '1px solid #1f6b3d',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      color: '#6db88a',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Antwoord sluiten
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: '700', color: '#c8ff00', marginBottom: '8px' }}>Onderwerpen</div>
          {gefilterdeOnderwerpen.length === 0 ? (
            <p style={{ color: '#6db88a', fontSize: '13px' }}>Geen onderwerp past bij je zoekterm.</p>
          ) : (
            gefilterdeOnderwerpen.map((o) => (
              <div key={o.id} style={{ marginBottom: '10px', border: '1px solid #1f6b3d', borderRadius: '12px', overflow: 'hidden', background: '#0f3d22' }}>
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === o.id ? null : o.id))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 14px',
                    background: openId === o.id ? '#1a5c34' : 'transparent',
                    border: 'none',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>{o.titel}</span>
                  <span style={{ color: '#c8ff00', fontSize: '12px' }}>{openId === o.id ? '▲' : '▼'}</span>
                </button>
                {openId === o.id && <div style={{ padding: '0 14px 14px' }}>{formatInhoudMarkdownLight(o.inhoud)}</div>}
              </div>
            ))
          )}

          <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid #1f6b3d' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#c8ff00', marginBottom: '8px' }}>Stel een vraag (trefwoorden)</div>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <textarea
                value={vraag}
                onChange={(e) => setVraag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    stuurVraag();
                  }
                }}
                placeholder="Bijv: Hoe exporteer ik een maandrapport?"
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', minHeight: '52px', fontFamily: 'inherit' }}
              />
              <button type="button" onClick={stuurVraag} style={{ background: '#c8ff00', color: '#0a2e1a', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                Antwoord zoeken
              </button>
            </div>
          </div>

          {chat.length > 0 && !activeQuickVraag && (
            <div ref={chatRef} style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6db88a', marginBottom: '8px' }}>Gesprek</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chat.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: b.rol === 'jij' ? 'flex-end' : 'flex-start',
                      maxWidth: '92%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: b.rol === 'jij' ? '#1a5c34' : '#0f3d22',
                      border: `1px solid ${b.rol === 'jij' ? '#2a8f52' : '#1f6b3d'}`,
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#6db88a', marginBottom: '4px' }}>{b.rol === 'jij' ? 'Jij' : 'Assistent'}</div>
                    {b.rol === 'help' && b.items ? (
                      <div>
                        {b.items.map((o) => (
                          <div key={o.id} style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8ff00', marginBottom: '6px' }}>{o.titel}</div>
                            {formatInhoudMarkdownLight(o.inhoud)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#e8fff0', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{b.tekst ?? ''}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HelpAiModal;
