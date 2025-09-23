import React, { useState, useMemo } from 'react';

export default function CollapsibleText({
  text = '',
  previewChars = 220,
  showLabel = true,         // <- add a text label next to the chevron
}) {
  const [open, setOpen] = useState(false);

  const isLong = useMemo(() => (text?.length || 0) > previewChars, [text, previewChars]);
  const shown = useMemo(() => {
    if (!isLong || open) return text || '';
    const trimmed = (text || '').slice(0, previewChars).trim();
    return trimmed.replace(/[.,;:!?-]$/, '') + '…';
  }, [text, isLong, open, previewChars]);

  if (!text) return null;

  return (
    <div className={`collapsible ${open ? 'is-open' : 'is-closed'}`}>
      <div className={`collapsible__content ${open ? '' : 'collapsible__content--clamped'}`}>
        {shown}
      </div>

      {isLong && (
        <>
          <button
            type="button"
            className="collapsible__toggle"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
          >
            <svg
              className={`chev ${open ? 'open' : ''}`}
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {showLabel && <span className="toggle-label">{open ? 'Show less' : 'Show more'}</span>}
          </button>
        </>
      )}
    </div>
  );
}
