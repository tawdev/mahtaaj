import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import './HandWorkers.css';
import { SERVICES } from './MultiServiceEmployeesData';
import { supabase } from '../lib/supabase';
import { useGeolocation } from '../components/LocationPicker/useGeolocation';
import { calculateDistance, formatDistance } from '../utils/locationUtils';

// Map serviceId -> table + info about "validated" employees
const SERVICE_SOURCES = {
  menage_cuisine: {
    table: 'employees',
    type: 'generic',
  },
  securite: {
    table: 'security_employees_valid',
    type: 'security',
  },
  bebe: {
    table: 'bebe_employees',
    type: 'bebe',
  },
  jardinage: {
    table: 'jardinage_employees',
    type: 'jardinage',
  },
  travaux_manuels: {
    table: 'employees',
    type: 'generic',
  },
  chauffeur: {
    table: 'employees',
    type: 'generic',
  },
};

// Map serviceId -> column used as "Type de travail" for filtering
const SERVICE_WORK_FIELDS = {
  securite: 'expertise',
  bebe: 'expertise',
  jardinage: 'expertise',
};

// Map serviceId -> reservation page route
const SERVICE_ROUTES = {
  menage_cuisine: '/menage-et-cuisine',
  securite: '/security',
  bebe: '/bebe-setting',
  jardinage: '/jardinage',
  travaux_manuels: '/hand-workers',
  chauffeur: '/driver',
};

function getEmployeeName(emp, sourceType) {
  if (!emp) return '';
  if (sourceType === 'security' || sourceType === 'bebe' || sourceType === 'jardinage') {
    const first = emp.first_name || '';
    const last = emp.last_name || '';
    return `${first} ${last}`.trim() || emp.full_name || '';
  }
  return emp.full_name || emp.name || '';
}

function getEmployeePhoto(emp) {
  return emp.photo || emp.photo_url || '';
}

// Function to translate expertise values
function translateExpertiseValue(value, serviceId, t) {
  if (!value || !serviceId) return value;
  const originalValue = String(value).trim();
  const normalizedValue = originalValue.toLowerCase();

  if (serviceId === 'bebe') {
    const bebeMapping = {
      'مربية أطفال': 'employees.bebe.expertise.nanny',
      'رعاية طفل حديث الولادة': 'employees.bebe.expertise.newborn',
      'رعاية المولود الجديد': 'employees.bebe.expertise.newborn',
      'حضانة منزلية': 'employees.bebe.expertise.home_nursery',
      'مساعدة منزلية للطفل': 'employees.bebe.expertise.home_assistant',
      'nounou': 'employees.bebe.expertise.nanny',
      'soins du nouveau-né': 'employees.bebe.expertise.newborn',
      'garde à domicile': 'employees.bebe.expertise.home_nursery',
      'assistante à domicile pour enfant': 'employees.bebe.expertise.home_assistant',
    };
    const key = bebeMapping[originalValue] || bebeMapping[normalizedValue];
    return key ? t(key, originalValue) : originalValue;
  }

  if (serviceId === 'securite') {
    const securityMapping = {
      'gardien de sécurité': 'employees.security.expertise.guard',
      'superviseur de sécurité': 'employees.security.expertise.supervisor',
      'surveillance caméras': 'employees.security.expertise.camera',
    };
    const key = securityMapping[originalValue] || securityMapping[normalizedValue];
    return key ? t(key, originalValue) : originalValue;
  }

  if (serviceId === 'jardinage') {
    const jardinageMapping = {
      'plantation': 'employees.jardinage.expertise.planting',
      'taille / élagage': 'employees.jardinage.expertise.pruning',
      'entretien des jardins': 'employees.jardinage.expertise.maintenance',
    };
    const key = jardinageMapping[originalValue] || jardinageMapping[normalizedValue];
    return key ? t(key, originalValue) : originalValue;
  }

  return originalValue;
}

export default function MultiServiceEmployeesFilterPage({ serviceId }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const service = SERVICES.find((s) => s.id === serviceId);

  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedMenageCompetencyId, setSelectedMenageCompetencyId] = useState('');
  const [selectedCuisineTypeId, setSelectedCuisineTypeId] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [menageCompetencyOptions, setMenageCompetencyOptions] = useState([]);
  const [cuisineTypeOptions, setCuisineTypeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useProximity, setUseProximity] = useState(false);

  const { location: userLocation, loading: geoLoading, getCurrentPosition } = useGeolocation();
  const workField = SERVICE_WORK_FIELDS[serviceId] || null;

  useEffect(() => {
    const loadEmployees = async () => {
      if (!serviceId) return;
      const source = SERVICE_SOURCES[serviceId];
      if (!source) {
        setAllEmployees([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { table, type } = source;
        let query = supabase.from(table).select('*');
        if (type === 'generic' || type === 'security' || type === 'bebe' || type === 'jardinage') {
          query = query.eq('is_active', true);
          if (type === 'generic') {
            query = query.in('status', ['accepted', 'active']);
          }
        }
        const { data, error: dbError } = await query;
        if (dbError) throw dbError;
        const normalized = (data || []).map((row) => ({
          ...row,
          _sourceType: type,
          _displayName: getEmployeeName(row, type),
          _photo: getEmployeePhoto(row),
          city: row.city || '',
          quartier: row.quartier || '',
          _competency_ids: (serviceId === 'menage_cuisine' ? (Array.isArray(row.metadata?.competency_ids) ? row.metadata.competency_ids.map(String) : row.metadata?.competency_id ? [String(row.metadata.competency_id)] : []) : []),
          _cuisine_type_ids: (serviceId === 'menage_cuisine' ? (Array.isArray(row.metadata?.cuisine_type_ids) ? row.metadata.cuisine_type_ids.map(String) : row.metadata?.cuisine_type_id ? [String(row.metadata.cuisine_type_id)] : []) : []),
        }));
        setAllEmployees(normalized);
      } catch (e) {
        setError(e.message || 'Error loading employees');
        setAllEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    setSelectedWorkType('');
    setSelectedMenageCompetencyId('');
    setSelectedCuisineTypeId('');
    setAllEmployees([]);
    loadEmployees();
  }, [serviceId]);

  const handleProximityToggle = () => {
    if (!useProximity) {
      getCurrentPosition();
      setUseProximity(true);
    } else {
      setUseProximity(false);
    }
  };

  const workTypes = useMemo(() => {
    if (!workField) return [];
    const set = new Set(allEmployees.map((e) => e[workField]).filter((v) => v && String(v).trim() !== ''));
    return Array.from(set);
  }, [allEmployees, workField]);

  const translatedWorkTypes = useMemo(() => {
    return workTypes.map((wt) => ({
      original: wt,
      translated: translateExpertiseValue(wt, serviceId, t),
    }));
  }, [workTypes, serviceId, t]);

  useEffect(() => {
    const buildCompetencyOptions = async () => {
      if (serviceId !== 'menage_cuisine') {
        setMenageCompetencyOptions([]);
        setCuisineTypeOptions([]);
        return;
      }
      try {
        const { data: servicesData } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
        const { data: typesData } = await supabase.from('types').select('*').order('created_at', { ascending: true });

        const lang = (i18n.language || 'fr').split('-')[0].toLowerCase();
        const pickLabel = (obj) => {
          if (!obj) return '';
          return obj[`name_${lang}`] || obj[`title_${lang}`] || obj.name || obj.title || '';
        };

        setMenageCompetencyOptions((servicesData || []).map(s => ({ id: String(s.id), label: pickLabel(s) })));
        setCuisineTypeOptions((typesData || []).map(t => ({ id: String(t.id), label: pickLabel(t) })));
      } catch (err) {
        console.warn('Error options:', err);
      }
    };
    buildCompetencyOptions();
  }, [serviceId, i18n.language]);

  const employees = useMemo(() => {
    let list = [...allEmployees];
    list = list.filter((e) => {
      if (workField && selectedWorkType && String(e[workField] || '').trim() !== selectedWorkType) return false;
      if (serviceId === 'menage_cuisine') {
        if (selectedMenageCompetencyId && !e._competency_ids.includes(selectedMenageCompetencyId)) return false;
        if (selectedCuisineTypeId && !e._cuisine_type_ids.includes(selectedCuisineTypeId)) return false;
      }
      return true;
    });

    if (useProximity && userLocation) {
      list = list.map(emp => ({
        ...emp,
        _distance: calculateDistance(userLocation.lat, userLocation.lng, emp.latitude, emp.longitude)
      })).sort((a, b) => a._distance - b._distance);
    }
    return list;
  }, [allEmployees, workField, selectedWorkType, serviceId, selectedMenageCompetencyId, selectedCuisineTypeId, useProximity, userLocation]);

  if (!service) return null;

  return (
    <main className="hand-workers-page">
      <div className="hand-workers-header">
        <div className="back-button-container">
          <Link to="/multi-services-employees" className="hand-workers-back-button">← {t('common.back', 'Retour')}</Link>
        </div>
        <div className="hand-workers-title-section">
          <h1 className="hand-workers-title">{service.label}</h1>
          <p className="hand-workers-subtitle">
            {t('multi_services.filter_subtitle_new', 'Découvrez nos experts disponibles ou activez la recherche par proximité.')}
          </p>
        </div>
      </div>

      <div className="hand-workers-content">
        <div className="proximity-btn-container">
          <button
            type="button"
            className={`mode-button-magic ${useProximity ? 'active' : ''} ${geoLoading ? 'loading' : ''}`}
            onClick={handleProximityToggle}
            disabled={geoLoading}
          >
            {geoLoading ? '⌛' : '📍'}
            {useProximity ? t('multi_services.disable_proximity', 'Désactiver la recherche par proximité') : t('multi_services.enable_proximity', 'Chercher par ma localisation')}
          </button>
        </div>

        <section className="hand-workers-section">
          <div className="multi-service-filters">
            {serviceId === 'menage_cuisine' && menageCompetencyOptions.length > 0 && (
              <div>
                <label htmlFor="competency-menage-select" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  {t('employee_register.form.competency', 'Domaine de compétence (Ménage)')}
                </label>
                <select id="competency-menage-select" className="form-input" value={selectedMenageCompetencyId} onChange={(e) => setSelectedMenageCompetencyId(e.target.value)}>
                  <option value="">{t('employee_register.form.select_competency', 'Sélectionner…')}</option>
                  {menageCompetencyOptions.map((opt) => (
                    <option key={`m-${opt.id}`} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {serviceId === 'menage_cuisine' && cuisineTypeOptions.length > 0 && (
              <div>
                <label htmlFor="competency-cuisine-select" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  {t('employee_register.form.competency_cuisine', 'Domaine de compétence (Cuisine)')}
                </label>
                <select id="competency-cuisine-select" className="form-input" value={selectedCuisineTypeId} onChange={(e) => setSelectedCuisineTypeId(e.target.value)}>
                  <option value="">{t('employee_register.form.select_competency', 'Sélectionner…')}</option>
                  {cuisineTypeOptions.map((opt) => (
                    <option key={`c-${opt.id}`} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {workTypes.length > 0 && (
              <div>
                <label htmlFor="worktype-select" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
                  {t('multi_services.work_type_label', 'Type de travail')}
                </label>
                <select id="worktype-select" className="form-input" value={selectedWorkType} onChange={(e) => setSelectedWorkType(e.target.value)}>
                  <option value="">{t('multi_services.work_type_placeholder', 'Choisissez un type de travail')}</option>
                  {translatedWorkTypes.map(({ original, translated }) => (
                    <option key={original} value={original}>{translated}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <div className="alert error">{error}</div>}
          {loading && <p>{t('common.loading', 'Loading...')}</p>}

          {!loading && (
            <div>
              {employees.length === 0 ? (
                <div className="no-workers">
                  <p>{t('multi_services.no_employees', 'Aucun employé correspondant.')}</p>
                </div>
              ) : (
                <div className="hand-workers-grid">
                  {employees.map((emp) => (
                    <article key={emp.id} className="hand-worker-card">
                      <div className="worker-photo"><span>👤</span></div>
                      <div className="worker-info">
                        <h3 className="worker-name">{emp._displayName}</h3>
                        <div className="worker-detail"><span>🏢</span><span>{service.label}</span></div>
                        <div className="worker-detail"><span>📍</span><span>{emp.city} – {emp.quartier}</span></div>
                        {emp._distance !== undefined && emp._distance !== Infinity && (
                          <div className="worker-distance">🚀 {formatDistance(emp._distance)}</div>
                        )}
                        <div className="worker-status">
                          <span className="status-badge">✓ {t('common.available', 'Disponible')}</span>
                        </div>
                        <div className="worker-action">
                          <button
                            type="button"
                            className="btn-book-premium"
                            onClick={() => navigate(SERVICE_ROUTES[serviceId] || '/')}
                          >
                            {t('multi_services.button_book', 'Réserver maintenant')}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
