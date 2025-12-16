import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import './HandWorkers.css';
import { SERVICES } from './MultiServiceEmployeesData';
import { supabase } from '../lib/supabase';
import { CITY_QUARTIERS } from '../constants/cities';

// Map serviceId -> table + info about "validated" employees
const SERVICE_SOURCES = {
  menage_cuisine: {
    table: 'employees',
    type: 'generic',
  },
  securite: {
    // validated security employees are stored in this table
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
// (only where we are sure the column exists)
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
  // generic employees table
  return emp.full_name || emp.name || '';
}

function getEmployeePhoto(emp) {
  return emp.photo || emp.photo_url || '';
}

// Function to translate expertise values based on service type and language
function translateExpertiseValue(value, serviceId, t) {
  if (!value || !serviceId) return value;
  
  const normalizedValue = String(value).trim().toLowerCase();
  const originalValue = String(value).trim();
  
  // Mapping for bebe expertise - map database values to translation keys
  if (serviceId === 'bebe') {
    const bebeMapping = {
      // Arabic values (as stored in DB) -> translation key
      'مربية أطفال': 'employees.bebe.expertise.nanny',
      'رعاية طفل حديث الولادة': 'employees.bebe.expertise.newborn',
      'رعاية المولود الجديد': 'employees.bebe.expertise.newborn',
      'حضانة منزلية': 'employees.bebe.expertise.home_nursery',
      'مساعدة منزلية للطفل': 'employees.bebe.expertise.home_assistant',
      // French values (as stored in DB) -> translation key
      'nounou': 'employees.bebe.expertise.nanny',
      'soins du nouveau-né': 'employees.bebe.expertise.newborn',
      'garde à domicile': 'employees.bebe.expertise.home_nursery',
      'assistante à domicile pour enfant': 'employees.bebe.expertise.home_assistant',
      // English values (as stored in DB) -> translation key
      'nanny': 'employees.bebe.expertise.nanny',
      'newborn care': 'employees.bebe.expertise.newborn',
      'home nursery': 'employees.bebe.expertise.home_nursery',
      'home assistant for child': 'employees.bebe.expertise.home_assistant',
    };
    
    // Try exact match first (case-sensitive, preserves Arabic)
    const translationKey = bebeMapping[originalValue] || bebeMapping[normalizedValue];
    if (translationKey) {
      const translated = t(translationKey, originalValue);
      // Only return translation if it's different from the key (meaning translation was found)
      if (translated && translated !== translationKey) {
        return translated;
      }
    }
  }
  
  // Mapping for security expertise
  if (serviceId === 'securite') {
    const securityMapping = {
      'gardien de sécurité': 'employees.security.expertise.guard',
      'superviseur de sécurité': 'employees.security.expertise.supervisor',
      'surveillance caméras': 'employees.security.expertise.camera',
      'security guard': 'employees.security.expertise.guard',
      'security supervisor': 'employees.security.expertise.supervisor',
      'camera monitoring': 'employees.security.expertise.camera',
    };
    
    const translationKey = securityMapping[originalValue] || securityMapping[normalizedValue];
    if (translationKey) {
      const translated = t(translationKey, originalValue);
      if (translated && translated !== translationKey) {
        return translated;
      }
    }
  }
  
  // Mapping for jardinage expertise
  if (serviceId === 'jardinage') {
    const jardinageMapping = {
      'plantation': 'employees.jardinage.expertise.planting',
      'taille / élagage': 'employees.jardinage.expertise.pruning',
      'taille': 'employees.jardinage.expertise.pruning',
      'élagage': 'employees.jardinage.expertise.pruning',
      'entretien des jardins': 'employees.jardinage.expertise.maintenance',
      'pruning': 'employees.jardinage.expertise.pruning',
      'garden maintenance': 'employees.jardinage.expertise.maintenance',
      'planting': 'employees.jardinage.expertise.planting',
    };
    
    const translationKey = jardinageMapping[originalValue] || jardinageMapping[normalizedValue];
    if (translationKey) {
      const translated = t(translationKey, originalValue);
      if (translated && translated !== translationKey) {
        return translated;
      }
    }
  }
  
  // If no mapping found, return original value
  return originalValue;
}

export default function MultiServiceEmployeesFilterPage({ serviceId }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const service = SERVICES.find((s) => s.id === serviceId);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedQuartier, setSelectedQuartier] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('');
  const [selectedMenageCompetencyId, setSelectedMenageCompetencyId] = useState('');
  const [selectedCuisineTypeId, setSelectedCuisineTypeId] = useState('');
  const [allEmployees, setAllEmployees] = useState([]); // all valid employees for this service
  const [menageCompetencyOptions, setMenageCompetencyOptions] = useState([]); // domaines ménage
  const [cuisineTypeOptions, setCuisineTypeOptions] = useState([]); // domaines cuisine
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

        // Only employees "valides / actifs"
        if (type === 'generic') {
          // main employees table: use is_active + accepted status (validated in admin)
          // we also keep compatibility with a possible "active" legacy status
          query = query
            .eq('is_active', true)
            .in('status', ['accepted', 'active']);
        } else if (type === 'security') {
          // security_employees_valid already contains only validated/active employees
          // optional extra filter if columns exist
          query = query.eq('is_active', true);
        } else if (type === 'bebe' || type === 'jardinage') {
          // Only keep active employees if column exists
          query = query.eq('is_active', true);
        }

        const { data, error: dbError } = await query;

        if (dbError) {
          console.error('[MultiServiceEmployeesFilterPage] Error loading employees:', dbError);
          throw dbError;
        }

        const rows = Array.isArray(data) ? data : [];
        // Normalize minimal fields we need for UI
        const normalized = rows.map((row) => {
          const base = {
            ...row,
            _sourceType: type,
            _displayName: getEmployeeName(row, type),
            _photo: getEmployeePhoto(row),
            // Ensure city/quartier exist even if null
            city: row.city || '',
            quartier: row.quartier || '',
          };

          // For housekeeping employees (menage + cuisine), expose normalized competency ids
          if (serviceId === 'menage_cuisine' && type === 'generic') {
            const metadata = row.metadata || {};
            let competencyIds = [];
            if (Array.isArray(metadata.competency_ids) && metadata.competency_ids.length) {
              competencyIds = metadata.competency_ids.map(String);
            } else if (metadata.competency_id) {
              competencyIds = [String(metadata.competency_id)];
            }
            let cuisineIds = [];
            if (Array.isArray(metadata.cuisine_type_ids) && metadata.cuisine_type_ids.length) {
              cuisineIds = metadata.cuisine_type_ids.map(String);
            } else if (metadata.cuisine_type_id) {
              cuisineIds = [String(metadata.cuisine_type_id)];
            }
            return {
              ...base,
              _competency_ids: competencyIds,
              _cuisine_type_ids: cuisineIds,
            };
          }

        return base;
        });

        setAllEmployees(normalized);
      } catch (e) {
        console.error('[MultiServiceEmployeesFilterPage] Exception loading employees:', e);
        setError(e.message || 'Error loading employees');
        setAllEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    // Reset filters when service changes
    setSelectedCity('');
    setSelectedQuartier('');
    setSelectedWorkType('');
    setSelectedMenageCompetencyId('');
    setSelectedCuisineTypeId('');
    setAllEmployees([]);
    loadEmployees();
  }, [serviceId]);

  // Use the same static list as EmployeeRegister for city choices
  const cities = useMemo(() => Object.keys(CITY_QUARTIERS), []);

  const quartiers = useMemo(() => {
    if (!selectedCity) return [];
    return CITY_QUARTIERS[selectedCity] || [];
  }, [selectedCity]);

  const workTypes = useMemo(() => {
    if (!workField) return [];
    const set = new Set(
      allEmployees
        .map((e) => e[workField])
        .filter((v) => v && String(v).trim() !== ''),
    );
    return Array.from(set);
  }, [allEmployees, workField]);

  // Translated work types for display
  const translatedWorkTypes = useMemo(() => {
    return workTypes.map((wt) => {
      const translated = translateExpertiseValue(wt, serviceId, t);
      return {
        original: wt,
        translated: translated,
      };
    });
  }, [workTypes, serviceId, t]);

  // Build "Domaine de compétence" options for menage_cuisine
  useEffect(() => {
    const buildCompetencyOptions = async () => {
      if (serviceId !== 'menage_cuisine') {
        setMenageCompetencyOptions([]);
        setCuisineTypeOptions([]);
        setSelectedMenageCompetencyId('');
        setSelectedCuisineTypeId('');
        return;
      }

      try {
        // Load housekeeping services (menage side)
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('order', { ascending: true });

        if (servicesError) {
          console.warn('[MultiServiceEmployeesFilterPage] Error loading services for competencies:', servicesError);
        }

        // Load cuisine types
        const { data: typesData, error: typesError } = await supabase
          .from('types')
          .select('*')
          .order('created_at', { ascending: true });

        if (typesError) {
          console.warn('[MultiServiceEmployeesFilterPage] Error loading cuisine types for competencies:', typesError);
        }

        const lang = (i18n.language || 'fr').toString().split(/[-_]/)[0].toLowerCase();
        const pickLocalized = (obj, base) => {
          if (!obj) return '';
          const candidates = [];
          if (lang === 'ar') candidates.push(`${base}_ar`, 'name_ar', 'title_ar');
          if (lang === 'fr') candidates.push(`${base}_fr`, 'name_fr', 'title_fr');
          if (lang === 'en') candidates.push(`${base}_en`, 'name_en', 'title_en');
          candidates.push('name', 'title');
          for (const key of candidates) {
            if (obj[key]) return obj[key];
          }
          return '';
        };

        const serviceMap = {};
        if (Array.isArray(servicesData)) {
          servicesData.forEach((s) => {
            if (!s?.id) return;
            const label = pickLocalized(s, 'name') || `#${s.id}`;
            serviceMap[String(s.id)] = label;
          });
        }

        const typeMap = {};
        if (Array.isArray(typesData)) {
          typesData.forEach((t) => {
            if (!t?.id) return;
            const label = pickLocalized(t, 'name') || `#${t.id}`;
            typeMap[String(t.id)] = label;
          });
        }

        // Build curated lists for filters in a fixed order (French labels)
        const normalize = (str) => String(str || '').toLowerCase().trim();

        const MENAGE_LABEL_ORDER_FR = [
          'ménage',
          'bureaux et usine',
          'lavage et repassage',
          'nettoyage airbnb',
          'nettoyage de piscine',
          'tapis canapés',
          'lavage',
        ];

        const CUISINE_LABEL_ORDER_FR = [
          'italienne',
          'marocaine',
          'française',
          'arabe du golfe',
          'égyptienne',
          'turque',
          'coréenne',
          'mexicaine',
          'cuisine asiatique',
        ];

        const menageOptions = [];
        const usedServiceIds = new Set();
        MENAGE_LABEL_ORDER_FR.forEach((targetLabel) => {
          const targetNorm = normalize(targetLabel);
          Object.entries(serviceMap).forEach(([id, label]) => {
            if (usedServiceIds.has(id)) return;
            if (normalize(label) === targetNorm) {
              menageOptions.push({ id, label });
              usedServiceIds.add(id);
            }
          });
        });

        const cuisineOptions = [];
        const usedTypeIds = new Set();
        CUISINE_LABEL_ORDER_FR.forEach((targetLabel) => {
          const targetNorm = normalize(targetLabel);
          Object.entries(typeMap).forEach(([id, label]) => {
            if (usedTypeIds.has(id)) return;
            if (normalize(label) === targetNorm) {
              cuisineOptions.push({ id, label });
              usedTypeIds.add(id);
            }
          });
        });

        setMenageCompetencyOptions(menageOptions);
        setCuisineTypeOptions(cuisineOptions);
      } catch (err) {
        console.warn('[MultiServiceEmployeesFilterPage] Error building competency options:', err);
        setMenageCompetencyOptions([]);
        setCuisineTypeOptions([]);
      }
    };

    buildCompetencyOptions();
  }, [serviceId, allEmployees, i18n.language]);

  const employees = useMemo(() => {
    if (!selectedCity || !selectedQuartier) return [];
    return allEmployees.filter((e) => {
      if (!e.city || !e.quartier) return false;
      if (e.city.trim() !== selectedCity) return false;
      if (e.quartier.trim() !== selectedQuartier) return false;
      if (workField && selectedWorkType) {
        const value = e[workField];
        if (!value || String(value).trim() !== selectedWorkType) return false;
      }
      // Optional "Domaine de compétence (Ménage)"
      if (serviceId === 'menage_cuisine' && selectedMenageCompetencyId) {
        const menageIds = Array.isArray(e._competency_ids) ? e._competency_ids : [];
        if (!menageIds.includes(selectedMenageCompetencyId)) return false;
      }
      // Optional "Domaine de compétence (Cuisine)"
      if (serviceId === 'menage_cuisine' && selectedCuisineTypeId) {
        const cuisineIds = Array.isArray(e._cuisine_type_ids) ? e._cuisine_type_ids : [];
        if (!cuisineIds.includes(selectedCuisineTypeId)) return false;
      }
      return true;
    });
  }, [
    allEmployees,
    selectedCity,
    selectedQuartier,
    workField,
    selectedWorkType,
    serviceId,
    selectedMenageCompetencyId,
    selectedCuisineTypeId,
  ]);

  if (!service) return null;

  return (
    <main className="hand-workers-page">
      <div className="hand-workers-header">
        <div className="back-button-container">
          <Link
            to="/multi-services-employees"
            className="hand-workers-back-button"
          >
            ← {t('common.back', 'Retour')}
          </Link>
        </div>
        <div className="hand-workers-title-section">
          <h1 className="hand-workers-title">
            {t('multi_services.filter_title', 'الفلترة حسب العنوان')} ({service.label})
          </h1>
          <p className="hand-workers-subtitle">
            {t(
              'multi_services.filter_subtitle',
              'اختر المدينة والحي لعرض الموظفين المسجلين في هذه الخدمة فقط.',
            )}
          </p>
        </div>
      </div>

      <div className="hand-workers-content">
        <section className="hand-workers-section">
          <div className="multi-service-filters">
            <div>
              <label
                htmlFor="city-select"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
              >
                {t('multi_services.city_label', 'Ville')}
              </label>
              <select
                id="city-select"
                className="form-input"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedQuartier('');
                }}
              >
                <option value="">
                  {t('multi_services.city_placeholder', 'Choisissez la ville')}
                </option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="quartier-select"
                style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
              >
                {t('multi_services.quartier_label', 'Quartier')}
              </label>
              <select
                id="quartier-select"
                className="form-input"
                value={selectedQuartier}
                onChange={(e) => setSelectedQuartier(e.target.value)}
                disabled={!selectedCity}
              >
                <option value="">
                  {t('multi_services.quartier_placeholder', 'Choisissez le quartier')}
                </option>
                {quartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {serviceId === 'menage_cuisine' && menageCompetencyOptions.length > 0 && (
              <div>
                <label
                  htmlFor="competency-menage-select"
                  style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
                >
                  {t('employee_register.form.competency', 'Domaine de compétence (Ménage)')}
                </label>
                <select
                  id="competency-menage-select"
                  className="form-input"
                  value={selectedMenageCompetencyId}
                  onChange={(e) => setSelectedMenageCompetencyId(e.target.value)}
                >
                  <option value="">
                    {t('employee_register.form.select_competency', 'Sélectionner…')}
                  </option>
                  {menageCompetencyOptions.map((opt) => (
                    <option key={`service-${opt.id}`} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {serviceId === 'menage_cuisine' && cuisineTypeOptions.length > 0 && (
              <div>
                <label
                  htmlFor="competency-cuisine-select"
                  style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
                >
                  {t('employee_register.form.competency_cuisine', 'Domaine de compétence (Cuisine)')}
                </label>
                <select
                  id="competency-cuisine-select"
                  className="form-input"
                  value={selectedCuisineTypeId}
                  onChange={(e) => setSelectedCuisineTypeId(e.target.value)}
                >
                  <option value="">
                    {t('employee_register.form.select_competency', 'Sélectionner…')}
                  </option>
                  {cuisineTypeOptions.map((opt) => (
                    <option key={`type-${opt.id}`} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {workTypes.length > 0 && (
              <div>
                <label
                  htmlFor="worktype-select"
                  style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}
                >
                  {t('multi_services.work_type_label', 'Type de travail')}
                </label>
                <select
                  id="worktype-select"
                  className="form-input"
                  value={selectedWorkType}
                  onChange={(e) => setSelectedWorkType(e.target.value)}
                >
                  <option value="">
                    {t(
                      'multi_services.work_type_placeholder',
                      'Choisissez un type de travail',
                    )}
                  </option>
                  {translatedWorkTypes.map(({ original, translated }) => (
                    <option key={original} value={original}>
                      {translated}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="alert error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {loading && (
            <p>{t('common.loading', 'Loading...')}</p>
          )}

          {!loading && selectedCity && selectedQuartier && (
            <div>
              {employees.length === 0 ? (
                <div className="no-workers">
                  <i className="fas fa-user-times" />
                  <p>
                    {t(
                      'multi_services.no_employees',
                      'لا يوجد موظفون مطابقون حالياً لهذه الخدمة في هذا العنوان.',
                    )}
                  </p>
                </div>
              ) : (
                <div className="hand-workers-grid">
                  {employees.map((emp) => (
                    <article key={emp.id} className="hand-worker-card">
                      <div className="worker-photo">
                        {/* Always show generic user icon instead of photo (photo URLs can be broken) */}
                        <div className="default-photo">
                          <span>👤</span>
                        </div>
                      </div>
                      <div className="worker-info">
                        <h3 className="worker-name">{emp._displayName}</h3>
                        <p className="worker-experience">
                          الخدمة: {service.label}
                        </p>
                        <p className="worker-experience">
                          العنوان: {emp.city} – {emp.quartier}
                        </p>
                        <div className="worker-status">
                          <span className="status-badge available">
                            متاح / Valide
                          </span>
                        </div>
                        <button
                          type="button"
                          className="mode-button"
                          style={{ marginTop: 16 }}
                          onClick={() => {
                            const target = SERVICE_ROUTES[serviceId] || '/';
                            navigate(target);
                          }}
                        >
                          {t('multi_services.button_book', 'احجز الآن')}
                        </button>
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
