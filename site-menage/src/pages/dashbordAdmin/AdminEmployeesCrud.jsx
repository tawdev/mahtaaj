import React, { useEffect, useState } from 'react';
import './AdminCrud.css';
import './AdminEmployeesCrud.css';
import { supabase } from '../../lib/supabase';

// Helper function to get correct employee photo URL
const getEmployeePhotoUrl = (employee) => {
  if (!employee.photo && !employee.photo_url) {
    return null;
  }

  const photoPath = employee.photo_url || employee.photo;
  const rawP = String(photoPath || '');
  const p = rawP.replace(/^"|"$/g, '').trim();

  // If it's already an absolute URL (including Supabase Storage URLs)
  if (/^https?:\/\//i.test(p)) {
    return p;
  }

  // If it's a Supabase Storage path, construct the public URL
  if (p.startsWith('employees/') || p.includes('employees/')) {
    const { data } = supabase.storage.from('employees').getPublicUrl(p);
    return data?.publicUrl || null;
  }

  // Fallback: try to get from Supabase Storage
  try {
    const { data } = supabase.storage.from('employees').getPublicUrl(p);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  } catch (e) {
    // Ignore errors
  }

  return null;
};

export default function AdminEmployeesCrud({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [competencies, setCompetencies] = useState({}); // housekeeping service id -> name
  const [cuisineTypes, setCuisineTypes] = useState({}); // cuisine type id -> name
  const [updatingId, setUpdatingId] = useState(null);
  const [flash, setFlash] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeePage, setShowEmployeePage] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[AdminEmployeesCrud] Loading employees from Supabase...');

      // Load all employees, then filter for housekeeping employees
      const { data: allEmployees, error: loadError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (loadError) {
        console.error('[AdminEmployeesCrud] Error loading employees:', loadError);
        throw new Error(loadError.message || 'Erreur lors du chargement');
      }

      // Filter for housekeeping employees (metadata->>'type' = 'housekeeping' or null/undefined for default)
      // AND only show those that are NOT accepted (pending/rejected/new)
      const housekeepingEmployees = Array.isArray(allEmployees) ? allEmployees.filter(emp => {
        const metadata = emp.metadata || {};
        const empType = metadata.type;

        // Include housekeeping employees or employees without type (default to housekeeping)
        const isHousekeeping = !empType || empType === 'housekeeping' || empType === 'houseKlean';

        // Only keep those that are NOT accepted
        const isNotAccepted = emp.status !== 'accepted';

        return isHousekeeping && isNotAccepted;
      }) : [];

      // Transform data to match expected format
      const transformed = housekeepingEmployees.map(emp => {
        const metadata = emp.metadata || {};
        // Normalize menage competencies
        let competencyIds = [];
        if (Array.isArray(metadata.competency_ids) && metadata.competency_ids.length) {
          competencyIds = metadata.competency_ids.map(String);
        } else if (metadata.competency_id) {
          competencyIds = [String(metadata.competency_id)];
        }
        // Normalize cuisine competencies
        let cuisineIds = [];
        if (Array.isArray(metadata.cuisine_type_ids) && metadata.cuisine_type_ids.length) {
          cuisineIds = metadata.cuisine_type_ids.map(String);
        } else if (metadata.cuisine_type_id) {
          cuisineIds = [String(metadata.cuisine_type_id)];
        }

        return {
          id: emp.id,
          name: metadata.name || emp.full_name?.split(' ')[0] || '',
          prenom: metadata.prenom || emp.full_name?.split(' ').slice(1).join(' ') || '',
          full_name: emp.full_name || `${metadata.name || ''} ${metadata.prenom || ''}`.trim(),
          age: metadata.age || null,
          email: emp.email || '',
          phone: emp.phone || '',
          address: emp.address || metadata.adresse || '',
          photo: emp.photo || emp.photo_url || null,
          photo_url: emp.photo_url || emp.photo || null,
          // Legacy single competency fields (kept for backward compatibility)
          competency_id: metadata.competency_id || null,
          competency_name: metadata.competency_name || null,
          competency: metadata.competency || null,
          // New multi-competency fields
          competency_ids: competencyIds,
          cuisine_type_ids: cuisineIds,
          jours_disponibles: metadata.availability || metadata.jours_disponibles || metadata.days || {},
          status: emp.status || 'pending',
          is_active: emp.is_active || false,
          created_at: emp.created_at,
          ...emp
        };
      });

      console.log('[AdminEmployeesCrud] Loaded employees:', transformed.length);
      setItems(transformed);
    } catch (e) {
      console.error('[AdminEmployeesCrud] Exception loading:', e);
      setError(e.message || "Impossible de charger les employés");
    } finally {
      setLoading(false);
    }
  };

  const loadCompetencies = async () => {
    try {
      console.log('[AdminEmployeesCrud] Loading competencies (services & types) from Supabase...');

      // Housekeeping services (menage)
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('order', { ascending: true });

      if (servicesError) {
        console.warn('[AdminEmployeesCrud] Error loading services for competencies:', servicesError);
      }

      const competenciesMap = {};
      if (Array.isArray(servicesData)) {
        servicesData.forEach(s => {
          if (!s?.id) return;
          const label = s.name_fr || s.name_en || s.name_ar || s.name || s.title_fr || s.title_en || s.title_ar || `#${s.id}`;
          competenciesMap[String(s.id)] = label;
        });
      }

      // Cuisine types
      const { data: typesData, error: typesError } = await supabase
        .from('types')
        .select('*')
        .order('created_at', { ascending: true });

      if (typesError) {
        console.warn('[AdminEmployeesCrud] Error loading cuisine types:', typesError);
      }

      const cuisineMap = {};
      if (Array.isArray(typesData)) {
        typesData.forEach(t => {
          if (!t?.id) return;
          const label = t.name_fr || t.name_en || t.name_ar || t.name || t.title_fr || t.title_en || t.title_ar || `#${t.id}`;
          cuisineMap[String(t.id)] = label;
        });
      }

      console.log('[AdminEmployeesCrud] Loaded housekeeping competencies:', Object.keys(competenciesMap).length);
      console.log('[AdminEmployeesCrud] Loaded cuisine types:', Object.keys(cuisineMap).length);
      setCompetencies(competenciesMap);
      setCuisineTypes(cuisineMap);
    } catch (e) {
      console.warn('[AdminEmployeesCrud] Exception loading competencies:', e);
      setCompetencies({});
    }
  };

  useEffect(() => { load(); loadCompetencies(); }, []);

  const updateStatus = async (employeeId, status) => {
    try {
      setUpdatingId(employeeId);
      console.log('[AdminEmployeesCrud] Updating status:', employeeId, status);

      const { error } = await supabase
        .from('employees')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) {
        console.error('[AdminEmployeesCrud] Error updating status:', error);
        throw new Error(error.message || 'Échec mise à jour du statut');
      }

      console.log('[AdminEmployeesCrud] Status updated successfully');
      await load();
    } catch (e) {
      console.error('[AdminEmployeesCrud] Exception updating status:', e);
      alert(e.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdatingId(null);
    }
  };

  const validateEmployee = async (employeeId) => {
    try {
      setUpdatingId(employeeId);
      console.log('[AdminEmployeesCrud] Validating employee:', employeeId);

      const { error } = await supabase
        .from('employees')
        .update({
          status: 'accepted',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) {
        console.error('[AdminEmployeesCrud] Error validating employee:', error);
        throw new Error(error.message || "Échec de la validation");
      }

      console.log('[AdminEmployeesCrud] Employee validated successfully');
      await load();
      setFlash('Employé validé avec succès');
      setTimeout(() => setFlash(''), 3000);
    } catch (e) {
      console.error('[AdminEmployeesCrud] Exception validating employee:', e);
      alert(e.message || 'Erreur lors de la validation');
    } finally {
      setUpdatingId(null);
    }
  };

  const showEmployeeDetailsPage = (employee) => {
    setSelectedEmployee(employee);
    setShowEmployeePage(true);
  };

  const closeEmployeeDetailsPage = () => {
    setSelectedEmployee(null);
    setShowEmployeePage(false);
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <h2>Gestion des Employés</h2>
        <button className="admin-crud-add-button" onClick={load} disabled={loading}>{loading ? 'Chargement…' : 'Actualiser'}</button>
      </div>

      {!!flash && (<div className="admin-crud-success">{flash}</div>)}
      {error && (<div className="admin-crud-error">{error}</div>)}

      <div style={{ overflow: 'auto' }}>
        <table className="admin-table">
          <thead className="admin-thead">
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Photo</th>
              <th className="admin-th">Nom</th>
              <th className="admin-th">Prénom</th>
              <th className="admin-th">Âge</th>
              <th className="admin-th">Email</th>
              <th className="admin-th">Téléphone</th>
              <th className="admin-th">Adresse</th>
              <th className="admin-th">Compétence</th>
              <th className="admin-th">Statut</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td className="admin-td" data-label="#">{e.id}</td>
                <td className="admin-td" data-label="Photo">
                  <div className="avatar-wrapper">
                    {(() => {
                      const photoUrl = getEmployeePhotoUrl(e);
                      return photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={e.name || 'photo'}
                            className="employee-avatar"
                            onError={(ev) => {
                              ev.currentTarget.style.display = 'none';
                              if (ev.currentTarget.nextElementSibling) ev.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div className="employee-avatar placeholder" style={{ display: 'none' }} aria-label="Sans photo">👤</div>
                        </>
                      ) : (
                        <div className="employee-avatar placeholder" style={{ display: 'flex' }} aria-label="Sans photo">👤</div>
                      );
                    })()}
                  </div>
                </td>
                <td className="admin-td" data-label="Nom">{e.name}</td>
                <td className="admin-td" data-label="Prénom">{e.prenom}</td>
                <td className="admin-td" data-label="Âge">{e.age}</td>
                <td className="admin-td" data-label="Email">{e.email}</td>
                <td className="admin-td" data-label="Téléphone">{e.phone || '-'}</td>
                <td className="admin-td" data-label="Adresse">{e.address || e.metadata?.adresse || '-'}</td>
                <td className="admin-td" data-label="Compétence">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Ménage */}
                    {Array.isArray(e.competency_ids) && e.competency_ids.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {e.competency_ids.map((id) => (
                          <span key={id} className="admin-badge employee-competency-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {competencies[id] || `#${id}`}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Cuisine */}
                    {Array.isArray(e.cuisine_type_ids) && e.cuisine_type_ids.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {e.cuisine_type_ids.map((id) => (
                          <span key={id} className="admin-badge employee-competency-badge cuisine-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {cuisineTypes[id] || `#${id}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="admin-td" data-label="Statut">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`status-chip ${e.status === 'accepted' ? 'accepted' : e.status === 'rejected' ? 'rejected' : 'pending'}`}> {e.status || 'pending'} </span>
                    <button className="status-approve" onClick={() => validateEmployee(e.id)} disabled={updatingId === e.id} title="Valider">
                      ✓
                    </button>
                    <button className="status-reject" onClick={() => updateStatus(e.id, 'rejected')} disabled={updatingId === e.id} title="Refuser">
                      ✕
                    </button>
                  </div>
                </td>
                <td className="admin-td" data-label="Actions">
                  <div className="employee-actions">
                    <button
                      className="view-button"
                      onClick={() => showEmployeeDetailsPage(e)}
                      title="Voir les détails"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Détails
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Details Page */}
      {showEmployeePage && selectedEmployee && (
        <div className="employee-details-page">
          <div className="page-header">
            <button className="back-button" onClick={closeEmployeeDetailsPage}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour
            </button>
            <h2>Profil de l'Employé</h2>
          </div>

          <div className="page-content">
            <div className="employee-profile-section">
              <div className="profile-photo">
                {(() => {
                  const photoUrl = getEmployeePhotoUrl(selectedEmployee);
                  return photoUrl ? (
                    <>
                      <img
                        src={photoUrl}
                        alt={selectedEmployee.name || 'photo'}
                        className="employee-large-avatar"
                        onError={(ev) => {
                          ev.currentTarget.style.display = 'none';
                          if (ev.currentTarget.nextElementSibling) ev.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="employee-large-avatar placeholder" style={{ display: 'none' }}>
                        👤
                      </div>
                    </>
                  ) : (
                    <div className="employee-large-avatar placeholder" style={{ display: 'flex' }}>
                      👤
                    </div>
                  );
                })()}
              </div>

              <div className="profile-info">
                <h3 className="employee-name">{selectedEmployee.name} {selectedEmployee.prenom}</h3>
                <p className="employee-id">ID Membre: #{selectedEmployee.id}</p>
                <div className={`status-badge ${selectedEmployee.status === 'accepted' ? 'accepted' : selectedEmployee.status === 'rejected' ? 'rejected' : 'pending'}`}>
                  {selectedEmployee.status || 'En attente'}
                </div>
              </div>
            </div>

            <div className="employee-details-grid">
              <div className="detail-section">
                <h4>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Informations Personnelles
                </h4>
                <div className="detail-item">
                  <span className="detail-label">Nom complet</span>
                  <span className="detail-value">{selectedEmployee.full_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Âge</span>
                  <span className="detail-value">{selectedEmployee.age} ans</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedEmployee.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Téléphone</span>
                  <span className="detail-value">{selectedEmployee.phone || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Adresse</span>
                  <span className="detail-value">{selectedEmployee.address || '-'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                    <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 10L14 14M14 10L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Expertise & Statut
                </h4>
                <div className="detail-item">
                  <span className="detail-label">Ménage</span>
                  <div className="detail-value">
                    {Array.isArray(selectedEmployee.competency_ids) && selectedEmployee.competency_ids.length ? (
                      selectedEmployee.competency_ids.map(id => (
                        <span key={id} className="admin-badge">{competencies[id] || id}</span>
                      ))
                    ) : 'Aucun'}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cuisine</span>
                  <div className="detail-value">
                    {Array.isArray(selectedEmployee.cuisine_type_ids) && selectedEmployee.cuisine_type_ids.length ? (
                      selectedEmployee.cuisine_type_ids.map(id => (
                        <span key={id} className="admin-badge cuisine-badge">{cuisineTypes[id] || id}</span>
                      ))
                    ) : 'Aucun'}
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date d'inscription</span>
                  <span className="detail-value">{new Date(selectedEmployee.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="detail-section" style={{ gridColumn: '1 / -1' }}>
                <h4>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Disponibilités Hebdomadaires
                </h4>
                <div className="availability-details">
                  {(() => {
                    let availabilityData = selectedEmployee.jours_disponibles;
                    if (typeof availabilityData === 'string') {
                      try { availabilityData = JSON.parse(availabilityData); } catch (e) { return <div>Erreur format</div>; }
                    }
                    if (availabilityData && typeof availabilityData === 'object') {
                      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                      return (
                        <div className="availability-grid">
                          {days.map(day => {
                            const dayData = availabilityData[day];
                            const isAvailable = dayData && dayData.start && dayData.end;
                            return (
                              <div key={day} className={`availability-day ${isAvailable ? 'available' : 'unavailable'}`}>
                                <div className="day-name">{day}</div>
                                {isAvailable ? (
                                  <div className="time-text">{dayData.start} - {dayData.end}</div>
                                ) : (
                                  <div className="unavailable-text">Fermé</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return <pre>{JSON.stringify(availabilityData, null, 2)}</pre>;
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="page-footer">
            <button className="action-button approve" onClick={() => {
              validateEmployee(selectedEmployee.id);
              closeEmployeeDetailsPage();
            }} disabled={updatingId === selectedEmployee.id}>
              Valider le Profil
            </button>
            <button className="action-button reject" onClick={() => {
              updateStatus(selectedEmployee.id, 'rejected');
              closeEmployeeDetailsPage();
            }} disabled={updatingId === selectedEmployee.id}>
              Refuser le Candidat
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


