import React, { useEffect, useState } from 'react';
import './AdminCrud.css';
import './AdminEmployeesCrud.css';
import './AdminConfirmedEmployeesCrud.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';

export default function AdminConfirmedEmployeesCrud({ token, onAuthError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [competencies, setCompetencies] = useState({}); // id -> name
  const [dayFilter, setDayFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('[AdminConfirmedEmployeesCrud] Loading confirmed employees from Supabase...');

      // Load all employees, then filter for confirmed housekeeping employees
      const { data: allEmployees, error: loadError } = await supabase
        .from('employees')
        .select('*')
        .order('updated_at', { ascending: false });

      if (loadError) {
        console.error('[AdminConfirmedEmployeesCrud] Error loading employees:', loadError);
        throw new Error(loadError.message || 'Erreur lors du chargement');
      }

      // Filter for confirmed housekeeping employees
      const confirmedEmployees = Array.isArray(allEmployees) ? allEmployees.filter(emp => {
        const metadata = emp.metadata || {};
        const empType = metadata.type;
        // Include housekeeping employees or employees without type (default to housekeeping)
        const isHousekeeping = !empType || empType === 'housekeeping' || empType === 'houseKlean';
        // Must be confirmed/accepted
        const isConfirmed = emp.status === 'accepted' || (emp.status === 'active' && emp.is_active === true);
        return isHousekeeping && isConfirmed;
      }) : [];

      // Transform data to match expected format
      const transformed = confirmedEmployees.map(emp => {
        const metadata = emp.metadata || {};
        return {
          id: emp.id,
          name: metadata.name || emp.full_name?.split(' ')[0] || '',
          prenom: metadata.prenom || emp.full_name?.split(' ').slice(1).join(' ') || '',
          full_name: emp.full_name || `${metadata.name || ''} ${metadata.prenom || ''}`.trim(),
          age: metadata.age || null,
          email: emp.email || '',
          phone: emp.phone || '',
          adresse: emp.address || metadata.adresse || '',
          photo: emp.photo || emp.photo_url || null,
          photo_url: emp.photo_url || emp.photo || null,
          competency_id: metadata.competency_id || null,
          competency_name: metadata.competency_name || null,
          competency: metadata.competency || null,
          jours_disponibles: metadata.availability || metadata.jours_disponibles || metadata.days || {},
          status: emp.status || 'accepted',
          is_active: emp.is_active || false,
          confirmed_at: emp.updated_at || emp.created_at,
          created_at: emp.created_at,
          ...emp
        };
      });

      console.log('[AdminConfirmedEmployeesCrud] Loaded confirmed employees:', transformed.length);
      setItems(transformed);
    } catch (e) {
      console.error('[AdminConfirmedEmployeesCrud] Exception loading:', e);
      setError(e.message || 'Impossible de charger les employés validés');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetencies = async () => {
    try {
      console.log('[AdminConfirmedEmployeesCrud] Loading competencies from Supabase...');

      const { data: competenciesData, error } = await supabase
        .from('competencies')
        .select('*');

      if (error) {
        console.warn('[AdminConfirmedEmployeesCrud] Competencies table not found or error:', error);
        setCompetencies({});
        return;
      }

      const map = {};
      if (Array.isArray(competenciesData)) {
        competenciesData.forEach(c => {
          if (c?.id) map[c.id] = c.name || c.name_fr || c.name_ar || c.name_en || `#${c.id}`;
        });
      }

      console.log('[AdminConfirmedEmployeesCrud] Loaded competencies:', Object.keys(map).length);
      setCompetencies(map);
    } catch (e) {
      console.warn('[AdminConfirmedEmployeesCrud] Exception loading competencies:', e);
      setCompetencies({});
    }
  };

  useEffect(() => { load(); loadCompetencies(); }, []);

  const renderDisponibilites = (val) => {
    if (!val) return null;
    let obj = val;
    if (typeof val === 'string') {
      try { obj = JSON.parse(val); } catch { obj = null; }
    }
    if (!obj || typeof obj !== 'object') {
      return <pre className="employee-json">{String(val)}</pre>;
    }
    // Either associative { lundi:{start,end}, ... } or array of { jour, heure_debut, heure_fin }
    const entries = Array.isArray(obj)
      ? obj.map((d, i) => ({
        key: d.jour || `jour_${i}`,
        label: d.jour || `Jour ${i + 1}`,
        start: d.start || d.heure_debut || '',
        end: d.end || d.heure_fin || ''
      }))
      : Object.keys(obj).map((k) => ({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        start: obj[k]?.start || obj[k]?.heure_debut || '',
        end: obj[k]?.end || obj[k]?.heure_fin || ''
      }));

    return (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {entries.map((e) => (
          <li key={e.key}>{e.label}: {e.start || '-'}{(e.start || e.end) ? ' - ' : ''}{e.end || '-'}</li>
        ))}
      </ul>
    );
  };

  const hasDay = (val, dayKey) => {
    if (!dayKey) return true;
    if (!val) return false;
    let obj = val;
    if (typeof val === 'string') {
      try { obj = JSON.parse(val); } catch { obj = null; }
    }
    if (!obj) return false;
    const key = dayKey.toLowerCase();
    if (Array.isArray(obj)) {
      return obj.some(d => (d.jour || '').toLowerCase() === key && ((d.start || d.heure_debut) || (d.end || d.heure_fin)));
    }
    return !!obj[key] && ((obj[key].start || obj[key].heure_debut) || (obj[key].end || obj[key].heure_fin));
  };

  // Fonction pour générer le CV en PDF
  const generateEmployeeCV = async (employee) => {
    try {
      // Créer un élément temporaire pour le CV
      const cvElement = document.createElement('div');
      cvElement.id = `cv-${employee.id}`;
      cvElement.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 210mm;
        min-height: 297mm;
        background: white;
        padding: 20mm;
        font-family: 'Arial', sans-serif;
        color: #333;
        line-height: 1.6;
      `;

      // Préparer l'image de profil avec préchargement
      let profileImageHtml = '';
      if (employee.photo) {
        const imageUrl = getEmployeePhotoUrl(employee);
        console.log('URL de l\'image générée:', imageUrl);
        console.log('Données de l\'employé:', employee);
        try {
          // Convertir l'image en base64
          const base64Image = await convertImageToBase64(imageUrl);
          console.log('Image convertie en base64 avec succès');
          profileImageHtml = `
            <img src="${base64Image}" 
                 alt="Photo de ${employee.name}" 
                 style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 4px solid #3b82f6;" />
          `;
        } catch (error) {
          console.warn('Image non disponible:', error.message);
          console.warn('URL qui a échoué:', imageUrl);
          profileImageHtml = `
            <div style="width: 120px; height: 120px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #9ca3af; margin: 0 auto 15px;">👤</div>
          `;
        }
      } else {
        profileImageHtml = `
          <div style="width: 120px; height: 120px; border-radius: 50%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #9ca3af; margin: 0 auto 15px;">👤</div>
        `;
      }

      // Contenu du CV
      cvElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
          ${profileImageHtml}
          <h1 style="color: #1e40af; margin: 0; font-size: 28px; font-weight: bold;">${employee.name} ${employee.prenom}</h1>
          <p style="color: #64748b; margin: 5px 0; font-size: 16px;">${competencies[employee.competency_id] || 'Spécialiste'}</p>
          <p style="color: #64748b; margin: 0; font-size: 14px;">Employé confirmé depuis ${employee.confirmed_at ? new Date(employee.confirmed_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
          <div>
            <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px;">📞 Informations de Contact</h2>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Email:</strong> 
              <span style="color: #64748b;">${employee.email || 'Non renseigné'}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Téléphone:</strong> 
              <span style="color: #64748b;">${employee.phone || 'Non renseigné'}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Âge:</strong> 
              <span style="color: #64748b;">${employee.age || 'Non renseigné'} ans</span>
            </div>
            <div>
              <strong style="color: #374151;">Adresse:</strong> 
              <span style="color: #64748b;">${employee.adresse || 'Non renseignée'}</span>
            </div>
          </div>

          <div>
            <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px;">💼 Informations Professionnelles</h2>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Compétence:</strong> 
              <span style="color: #64748b;">${competencies[employee.competency_id] || employee.competency_id || 'Non renseignée'}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Statut:</strong> 
              <span style="color: #059669; font-weight: bold;">${employee.status || 'Confirmé'}</span>
            </div>
            <div style="margin-bottom: 10px;">
              <strong style="color: #374151;">Date d'inscription:</strong> 
              <span style="color: #64748b;">${employee.created_at ? new Date(employee.created_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
            <div>
              <strong style="color: #374151;">Date de confirmation:</strong> 
              <span style="color: #64748b;">${employee.confirmed_at ? new Date(employee.confirmed_at).toLocaleDateString('fr-FR') : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 style="color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-bottom: 15px; font-size: 18px;">📅 Disponibilités</h2>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
            ${renderDisponibilitesForPDF(employee.jours_disponibles)}
          </div>
        </div>

        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <p>CV généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} - Système de gestion des employés</p>
        </div>
      `;

      document.body.appendChild(cvElement);

      // Attendre que les images se chargent
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Générer le PDF
      const canvas = await html2canvas(cvElement, {
        scale: 2,
        useCORS: false, // Pas nécessaire avec base64
        allowTaint: false, // Pas nécessaire avec base64
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000, // Plus de temps pour les conversions
        removeContainer: false,
        foreignObjectRendering: false // Éviter les problèmes avec les images
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Télécharger le PDF
      pdf.save(`CV_${employee.name}_${employee.prenom}_${new Date().toISOString().split('T')[0]}.pdf`);

      // Nettoyer
      document.body.removeChild(cvElement);

    } catch (error) {
      console.error('Erreur lors de la génération du CV:', error);
      alert('Erreur lors de la génération du CV. Veuillez réessayer.');
    }
  };

  // Fonction pour obtenir l'URL de la photo de l'employé
  const getEmployeePhotoUrl = (employee) => {
    if (!employee.photo && !employee.photo_url) return '';

    const photoPath = employee.photo_url || employee.photo;
    const rawP = String(photoPath || '');
    const p = rawP.replace(/^"|"$/g, '').trim();

    // Si c'est déjà une URL absolue (y compris Supabase Storage URLs)
    if (/^https?:\/\//i.test(p)) {
      return p;
    }

    // Si c'est un chemin Supabase Storage, construire l'URL publique
    if (p.startsWith('employees/') || p.includes('employees/')) {
      const { data } = supabase.storage.from('employees').getPublicUrl(p);
      return data?.publicUrl || '';
    }

    // Fallback: essayer de récupérer depuis Supabase Storage
    try {
      const { data } = supabase.storage.from('employees').getPublicUrl(p);
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    } catch (e) {
      // Ignorer les erreurs
    }

    return '';
  };

  // Fonction pour convertir une image en base64
  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataURL);
        } catch (error) {
          reject(new Error(`Failed to convert image to base64: ${error.message}`));
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  };

  // Fonction pour rendre les disponibilités pour le PDF
  const renderDisponibilitesForPDF = (val) => {
    if (!val) return '<p style="color: #9ca3af; font-style: italic;">Aucune disponibilité renseignée</p>';

    let obj = val;
    if (typeof val === 'string') {
      try { obj = JSON.parse(val); } catch { obj = null; }
    }

    if (!obj || typeof obj !== 'object') {
      return `<p style="color: #9ca3af; font-style: italic;">${String(val)}</p>`;
    }

    const entries = Array.isArray(obj)
      ? obj.map((d, i) => ({
        key: d.jour || `jour_${i}`,
        label: d.jour || `Jour ${i + 1}`,
        start: d.start || d.heure_debut || '',
        end: d.end || d.heure_fin || ''
      }))
      : Object.keys(obj).map((k) => ({
        key: k,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        start: obj[k]?.start || obj[k]?.heure_debut || '',
        end: obj[k]?.end || obj[k]?.heure_fin || ''
      }));

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        ${entries.map((e) => `
          <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
            <strong style="color: #374151;">${e.label}:</strong><br>
            <span style="color: #64748b;">${e.start || '-'} ${(e.start || e.end) ? ' - ' : ''} ${e.end || '-'}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  // Fonction pour supprimer un employé (bouton Supreme)
  const handleSupremeAction = async (employee) => {
    const confirmMessage = `هل أنت متأكد من حذف الموظف "${employee.name} ${employee.prenom}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('[AdminConfirmedEmployeesCrud] Deleting employee:', employee.id);

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) {
        console.error('[AdminConfirmedEmployeesCrud] Error deleting employee:', error);
        alert(`خطأ في حذف الموظف: ${error.message || 'خطأ غير معروف'}`);
        return;
      }

      console.log('[AdminConfirmedEmployeesCrud] Employee deleted successfully');
      alert(`تم حذف الموظف "${employee.name} ${employee.prenom}" بنجاح`);
      // إعادة تحميل القائمة
      await load();
    } catch (error) {
      console.error('[AdminConfirmedEmployeesCrud] Exception deleting employee:', error);
      alert('خطأ في الاتصال بالخادم');
    }
  };

  return (
    <section className="admin-card">
      <div className="admin-toolbar">
        <h2>Employés validés</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Rechercher (nom, email)" value={q} onChange={(e) => setQ(e.target.value)} className="admin-search" />
          <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="admin-search">
            <option value="">Tous les jours</option>
            <option value="lundi">Lundi</option>
            <option value="mardi">Mardi</option>
            <option value="mercredi">Mercredi</option>
            <option value="jeudi">Jeudi</option>
            <option value="vendredi">Vendredi</option>
            <option value="samedi">Samedi</option>
            <option value="dimanche">Dimanche</option>
          </select>
          <button className="admin-crud-add-button" onClick={load} disabled={loading}>{loading ? 'Chargement…' : 'Actualiser'}</button>
        </div>
      </div>

      {error && (<div className="admin-crud-error">{error}</div>)}

      <div style={{ overflow: 'auto' }}>
        <table className="admin-table">
          <thead className="admin-thead">
            <tr>
              <th className="admin-th">#</th>
              <th className="admin-th">Photo</th>
              <th className="admin-th">Candidat</th>
              <th className="admin-th">Contact</th>
              <th className="admin-th">Compétence</th>
              <th className="admin-th">Disponibilités</th>
              <th className="admin-th">Confirmé le</th>
              <th className="admin-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items
              .filter((e) => !q || (e.name || '').toLowerCase().includes(q.toLowerCase()) || (e.prenom || '').toLowerCase().includes(q.toLowerCase()) || (e.email || '').toLowerCase().includes(q.toLowerCase()))
              .filter((e) => hasDay(e.jours_disponibles, dayFilter))
              .map((e) => (
                <tr key={e.id}>
                  <td className="admin-td" data-label="#">{e.id}</td>
                  <td className="admin-td" data-label="Photo">
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
                              if (ev.currentTarget.nextElementSibling) {
                                ev.currentTarget.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                          <div className="employee-avatar placeholder" style={{ display: 'none' }}>👤</div>
                        </>
                      ) : (
                        <div className="employee-avatar placeholder" style={{ display: 'flex' }}>👤</div>
                      );
                    })()}
                  </td>
                  <td className="admin-td" data-label="Candidat">
                    <div style={{ fontWeight: 700 }}>{e.name} {e.prenom}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{e.age} ans</div>
                  </td>
                  <td className="admin-td" data-label="Contact">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: '13px' }}>{e.email}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{e.phone || '-'}</div>
                    </div>
                  </td>
                  <td className="admin-td" data-label="Compétence">
                    <span className="admin-badge employee-competency-badge">
                      {competencies[e.competency_id] || e.competency_id || 'N/A'}
                    </span>
                  </td>
                  <td className="admin-td" data-label="Disponibilités">
                    <div style={{ fontSize: '12px' }}>
                      {renderDisponibilites(e.jours_disponibles)}
                    </div>
                  </td>
                  <td className="admin-td" data-label="Confirmé">
                    <div style={{ fontSize: '12px' }}>{e.confirmed_at ? new Date(e.confirmed_at).toLocaleDateString() : '-'}</div>
                  </td>
                  <td className="admin-td" data-label="Actions">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        className="admin-action-button download-button"
                        onClick={() => generateEmployeeCV(e)}
                        title="Télécharger le CV PDF"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4a2 2 0 0 1 2-2M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        CV
                      </button>
                      <button
                        className="admin-action-button supreme-button"
                        onClick={() => handleSupremeAction(e)}
                        title="Supprimer définitivement"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


