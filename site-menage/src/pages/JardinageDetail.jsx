import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReservationForm from '../components/ReservationForm';
import { supabase } from '../lib/supabase';
import './JardinageDetail.css';

export default function JardinageDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  
  const [category, setCategory] = useState(null);
  const [jardins, setJardins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    if (id) {
      loadCategory();
    }
  }, [id, i18n.language]);

  // Helper function to get image URL from Supabase Storage
  const getImageUrl = React.useCallback((imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.includes('supabase.co/storage')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || 
        imagePath.startsWith('/storage/') || imagePath.startsWith('/images/')) {
      const filename = imagePath.split('/').pop();
      if (filename) {
        const { data: { publicUrl } } = supabase.storage
          .from('employees')
          .getPublicUrl(filename);
        return publicUrl;
      }
      return null;
    }
    
    if (!imagePath.includes('/') && !imagePath.includes('http')) {
      const { data: { publicUrl } } = supabase.storage
        .from('employees')
        .getPublicUrl(imagePath);
      return publicUrl;
    }
    
    return null;
  }, []);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('[JardinageDetail] Loading category ID:', id);
      
      const { data, error } = await supabase
        .from('jardinage_categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('[JardinageDetail] Error loading category:', error);
        setError(t('jardinage.errors.category_not_found', 'Catégorie non trouvée'));
        return;
      }
      
      console.log('[JardinageDetail] Loaded category:', data);
      setCategory(data);
      
      // Load services for this category
      await loadServices(data.id);
    } catch (err) {
      console.error('[JardinageDetail] Exception loading category:', err);
      setError(t('jardinage.errors.connection', 'Erreur de connexion') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async (categoryId) => {
    try {
      setLoadingServices(true);
      
      const { data, error } = await supabase
        .from('jardins')
        .select('*')
        .eq('jardinage_category_id', categoryId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[JardinageDetail] Error loading services:', error);
        return;
      }
      
      console.log('[JardinageDetail] Loaded services:', data?.length || 0);
      setJardins(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[JardinageDetail] Exception loading services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleReservationSuccess = (data) => {
    setSuccessMessage(t('jardinage.success.reservation', 'Réservation réussie'));
    setShowReservationForm(false);
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  const handleReservationCancel = () => {
    setShowReservationForm(false);
  };

  if (loading) {
    return (
      <div className="jardinage-detail-page">
        <div className="loading-container">
          <div className="loader"></div>
          <p>{t('jardinage.loading.category', 'Chargement de la catégorie...')}</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="jardinage-detail-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error || t('jardinage.errors.category_not_found', 'Catégorie non trouvée')}</p>
          <Link to="/jardinage" className="retry-button">
            {t('jardinage.back_to_categories', 'Retour aux catégories')}
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = category.image ? getImageUrl(category.image) : null;

  return (
    <div className="jardinage-detail-page">
      {/* Back Button - Top Left */}
      <div className="back-button-top-container">
        <Link 
          to="/jardinage" 
          className="back-button-top"
        >
          <span className="back-icon">←</span>
          {t('jardinage.back_to_categories', 'Retour aux catégories')}
        </Link>
      </div>

      {/* Hero Section with Large Image */}
      <section className="jardinage-detail-hero">
        <div className="hero-background">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={category.name}
              className="hero-image"
              onError={(e) => {
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder) {
                  placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className="hero-placeholder" 
            style={{display: imageUrl ? 'none' : 'flex'}}
          >
            🌱
          </div>
          <div className="hero-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="container mx-auto px-4">
            <h1 className="hero-title">
              {category.name || t('jardinage.category_not_available', 'Catégorie non disponible')}
            </h1>
            
            <p className="hero-subtitle">
              {category.description || t('jardinage.description_not_available', 'Description non disponible')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="jardinage-detail-content">
        <div className="container mx-auto px-4 py-12">
          

          {/* Reservation Button Section */}
          <div className="reservation-section">
            <div className="reservation-card">
              <h3 className="reservation-title">
                {t('jardinage.reservation.title', 'Prêt à réserver ?')}
              </h3>
              <p className="reservation-text">
                {t('jardinage.reservation.description', 'Réservez ce service de catégorie maintenant')}
              </p>
              <button 
                className="btn-reserve-large"
                onClick={() => {
                  setSelectedService(null);
                  setShowReservationForm(true);
                }}
              >
                📅 {t('jardinage.services.reserve', 'Réserver')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message-toast">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <span className="success-text">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <div className="reservation-modal">
          <div className="modal-backdrop" onClick={handleReservationCancel}></div>
          <div className="modal-content">
            <ReservationForm
              serviceId={selectedService?.id || null}
              categoryId={category?.id || null}
              serviceType="jardinage"
              onSuccess={handleReservationSuccess}
              onCancel={handleReservationCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

