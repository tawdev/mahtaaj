import React, { useState } from 'react';

export default function LanguageFields({ value, onChange, includeDescription = true, required = false }) {
  const resolveInitialLang = () => {
    try {
      const saved = localStorage.getItem('currentLang') || localStorage.getItem('i18nextLng');
      if (saved) return String(saved).split(/[-_]/)[0].toLowerCase();
    } catch {}
    return 'fr';
  };
  const [active, setActive] = useState(resolveInitialLang());

  const languages = [
    { code: 'ar', label: 'العربية', flag: '🏷️' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const get = (field, lang) => (value?.[`${field}_${lang}`] ?? '');
  const set = (field, lang, v) => {
    onChange({
      ...value,
      [`${field}_${lang}`]: v,
    });
  };

  return (
    <div className="lang-fields">
      <div className="lang-tabs">
        {languages.map(l => (
          <button
            key={l.code}
            type="button"
            className={`lang-tab ${active === l.code ? 'active' : ''}`}
            onClick={() => setActive(l.code)}
          >
            <span style={{marginRight: 6}}>{l.flag}</span>{l.label}
          </button>
        ))}
      </div>

      <div className="lang-panel">
        <div className="form-group">
          <label>Nom ({active.toUpperCase()}){required ? ' *' : ''}</label>
          <input
            type="text"
            value={get('name', active)}
            onChange={(e) => set('name', active, e.target.value)}
            placeholder={`Name (${active})`}
            required={required}
          />
        </div>

        {includeDescription && (
          <div className="form-group">
            <label>Description ({active.toUpperCase()})</label>
            <textarea
              rows={3}
              value={get('description', active)}
              onChange={(e) => set('description', active, e.target.value)}
              placeholder={`Description (${active})`}
            />
          </div>
        )}
      </div>

      <style>{`
        .lang-fields { border: 1px solid #e5e7eb; border-radius: 10px; }
        .lang-tabs { display: flex; gap: 8px; padding: 8px; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
        .lang-tab { padding: 8px 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-weight: 600; }
        .lang-tab.active { background: #2563eb; color: #fff; border-color: #2563eb; }
        .lang-panel { padding: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .form-group input, .form-group textarea { padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
      `}</style>
    </div>
  );
}


