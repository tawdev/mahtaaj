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
  const p = rawP.replace(/^"|"$/g,'').trim();
  
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
  const [competencies, setCompetencies] = useState({}); // id -> name
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
      const housekeepingEmployees = Array.isArray(allEmployees) ? allEmployees.filter(emp => {
        const metadata = emp.metadata || {};
        const empType = metadata.type;
        // Include housekeeping employees or employees without type (default to housekeeping)
        return !empType || empType === 'housekeeping' || empType === 'houseKlean';
      }) : [];
      
      // Transform data to match expected format
      const transformed = housekeepingEmployees.map(emp => {
        const metadata = emp.metadata || {};
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
          competency_id: metadata.competency_id || null,
          competency_name: metadata.competency_name || null,
          competency: metadata.competency || null,
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
      console.log('[AdminEmployeesCrud] Loading competencies from Supabase...');
      
      // Try to load from competencies table if it exists
      const { data: competenciesData, error } = await supabase
        .from('competencies')
        .select('*');
      
      if (error) {
        console.warn('[AdminEmployeesCrud] Competencies table not found or error:', error);
        // If table doesn't exist, use empty map
        setCompetencies({});
        return;
      }
      
      const map = {};
      if (Array.isArray(competenciesData)) {
        competenciesData.forEach(c => { 
          if (c?.id) map[c.id] = c.name || c.name_fr || c.name_ar || c.name_en || `#${c.id}`; 
        });
      }
      
      console.log('[AdminEmployeesCrud] Loaded competencies:', Object.keys(map).length);
      setCompetencies(map);
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

      <div style={{overflow:'auto'}}>
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
              <th className="admin-th">Disponibilités</th>
              <th className="admin-th">Statut</th>
              <th className="admin-th">Créé</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td className="admin-td">{e.id}</td>
                <td className="admin-td">
                  {(() => {
                    const photoUrl = getEmployeePhotoUrl(e);
                    return photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={e.name || 'photo'}
                        className="employee-avatar"
                        width={80}
                        height={80}
                        style={{objectFit:'cover',borderRadius:999}}
                        onError={(ev) => {
                          ev.currentTarget.style.display = 'none';
                          ev.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null;
                  })()}
                  <div className="employee-avatar placeholder" style={{display: 'flex'}} aria-label="Sans photo">👤</div>
                </td>
                <td className="admin-td">{e.name}</td>
                <td className="admin-td">{e.prenom}</td>
                <td className="admin-td">{e.age}</td>
                <td className="admin-td">{e.email}</td>
                <td className="admin-td">{e.phone || '-'}</td>
                <td className="admin-td">{e.address || e.metadata?.adresse || '-'}</td>
                <td className="admin-td">
                  <span className="admin-badge employee-competency-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {competencies[e.competency_id] || e.competency_name || e.competency || `#${e.competency_id}`}
                  </span>
                </td>
                <td className="admin-td"><pre className="employee-json">{typeof e.jours_disponibles === 'string' ? e.jours_disponibles : JSON.stringify(e.jours_disponibles, null, 2)}</pre></td>
                <td className="admin-td">
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span className={`status-chip ${e.status === 'accepted' ? 'accepted' : e.status === 'rejected' ? 'rejected' : 'pending'}`}> {e.status || 'pending'} </span>
                    <button className="status-approve" onClick={()=>validateEmployee(e.id)} disabled={updatingId===e.id} title="Valider">
                      ✓
                    </button>
                    <button className="status-reject" onClick={()=>updateStatus(e.id,'rejected')} disabled={updatingId===e.id} title="Refuser">
                      ✕
                    </button>
                  </div>
                </td>
                <td className="admin-td">{e.created_at ? new Date(e.created_at).toLocaleString() : ''}</td>
                <td className="admin-td">
                  <div className="employee-actions">
                    <button 
                      className="view-button" 
                      onClick={() => showEmployeeDetailsPage(e)}
                      title="Voir les détails"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Voir
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
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Retour à la liste
            </button>
            <h2>Détails de l'Employé</h2>
          </div>
          
          <div className="page-content">
            <div className="employee-profile-section">
              <div className="profile-photo">
                {(() => {
                  const photoUrl = getEmployeePhotoUrl(selectedEmployee);
                  return photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={selectedEmployee.name || 'photo'}
                      className="employee-large-avatar"
                      onError={(ev) => {
                        ev.currentTarget.style.display = 'none';
                        ev.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null;
                })()}
                <div className="employee-large-avatar placeholder" style={{display: 'flex'}}>
                  👤
                </div>
              </div>
              
              <div className="profile-info">
                <h3 className="employee-name">{selectedEmployee.name} {selectedEmployee.prenom}</h3>
                <p className="employee-id">ID: #{selectedEmployee.id}</p>
                <div className={`status-badge ${selectedEmployee.status === 'accepted' ? 'accepted' : selectedEmployee.status === 'rejected' ? 'rejected' : 'pending'}`}>
                  {selectedEmployee.status || 'pending'}
                </div>
              </div>
            </div>

            <div className="employee-details-grid">
              <div className="detail-section">
                <h4>Informations Personnelles</h4>
                <div className="detail-item">
                  <span className="detail-label">Nom:</span>
                  <span className="detail-value">{selectedEmployee.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Prénom:</span>
                  <span className="detail-value">{selectedEmployee.prenom}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Âge:</span>
                  <span className="detail-value">{selectedEmployee.age} ans</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedEmployee.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Téléphone:</span>
                  <span className="detail-value">{selectedEmployee.phone || 'Non renseigné'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Adresse:</span>
                  <span className="detail-value">{selectedEmployee.address || selectedEmployee.metadata?.adresse || 'Non renseignée'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Informations Professionnelles</h4>
                <div className="detail-item">
                  <span className="detail-label">Compétence:</span>
                  <span className="detail-value">
                    {competencies[selectedEmployee.competency_id] || selectedEmployee.competency_name || selectedEmployee.competency || `#${selectedEmployee.competency_id}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Statut:</span>
                  <span className="detail-value">
                    <span className={`status-chip ${selectedEmployee.status === 'accepted' ? 'accepted' : selectedEmployee.status === 'rejected' ? 'rejected' : 'pending'}`}>
                      {selectedEmployee.status || 'pending'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date d'inscription:</span>
                  <span className="detail-value">
                    {selectedEmployee.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Non disponible'}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Disponibilités</h4>
                <div className="availability-details">
                  {(() => {
                    let availabilityData = selectedEmployee.jours_disponibles;
                    
                    // Parse string if needed
                    if (typeof availabilityData === 'string') {
                      try {
                        availabilityData = JSON.parse(availabilityData);
                      } catch (e) {
                        return <div className="availability-error">Format de données invalide</div>;
                      }
                    }
                    
                    // If it's an object with day schedules
                    if (availabilityData && typeof availabilityData === 'object') {
                      const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                      const dayNames = {
                        'lundi': 'Lundi',
                        'mardi': 'Mardi', 
                        'mercredi': 'Mercredi',
                        'jeudi': 'Jeudi',
                        'vendredi': 'Vendredi',
                        'samedi': 'Samedi',
                        'dimanche': 'Dimanche'
                      };
                      
                      return (
                        <div className="availability-grid">
                          {days.map(day => {
                            const dayData = availabilityData[day];
                            const isAvailable = dayData && dayData.start && dayData.end;
                            
                            return (
                              <div key={day} className={`availability-day ${isAvailable ? 'available' : 'unavailable'}`}>
                                <div className="day-name">{dayNames[day]}</div>
                                {isAvailable ? (
                                  <div className="time-slot">
                                    <div className="time-range">
                                      <span className="time-icon">🕐</span>
                                      <span className="time-text">{dayData.start} - {dayData.end}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="unavailable-text">
                                    <span className="unavailable-icon">❌</span>
                                    <span>Non disponible</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    
                    // Fallback to original JSON display
                    return (
                      <pre className="availability-json">
                        {JSON.stringify(availabilityData, null, 2)}
                      </pre>
                    );
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Valider l'employé
            </button>
            <button className="action-button reject" onClick={() => {
              updateStatus(selectedEmployee.id, 'rejected');
              closeEmployeeDetailsPage();
            }} disabled={updatingId === selectedEmployee.id}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refuser l'employé
            </button>
          </div>
        </div>
      )}
    </section>
  );
}


