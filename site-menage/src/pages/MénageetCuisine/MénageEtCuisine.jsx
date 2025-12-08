import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MénageEtCuisine.css';

export default function MénageEtCuisine() {
  const navigate = useNavigate();

  const cards = [
    {
      id: 1,
      name: 'Ménage',
      image: '/image/serveces/Ménage1.jpeg'
    },
    {
      id: 2,
      name: 'Cuisine',
      image: '/image/serveces/cuisin1.jpeg'
    },
    {
      id: 3,
      name: 'Ménage + cuisine',
      image: '/image/serveces/cleaning + kitchen.jpeg'
    }
  ];

  const getImageUrl = (image) => {
    const baseUrl = process.env.PUBLIC_URL || '';
    // Extract filename and encode it to handle spaces and special characters
    const filename = image.split('/').pop();
    const encodedFilename = encodeURIComponent(filename);
    const pathWithoutFilename = image.substring(0, image.lastIndexOf('/') + 1);
    return `${baseUrl}${pathWithoutFilename}${encodedFilename}`;
  };

  const handleCardClick = (card) => {
    if (card.name === 'Ménage') {
      navigate('/menage');
    } else if (card.name === 'Cuisine') {
      navigate('/cuisin');
    } else if (card.name === 'Ménage + cuisine') {
      navigate('/menage-cuisine');
    }
    // Add navigation for other cards if needed
  };

  return (
    <main className="menage-et-cuisine-page">
      <button 
        className="menage-et-cuisine-back-button"
        onClick={() => navigate('/tous-les-services')}
        title="Retour"
      >
        ← Retour
      </button>
      <h1 className="menage-et-cuisine-title">
        Ménage et Cuisine
      </h1>
      <div className="menage-et-cuisine-grid">
        {cards.map((card) => {
          const imageUrl = getImageUrl(card.image);
          const isClickable = card.name === 'Ménage' || card.name === 'Cuisine' || card.name === 'Ménage + cuisine';
          return (
            <article 
              key={card.id} 
              className={`menage-et-cuisine-card ${isClickable ? 'menage-et-cuisine-card-clickable' : ''}`}
              onClick={() => isClickable && handleCardClick(card)}
              style={isClickable ? { cursor: 'pointer' } : {}}
            >
              <div className="menage-et-cuisine-card-image">
                <img
                  src={imageUrl}
                  alt={card.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.style.background = '#f1f5f9';
                  }}
                />
              </div>
              <div className="menage-et-cuisine-card-body">
                <h2 className="menage-et-cuisine-card-title">{card.name}</h2>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

