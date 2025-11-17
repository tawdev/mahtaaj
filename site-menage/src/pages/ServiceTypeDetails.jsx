import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

export default function ServiceTypeDetails() {
  const navigate = useNavigate();
  const { main, sub } = useParams();
  const [size, setSize] = useState('');
  const [price, setPrice] = useState(0);

  // Map for labels and emojis
  const mainMeta = useMemo(() => ({
    menage: { title: 'Ménage', emoji: '🏠', serviceTitle: 'Ménage à domicile', pricePerM2: 2.5 },
    cuisine: { title: 'Cuisine', emoji: '🍽️', serviceTitle: 'Ménage à domicile', pricePerM2: 2.5 },
  }), []);

  const subMeta = useMemo(() => ({
    // Ménage
    villa: { title: 'Villa', emoji: '🏡' },
    riad: { title: 'Maison d\'hôte', emoji: '🕌' },
    maison: { title: 'Maison', emoji: '🏠' },
    appartement: { title: 'Appartement', emoji: '🏢' },
    hotel: { title: 'Hôtel', emoji: '🏨' },
    'resort-hotel': { title: 'Resort Hôtel', emoji: '🏖️' },
    // Cuisine
    italienne: { 
      title: 'Italienne', 
      emoji: '🍝',
      description: 'Nettoyage spécialisé pour cuisines italiennes avec attention aux surfaces en marbre, carrelage et équipements traditionnels.',
      features: ['Plans de travail en marbre', 'Carrelage italien', 'Équipements traditionnels', 'Nettoyage des fours à pizza'],
      images: ['/galerie/m1.jpg', '/galerie/m2.jpg']
    },
    marocaine: { 
      title: 'Marocaine', 
      emoji: '🍲',
      description: 'Nettoyage adapté aux cuisines marocaines avec traitement spécial des tagines, couscoussiers et surfaces en zellige.',
      features: ['Traitement des tagines', 'Couscoussiers', 'Surfaces en zellige', 'Nettoyage des fours traditionnels'],
      images: ['/galerie/m3.jpg', '/galerie/e1.jpg']
    },
    francaise: { 
      title: 'Française', 
      emoji: '🥖',
      description: 'Nettoyage professionnel pour cuisines françaises avec soin particulier aux équipements modernes et surfaces en inox.',
      features: ['Équipements en inox', 'Plans de travail modernes', 'Nettoyage des fours professionnels', 'Désinfection complète'],
      images: ['/galerie/e2.jpg', '/galerie/e3.jpg']
    },
    golfe: { 
      title: 'Arabe du Golfe', 
      emoji: '🍛',
      description: 'Nettoyage spécialisé pour cuisines du Golfe avec traitement des équipements de cuisson traditionnels et surfaces dorées.',
      features: ['Équipements traditionnels', 'Surfaces dorées', 'Nettoyage des marmites', 'Traitement des épices'],
      images: ['/galerie/p1.jpg', '/galerie/p2.jpg']
    },
  }), []);

  const currentMain = mainMeta[main] || null;
  const currentSub = subMeta[sub] || null;

  useEffect(() => {
    if (!currentMain || !currentSub) return;
    if (!size) { setPrice(0); return; }
    const n = parseFloat(size);
    setPrice(Number.isFinite(n) && n > 0 ? n * currentMain.pricePerM2 : 0);
  }, [size, currentMain, currentSub]);

  const handleReserve = () => {
    if (!currentMain || !currentSub) return;
    const prefill = {
      serviceTitle: currentMain.serviceTitle,
      message: `Sous-catégorie: ${currentMain.title} / ${currentSub.title}${currentMain.title === 'Ménage' && size ? `, Surface: ${size} m²` : ''}`,
      type: currentSub.title,
      size: currentMain.title === 'Ménage' ? (size || '') : '',
    };
    try { localStorage.setItem('booking_prefill', JSON.stringify(prefill)); } catch {}
    navigate('/booking');
  };

  if (!currentMain || !currentSub) {
    return (
      <div className="shop-page">
        <div className="shop-container">
          <div className="error-container" style={{marginTop:16}}>
            <h3>Catégorie introuvable</h3>
            <Link className="booking-button" to="/services">⬅ Retour aux services</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-page">
      <style>{`
        .details-card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 8px 30px rgba(0,0,0,0.06); }
        .details-header { display:flex; align-items:center; gap:12px; }
        .details-emoji { font-size:36px; line-height:1; }
        .details-title { margin:0; }
        .grid { display:grid; gap:12px; }
        .cuisine-details { margin-top:16px; }
        .cuisine-description { color:#64748b; line-height:1.6; margin:12px 0; }
        .cuisine-features { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:8px; margin:12px 0; }
        .cuisine-feature { background:#f8fafc; padding:8px 12px; border-radius:8px; font-size:14px; color:#374151; }
        .cuisine-images { display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin:16px 0; }
        .cuisine-image { width:100%; height:120px; object-fit:cover; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
        
        /* Cart Estimate Styles */
        .cart-estimate {
          margin-top: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .cart-estimate-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .cart-estimate-minimum {
          font-weight: 600;
          color: #1e40af;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .cart-estimate-minimum::before {
          content: "💰";
          font-size: 16px;
        }
        
        .cart-estimate-additional {
          font-weight: 500;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .cart-estimate-additional::before {
          content: "⏰";
          font-size: 16px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .cart-estimate {
            padding: 10px 14px;
            margin-top: 10px;
          }
          
          .cart-estimate-text {
            font-size: 13px;
          }
          
          .cart-estimate-minimum::before,
          .cart-estimate-additional::before {
            font-size: 14px;
          }
        }
        
        /* Back to Services Button Styles */
        .back-to-services-container {
          margin-bottom: 20px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }
        
        .back-to-services {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 10px;
          color: #1e40af;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          min-height: 44px;
          min-width: 160px;
          justify-content: center;
        }
        
        .back-to-services:hover {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: rgba(59, 130, 246, 0.4);
          color: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          text-decoration: none;
        }
        
        .back-to-services:active {
          transform: translateY(0);
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }
        
        .back-to-services:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .back-to-services svg {
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .back-to-services:hover svg {
          transform: translateX(-2px);
        }
        
        .back-to-services span {
          white-space: nowrap;
        }
        
        /* Responsive adjustments for back button */
        @media (max-width: 768px) {
          .back-to-services-container {
            margin-bottom: 16px;
          }
          
          .back-to-services {
            padding: 10px 14px;
            font-size: 13px;
            min-height: 44px;
            min-width: 140px;
            gap: 6px;
          }
          
          .back-to-services svg {
            width: 14px;
            height: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .back-to-services {
            padding: 8px 12px;
            font-size: 12px;
            min-width: 120px;
            gap: 4px;
          }
          
          .back-to-services svg {
            width: 12px;
            height: 12px;
          }
        }
      `}</style>
      <div className="shop-container">
        {/* Bouton retour en haut */}
        <div className="back-to-services-container">
          <Link 
            to="/services" 
            className="back-to-services"
            aria-label="Retourner à la liste des services"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Retour aux services</span>
          </Link>
        </div>

        <header className="shop-header" style={{marginBottom: 16}}>
          <div className="shop-header-content">
            <h1 className="shop-title">{currentMain.emoji} {currentMain.title} – {currentSub.emoji} {currentSub.title}</h1>
            <p className="shop-description">Calculez une estimation et réservez en quelques clics.</p>
            <div className="cart-estimate">
              <p className="cart-estimate-text">
                <span className="cart-estimate-minimum">Minimum : 150 MAD pour 4 heures</span>
                <span className="cart-estimate-additional">Chaque heure supplémentaire : 40 MAD</span>
              </p>
            </div>
          </div>
        </header>

        <div className="details-card">
          <div className="details-header">
            <div className="details-emoji">{currentSub.emoji}</div>
            <h2 className="details-title">{currentSub.title}</h2>
          </div>

          {/* Détails spécifiques pour les cuisines */}
          {currentMain.title === 'Cuisine' && currentSub.description && (
            <div className="cuisine-details">
              <p className="cuisine-description">{currentSub.description}</p>
              
              {currentSub.features && currentSub.features.length > 0 && (
                <div className="cuisine-features">
                  {currentSub.features.map((feature, i) => (
                    <div key={i} className="cuisine-feature">{feature}</div>
                  ))}
                </div>
              )}
              
              {currentSub.images && currentSub.images.length > 0 && (
                <div className="cuisine-images">
                  {currentSub.images.map((image, i) => (
                    <img key={i} src={image} alt={`${currentSub.title} - Image ${i+1}`} className="cuisine-image" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Surface et prix seulement pour Ménage, pas pour Cuisine */}
          {currentMain.title === 'Ménage' && (
            <div className="grid" style={{marginTop:12}}>
              <div>
                <label className="form-label">Surface estimée (m²)</label>
                <div className="size-input-group">
                  <input 
                    type="number" min="1" step="0.5" 
                    className="form-input"
                    placeholder="Ex: 60"
                    value={size}
                    onChange={(e)=>setSize(e.target.value)}
                  />
                  <span className="size-unit">m²</span>
                </div>
              </div>
              <div className="price-display" style={{display:'flex', alignItems:'center', gap:8}}>
                <span className="price-label">Prix estimé:</span>
                <strong className="price-value">{price.toFixed(2)} DH</strong>
              </div>
            </div>
          )}

          <div style={{display:'flex', gap:10, marginTop:16, flexWrap:'wrap'}}>
            <button className="booking-button" onClick={handleReserve}>Réserver</button>
          </div>
        </div>
      </div>
    </div>
  );
}


