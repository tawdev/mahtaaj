import React, { useState } from 'react';
import './PromoCode.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000';

export default function PromoCode({ onApplied }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [success, setSuccess] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setMessage(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/apply-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data.message || 'Code invalide');
      setSuccess(true);
      setMessage(`Code appliqué: -${data.discount}%`);
      if (onApplied) onApplied({ code: code.trim(), discount: data.discount });
    } catch (e) {
      setSuccess(false);
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="promo-card" data-aos="fade-up">
      <div className="promo-header">
        <h4 className="promo-title">Code promo</h4>
      </div>
      <div className="promo-body">
        <input 
          className="promo-input" 
          placeholder="Saisir le code" 
          value={code} 
          onChange={(e)=>setCode(e.target.value)}
        />
        <button className="promo-apply" onClick={apply} disabled={loading}>
          {loading ? '...' : 'Appliquer'}
        </button>
      </div>
      {message && (
        <div className={`promo-message ${success ? 'success' : 'error'}`}>
          {success ? '✅ ' : '❌ '}{message}
        </div>
      )}
    </div>
  );
}


