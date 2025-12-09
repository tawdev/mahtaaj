import React, { useEffect, useState, useCallback } from 'react';
import './Security.css';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Security() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const getTranslatedRole = (roleName) => {
    if (!roleName) return t('security_page.role_not_available');
    
    // Direct translations for common roles
    const directTranslations = {
      'Chef de sécurité': t('security_page.chef_de_securite', 'رئيس الأمن'),
      'Agent de sûreté': t('security_page.agent_de_surete', 'وكيل الأمن المتخصص'),
      'Agent de sécurité': t('security_page.agent_de_securite', 'وكيل الأمن العام'),
      'Superviseur sécurité': t('security_page.superviseur_securite', 'مشرف فريق الأمن')
    };
    
    if (directTranslations[roleName]) {
      return directTranslations[roleName];
    }
    
    // Create role key from name
    const roleKey = roleName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Try multiple key variations
    const possibleKeys = [
      `security_roles.${roleKey}.title`,
      `security_roles.${roleName.toLowerCase().replace(/\s+/g, '_')}.title`,
      `security_roles.${roleName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.title`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return roleName; // Fallback to original name
  };

  const getTranslatedRoleDescription = (roleName) => {
    if (!roleName) return t('security_page.description_not_available');
    
    // Create role key from name
    const roleKey = roleName.toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Try multiple key variations
    const possibleKeys = [
      `security_roles.${roleKey}.description`,
      `security_roles.${roleName.toLowerCase().replace(/\s+/g, '_')}.description`,
      `security_roles.${roleName.toLowerCase().replace(/[éèêë]/g, 'e').replace(/[àáâãäå]/g, 'a').replace(/[ç]/g, 'c').replace(/\s+/g, '_')}.description`
    ];
    
    for (const key of possibleKeys) {
      const translation = t(key, { defaultValue: null });
      if (translation && translation !== key) {
        return translation;
      }
    }
    
    return roleName; // Fallback to original name
  };
  const [personnel, setPersonnel] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleData, setSelectedRoleData] = useState(null);
  const [roleImage, setRoleImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, text: '' });
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    type_reservation: 'heures', // 'heures' ou 'jours'
    // Pour réservation par heures
    date_reservation: '',
    heure_debut: '',
    nombre_heures: 1,
    // Pour réservation par jours
    date_debut: '',
    date_fin: '',
    phone: '',
    prix_total: 0,
    role_id: null,
  });

  // Load roles function with useCallback to prevent unnecessary re-renders
  const loadRoles = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('[Security] Loading security roles from Supabase');
      
      const { data, error } = await supabase
        .from('security_roles')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });

      if (error) {
        console.error('[Security] Error loading roles:', error);
        setError(t('security_page.load_roles_error') + ': ' + error.message);
        setRoles([]); // Ensure roles is set even on error
        setLoading(false); // Make sure loading is set to false on error
        return;
      }

      console.log('[Security] Loaded roles:', data?.length || 0, 'roles');
      if (data && data.length > 0) {
        console.log('[Security] First role sample:', data[0]);
        console.log('[Security] First role image field:', data[0].image);
        console.log('[Security] First role all fields:', Object.keys(data[0]));
      }
      
      // Ensure we set roles even if data is null/undefined
      const rolesData = Array.isArray(data) ? data : [];
      
      // Set roles first, then loading to false
      setRoles(rolesData);
      console.log('[Security] Roles state updated, count:', rolesData.length);
      
      // Force a re-render by ensuring state update completes
      if (rolesData.length === 0) {
        console.warn('[Security] No roles found');
      }
    } catch (e) {
      console.error('[Security] Exception loading roles:', e);
      setError(t('security_page.load_roles_error') + ': ' + e.message);
      setRoles([]); // Ensure roles is set even on error
    } finally {
      setLoading(false);
      console.log('[Security] Loading set to false');
    }
  }, [t]);

  // Initial load on mount - only once
  useEffect(() => {
    let isMounted = true;
    let cancelled = false;
    
    const fetchData = async () => {
      if (!isMounted || cancelled) return;
      
      try {
        await loadRoles();
      } catch (error) {
        if (!cancelled) {
          console.error('[Security] Error in initial load:', error);
        }
      }
    };
    
    // Start loading immediately
    fetchData();
    
    return () => {
      isMounted = false;
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reload data when language changes
  useEffect(() => {
    // Skip initial mount - only reload when language actually changes
    const reloadData = async () => {
      await loadRoles();
      if (selectedRole) {
        // Force reload role details with the new language
        await loadRoleDetails(selectedRole);
      }
    };
    
    try {
      // Persist current language just in case
      localStorage.setItem('i18nextLng', i18n.language || 'fr');
    } catch (_) {}
    
    // Only reload if we have roles already loaded (language change, not initial mount)
    if (roles.length > 0 || selectedRole) {
      reloadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // Prevent background scroll and ensure modals appear above navbar
  useEffect(() => {
    if (showReservationForm) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = previousOverflow; };
    }
    return undefined;
  }, [showReservationForm]);

  const loadRoleDetails = useCallback(async (roleId) => {
    if (!roleId) return;
    
    try {
      setError('');
      setLoading(true);
      
      console.log('[Security] Loading role details for role_id:', roleId);
      
      let role = null;
      
      // Reload roles if not loaded yet
      if (roles.length === 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('security_roles')
          .select('*')
          .eq('is_active', true)
          .order('order', { ascending: true });
        
        if (rolesError) {
          console.error('[Security] Error loading roles:', rolesError);
          throw rolesError;
        }
        
        const rolesList = Array.isArray(rolesData) ? rolesData : [];
        setRoles(rolesList);
        
        role = rolesList.find(r => r.id === roleId);
      } else {
        // Find the role data
        role = roles.find(r => r.id === roleId);
      }
      
      if (role) {
        setSelectedRoleData(role);
        setSelectedRole(roleId);
      } else {
        console.warn('[Security] Role not found:', roleId);
        setError(t('security_page.role_not_found') || 'Role not found');
        return;
      }
      
      // Use role image if available, otherwise try to get from securities table
      if (role.image) {
        // Helper function to get image URL from Supabase Storage
        const getImageUrl = (imagePath) => {
          if (!imagePath) return null;
          
          // If it's already a Supabase URL, return it
          if (imagePath.includes('supabase.co/storage')) {
            return imagePath;
          }
          
          // If it's an old Laravel path, extract filename and try to get from Supabase
          if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/')) {
            const filename = imagePath.split('/').pop();
            if (filename) {
              const { data: { publicUrl } } = supabase.storage
                .from('employees')
                .getPublicUrl(filename);
              return publicUrl;
            }
            return null;
          }
          
          // If it's just a filename, try to get from Supabase Storage
          if (!imagePath.includes('/') && !imagePath.includes('http')) {
            const { data: { publicUrl } } = supabase.storage
              .from('employees')
              .getPublicUrl(imagePath);
            return publicUrl;
          }
          
          return imagePath;
        };
        
        const imageUrl = getImageUrl(role.image);
        setRoleImage(imageUrl || '/nettoyage1.jpg');
      } else {
        // Fallback: Get first agent image for this role from securities table
        const { data: securitiesData, error: securitiesError } = await supabase
          .from('securities')
          .select('*')
          .eq('is_active', true)
          .eq('status', 'active')
          .limit(1);
        
        if (securitiesError) {
          console.error('[Security] Error loading securities:', securitiesError);
          setRoleImage('/nettoyage1.jpg');
        } else if (securitiesData && securitiesData.length > 0) {
          const firstAgent = securitiesData[0];
          if (firstAgent && (firstAgent.photo || firstAgent.photo_url)) {
            // Helper function to get image URL from Supabase Storage
            const getImageUrl = (imagePath) => {
              if (!imagePath) return null;
              
              // If it's already a Supabase URL, return it
              if (imagePath.includes('supabase.co/storage')) {
                return imagePath;
              }
              
              // If it's an old Laravel path, extract filename and try to get from Supabase
              if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/')) {
                const filename = imagePath.split('/').pop();
                if (filename) {
                  const { data: { publicUrl } } = supabase.storage
                    .from('employees')
                    .getPublicUrl(filename);
                  return publicUrl;
                }
                return null;
              }
              
              // If it's just a filename, try to get from Supabase Storage
              if (!imagePath.includes('/') && !imagePath.includes('http')) {
                const { data: { publicUrl } } = supabase.storage
                  .from('employees')
                  .getPublicUrl(imagePath);
                return publicUrl;
              }
              
              return imagePath;
            };
            
            const imageUrl = getImageUrl(firstAgent.photo_url || firstAgent.photo);
            setRoleImage(imageUrl || '/nettoyage1.jpg');
          } else {
            setRoleImage('/nettoyage1.jpg');
          }
        } else {
          setRoleImage('/nettoyage1.jpg');
        }
      }
    } catch (e) { 
      console.error('[Security] Error loading role details:', e);
      setError(t('security_page.load_personnel_error') + ': ' + e.message); 
    } finally {
      setLoading(false);
    }
  }, [roles, t]);

  const openReservationForm = () => {
    const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userInfo?.id) {
      setToast({ show: true, text: t('security_page.please_login_to_reserve') });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setTimeout(() => { window.location.href = '/login-register'; }, 600);
      return;
    }
    setReservationForm({
      type_reservation: 'heures',
      date_reservation: '',
      heure_debut: '',
      nombre_heures: 1,
      date_debut: '',
      date_fin: '',
      phone: '',
      prix_total: 0,
      role_id: selectedRole,
    });
    setShowReservationForm(true);
  };

  const calculateReservationPrice = (form) => {
    const PRIX_BASE = 150; // Prix de base pour 4 heures
    const PRIX_HEURE_SUPP = 40; // Prix par heure supplémentaire après 4 heures
    const HEURES_PAR_JOUR = 8; // Nombre d'heures par jour
    
    if (form.type_reservation === 'heures') {
      // Réservation par heures
      const nombreHeures = parseInt(form.nombre_heures) || 1;
      
      if (nombreHeures <= 4) {
        // Si ≤ 4 heures : prix de base
        return PRIX_BASE;
      } else {
        // Si > 4 heures : prix de base + 40 DH par heure supplémentaire
        const heuresSupplementaires = nombreHeures - 4;
        return PRIX_BASE + (heuresSupplementaires * PRIX_HEURE_SUPP);
      }
    } else if (form.type_reservation === 'jours') {
      // Réservation par jours
      if (form.date_debut && form.date_fin) {
        const dateDebut = new Date(form.date_debut);
        const dateFin = new Date(form.date_fin);
        
        // Vérifier que la date de fin est après la date de début
        if (dateFin < dateDebut) {
          return 0;
        }
        
        // Calculer le nombre de jours (inclusif) - inclure le jour de début et le jour de fin
        // Normaliser les dates pour éviter les problèmes de fuseau horaire
        const dateDebutNormalized = new Date(dateDebut);
        dateDebutNormalized.setHours(0, 0, 0, 0);
        const dateFinNormalized = new Date(dateFin);
        dateFinNormalized.setHours(0, 0, 0, 0);
        
        // Calculer la différence en millisecondes
        const diffTime = dateFinNormalized.getTime() - dateDebutNormalized.getTime();
        // Convertir en jours et ajouter 1 pour inclure le jour de début
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const nombreJours = Math.max(1, diffDays + 1); // Au moins 1 jour, +1 pour inclure le jour de début
        
        // Calculer le prix par jour
        // Chaque jour = 8 heures
        // Prix par jour = 150 (4h) + (8-4) * 40 = 150 + 160 = 310 DH
        const prixParJour = PRIX_BASE + ((HEURES_PAR_JOUR - 4) * PRIX_HEURE_SUPP);
        
        // Prix total = prix par jour * nombre de jours
        const prixTotal = prixParJour * nombreJours;
        
        return prixTotal;
      }
      return 0;
    }
    
    return 0;
  };

  const updateReservationField = (key, value) => {
    setReservationForm(prev => {
      const next = { ...prev, [key]: value };
      next.prix_total = calculateReservationPrice(next);
      return next;
    });
  };

  const submitReservation = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (reservationLoading) {
      console.log('⚠️ Already submitting, ignoring duplicate submission');
      return;
    }
    
    setReservationLoading(true);
    
    try {
      // Validation générale
      if (!reservationForm.phone.trim()) {
        setToast({ show: true, text: t('security_page.please_enter_phone') });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }
      
      if (!reservationForm.role_id) {
        setToast({ show: true, text: t('security_page.role_not_selected') });
        setTimeout(() => setToast({ show: false, text: '' }), 3000);
        setReservationLoading(false);
        return;
      }
      
      // Validation selon le type de réservation
      if (reservationForm.type_reservation === 'heures') {
        if (!reservationForm.date_reservation) {
          setToast({ show: true, text: t('security_page.please_select_date') });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
        
        if (!reservationForm.heure_debut) {
          setToast({ show: true, text: 'Veuillez sélectionner l\'heure de début' });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
        
        const nombreHeures = parseInt(reservationForm.nombre_heures) || 0;
        if (nombreHeures < 1) {
          setToast({ show: true, text: 'Le nombre d\'heures doit être au moins 1' });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
      } else if (reservationForm.type_reservation === 'jours') {
        if (!reservationForm.date_debut) {
          setToast({ show: true, text: 'Veuillez sélectionner la date de début' });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
        
        if (!reservationForm.date_fin) {
          setToast({ show: true, text: 'Veuillez sélectionner la date de fin' });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
        
        const dateDebut = new Date(reservationForm.date_debut);
        const dateFin = new Date(reservationForm.date_fin);
        
        // Normaliser les dates pour la comparaison
        dateDebut.setHours(0, 0, 0, 0);
        dateFin.setHours(0, 0, 0, 0);
        
        if (dateFin < dateDebut) {
          setToast({ show: true, text: 'La date de fin doit être après ou égale à la date de début' });
          setTimeout(() => setToast({ show: false, text: '' }), 3000);
          setReservationLoading(false);
          return;
        }
      }
      
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 User info:', userInfo);
      
      // Get user ID from Supabase session (must be UUID, not numeric ID)
      // user_id in reserve_security is UUID type (references auth.users)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null; // Must be UUID from Supabase Auth
      
      // Note: user_id can be null if user is not logged in via Supabase Auth
      // The reservation will still be saved with firstname, email, phone for identification
      // The table allows user_id to be NULL (ON DELETE SET NULL)

      // Calculate total price
      const totalPrice = calculateReservationPrice(reservationForm);
      
      // Prepare location - must not be empty (NOT NULL constraint)
      const location = userInfo.location || reservationForm.location || 'Non spécifié';
      
      // Prepare dates according to reservation type
      let dateReservation = null;
      let preferredDate = null;
      let heureDebut = null;
      let heureFin = null;
      let dateDebut = null;
      let dateFin = null;
      
      if (reservationForm.type_reservation === 'heures') {
        dateReservation = reservationForm.date_reservation ? new Date(reservationForm.date_reservation).toISOString().split('T')[0] : null;
        preferredDate = reservationForm.date_reservation && reservationForm.heure_debut 
          ? new Date(`${reservationForm.date_reservation}T${reservationForm.heure_debut}:00`).toISOString() 
          : null;
        heureDebut = reservationForm.heure_debut || null;
        // Calculer l'heure de fin basée sur l'heure de début + nombre d'heures
        if (reservationForm.heure_debut && reservationForm.nombre_heures) {
          const [hours, minutes] = reservationForm.heure_debut.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          const endDate = new Date(startDate.getTime() + (parseInt(reservationForm.nombre_heures) * 60 * 60 * 1000));
          heureFin = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        }
      } else if (reservationForm.type_reservation === 'jours') {
        // Pour réservation par jours, utiliser date_debut et date_fin
        if (reservationForm.date_debut) {
          const dateDebutObj = new Date(reservationForm.date_debut);
          dateDebutObj.setHours(0, 0, 0, 0);
          dateDebut = dateDebutObj.toISOString().split('T')[0];
          dateReservation = dateDebut;
          preferredDate = dateDebutObj.toISOString();
        } else {
          dateDebut = null;
          dateReservation = null;
          preferredDate = null;
        }
        
        if (reservationForm.date_fin) {
          const dateFinObj = new Date(reservationForm.date_fin);
          dateFinObj.setHours(0, 0, 0, 0);
          dateFin = dateFinObj.toISOString().split('T')[0];
        } else {
          dateFin = null;
        }
      }
      
      // Build insert data with only required fields first
      const insertData = {
        user_id: userId || null,
        security_id: null, // Will be assigned later by admin
        firstname: userInfo.firstname || userInfo.name || 'User',
        phone: reservationForm.phone.trim(),
        location: location, // Required field, must not be empty
        email: userInfo.email || null,
        message: `Reservation for role_id: ${reservationForm.role_id}, Type: ${reservationForm.type_reservation}`,
        total_price: totalPrice || 0,
        status: 'pending',
        preferred_date: preferredDate,
        admin_notes: `Type: ${reservationForm.type_reservation}, ${reservationForm.type_reservation === 'heures' 
          ? `Date: ${dateReservation}, Heure début: ${heureDebut || 'N/A'}, Nombre d'heures: ${reservationForm.nombre_heures || 'N/A'}`
          : `Date début: ${dateDebut || 'N/A'}, Date fin: ${dateFin || 'N/A'}`}`
      };
      
      // Try to add optional columns (only if they exist in the table)
      // These columns might not exist yet, so we'll try to add them but won't fail if they don't exist
      try {
        // Ensure type_reservation is valid ('heures' or 'jours')
        if (reservationForm.type_reservation && (reservationForm.type_reservation === 'heures' || reservationForm.type_reservation === 'jours')) {
          insertData.type_reservation = reservationForm.type_reservation;
        } else if (reservationForm.type_reservation) {
          console.warn('[Security] Invalid type_reservation value:', reservationForm.type_reservation, 'using default: heures');
          insertData.type_reservation = 'heures';
        }
        if (dateReservation) {
          insertData.date_reservation = dateReservation;
        }
        if (heureDebut) {
          insertData.heure_debut = heureDebut;
        }
        if (heureFin) {
          insertData.heure_fin = heureFin;
        }
        if (dateDebut) {
          insertData.date_debut = dateDebut;
        }
        if (dateFin) {
          insertData.date_fin = dateFin;
        }
        if (reservationForm.type_reservation === 'heures' && reservationForm.nombre_heures) {
          insertData.nombre_heures = parseInt(reservationForm.nombre_heures);
        }
        if (reservationForm.role_id) {
          insertData.role_id = reservationForm.role_id;
        }
      } catch (e) {
        console.warn('[Security] Could not add optional columns:', e);
      }
      
      // Ensure type_reservation is always valid before inserting
      console.log('[Security] type_reservation value before validation:', insertData.type_reservation, 'Type:', typeof insertData.type_reservation);
      
      if (insertData.type_reservation) {
        // Normalize the value (trim whitespace, convert to string)
        const normalizedValue = String(insertData.type_reservation).trim().toLowerCase();
        if (normalizedValue === 'heures' || normalizedValue === 'jours') {
          insertData.type_reservation = normalizedValue;
        } else {
          console.warn('[Security] Invalid type_reservation value, removing it:', insertData.type_reservation);
          delete insertData.type_reservation;
        }
      }
      
      console.log('[Security] Submitting reservation:', insertData);
      console.log('[Security] type_reservation final value:', insertData.type_reservation);

      // First, try to insert with all fields
      let { data, error } = await supabase
        .from('reserve_security')
        .insert(insertData)
        .select();

      // If error is about unknown columns, try again with only basic fields
      if (error && (error.message?.includes('column') && error.message?.includes('does not exist'))) {
        console.warn('[Security] Columns do not exist, trying with basic fields only');
        
        // Create basic insert data without optional columns
        const basicInsertData = {
          user_id: userId || null,
          security_id: null,
          firstname: userInfo.firstname || userInfo.name || 'User',
          phone: reservationForm.phone.trim(),
          location: location,
          email: userInfo.email || null,
          message: `Reservation for role_id: ${reservationForm.role_id}, Type: ${reservationForm.type_reservation}. ${reservationForm.type_reservation === 'heures' 
            ? `Date: ${dateReservation}, Heure début: ${heureDebut || 'N/A'}, Nombre d'heures: ${reservationForm.nombre_heures || 'N/A'}`
            : `Date début: ${dateDebut || 'N/A'}, Date fin: ${dateFin || 'N/A'}`}`,
          total_price: totalPrice || 0,
          status: 'pending',
          preferred_date: preferredDate,
          admin_notes: `Type: ${reservationForm.type_reservation}, ${reservationForm.type_reservation === 'heures' 
            ? `Date: ${dateReservation}, Heure début: ${heureDebut || 'N/A'}, Nombre d'heures: ${reservationForm.nombre_heures || 'N/A'}`
            : `Date début: ${dateDebut || 'N/A'}, Date fin: ${dateFin || 'N/A'}`}`
        };
        
        console.log('[Security] Retrying with basic fields:', basicInsertData);
        
        const retryResult = await supabase
          .from('reserve_security')
          .insert(basicInsertData)
          .select();
        
        data = retryResult.data;
        error = retryResult.error;
        
        if (error) {
          console.error('[Security] Error with basic fields:', error);
        } else {
          console.log('[Security] Reservation saved with basic fields. Please run add-columns-to-reserve-security.sql to enable full features.');
          setToast({ 
            show: true, 
            text: 'Réservation enregistrée ! Note: Exécutez add-columns-to-reserve-security.sql pour activer toutes les fonctionnalités.' 
          });
          setTimeout(() => setToast({ show: false, text: '' }), 5000);
        }
      }

      if (error) {
        console.error('[Security] Error submitting reservation:', error);
        console.error('[Security] Error details:', JSON.stringify(error, null, 2));
        
        // Check if error is about unknown columns
        let errorMsg = error.message || 'Erreur lors de la réservation';
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          errorMsg = 'Erreur: Certaines colonnes n\'existent pas dans la table. Veuillez exécuter le script SQL add-columns-to-reserve-security.sql dans Supabase SQL Editor.';
        } else if (error.message?.includes('null value') || error.message?.includes('NOT NULL')) {
          errorMsg = 'Erreur: Certains champs requis sont manquants. Veuillez remplir tous les champs obligatoires.';
        }
        
        setToast({ show: true, text: errorMsg });
        setTimeout(() => setToast({ show: false, text: '' }), 5000);
        setReservationLoading(false);
        return;
      }

      console.log('[Security] Reservation submitted successfully:', data);
      setShowReservationForm(false);
      setReservationLoading(false);
      setReservationSuccess(true);
    } catch (err) {
      console.error('[Security] Exception during reservation:', err);
      setToast({ show: true, text: t('security_page.reservation_error') + ': ' + err.message });
      setTimeout(() => setToast({ show: false, text: '' }), 3000);
      setReservationLoading(false);
    }
  }, [reservationLoading, reservationForm, t]);

  // Debug: Log current state on every render
  console.log('[Security] Render state:', { 
    loading, 
    rolesCount: roles.length, 
    selectedRole, 
    error: !!error,
    hasRoles: roles.length > 0
  });

  return (
    <div className="shop-page">
      {/* Success Card */}
      {reservationSuccess && (
        <div className="reservation-success-card">
          <div className="reservation-success-content">
            <div className="reservation-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22,4 12,14.01 9,11.01"/>
              </svg>
            </div>
            <h2 className="reservation-success-title">
              {i18n.language === 'ar' ? 'تم تأكيد الحجز !' : 
               i18n.language === 'fr' ? 'Réservation confirmée !' : 
               'Reservation Confirmed!'}
            </h2>
            <p className="reservation-success-message">
              {i18n.language === 'ar' ? 'سنتصل بكم في أقرب وقت.' : 
               i18n.language === 'fr' ? 'Nous vous contacterons dans les plus brefs délais.' : 
               'We will contact you as soon as possible.'}
            </p>
            <button 
              className="reservation-success-button"
              onClick={() => {
                setReservationSuccess(false);
                navigate('/');
              }}
            >
              {i18n.language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 
               i18n.language === 'fr' ? 'Retour à l\'accueil' : 
               'Back to Home'}
            </button>
          </div>
        </div>
      )}

      {toast.show && (
        <div style={{
          position: 'fixed',
          top: 16,
          right: 16,
          background: 'linear-gradient(90deg,#22c55e,#16a34a)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 10px 20px rgba(0,0,0,0.12)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span style={{fontSize: 18}}>✓</span>
          <span style={{fontWeight: 600}}>{toast.text}</span>
        </div>
      )}
      <div className="shop-container">
        {/* Back Button Container */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 20px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <Link to="/tous-les-services" className="back-button">
            <span className="back-icon">←</span>
            {i18n.language === 'ar' ? 'العودة' : 
             i18n.language === 'fr' ? 'Retour' : 
             'Back'}
          </Link>
        </div>

        <header className="shop-header" style={{marginBottom: 24}}>
          <div className="shop-header-content">
            <h1 className="shop-title" data-aos="fade-up" data-aos-delay="100">
              {i18n.language === 'ar' ? 'فريق الأمن' : t('security_page.title')}
            </h1>
            <p className="shop-description" data-aos="fade-up" data-aos-delay="200">
              {t('security_page.subtitle')}
            </p>
          </div>
        </header>

        {error && (
          <div style={{color: 'red', textAlign: 'center', margin: '20px 0', padding: '12px', background: '#fee2e2', borderRadius: '8px'}}>
            {error}
          </div>
        )}

        {/* Loading state - only show when loading and no roles yet */}
        {loading && roles.length === 0 && !error && (
          <div style={{textAlign: 'center', margin: '40px 0'}}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '16px'
            }}></div>
            <p style={{color: '#64748b', fontSize: '0.95rem'}}>{t('security_page.loading')}</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Empty state - no roles and not loading */}
        {!loading && !selectedRole && roles.length === 0 && !error && (
          <div style={{textAlign: 'center', margin: '40px 0', color: '#64748b'}}>
            <p>{t('security_page.no_roles_available') || 'No security roles available'}</p>
          </div>
        )}

        {/* Roles list - show when we have roles and no role is selected */}
        {!selectedRole && roles.length > 0 && (
          <div 
            className="security-grid" 
            data-aos="fade-up" 
            data-aos-delay="300" 
            key={`roles-grid-${roles.length}`}
            style={{ 
              display: 'grid',
              visibility: 'visible',
              opacity: 1
            }}
          >
            {roles.map((role, idx) => {
              if (!role || !role.id) {
                console.warn('[Security] Invalid role at index:', idx, role);
                return null;
              }
              // Helper function to get image URL from role
              const getRoleImageUrl = (imagePath) => {
                if (!imagePath) {
                  console.log('[Security] No image path provided for role:', role.name);
                  return null;
                }
                
                console.log('[Security] Processing image path for role:', role.name, 'Path:', imagePath);
                
                // If it's already a full URL, return it
                if (imagePath.includes('http') || imagePath.includes('supabase.co/storage')) {
                  console.log('[Security] Image is already a full URL:', imagePath);
                  return imagePath;
                }
                
                // If it's an old Laravel path, extract filename and try to get from Supabase
                if (imagePath.includes('127.0.0.1:8000') || imagePath.includes('localhost:8000') || imagePath.startsWith('/storage/') || imagePath.startsWith('/images/')) {
                  const filename = imagePath.split('/').pop();
                  if (filename) {
                    console.log('[Security] Extracting filename from Laravel path:', filename);
                    const { data: { publicUrl } } = supabase.storage
                      .from('employees')
                      .getPublicUrl(filename);
                    console.log('[Security] Generated Supabase URL:', publicUrl);
                    return publicUrl;
                  }
                  return null;
                }
                
                // If it's just a filename, try to get from Supabase Storage
                if (!imagePath.includes('/') && !imagePath.includes('http')) {
                  console.log('[Security] Treating as filename, getting from Supabase:', imagePath);
                  const { data: { publicUrl } } = supabase.storage
                    .from('employees')
                    .getPublicUrl(imagePath);
                  console.log('[Security] Generated Supabase URL:', publicUrl);
                  return publicUrl;
                }
                
                console.log('[Security] Returning image path as-is:', imagePath);
                return imagePath;
              };

              // Try multiple possible image field names
              const imagePath = role.image || role.image_url || role.photo || role.photo_url || null;
              const roleImageUrl = imagePath ? getRoleImageUrl(imagePath) : null;
              
              // Debug: Log role data to see what fields are available
              if (!roleImageUrl) {
                console.log('[Security] No image URL found for role:', role.name, 'Available fields:', Object.keys(role));
                console.log('[Security] Role data:', role);
              }

              return (
                <article 
                  key={role.id || `role-${idx}`}
                  className="security-card role-card" 
                  style={{
                    animationDelay: `${0.1 + idx * 0.1}s`,
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    navigate(`/security/role/${role.id}`);
                  }}
                >
                  <div className="security-card-content">
                    {/* Image du rôle */}
                    <div className="security-card-image-container">
                      {roleImageUrl ? (
                        <img 
                          src={roleImageUrl} 
                          alt={role.name || 'Role image'}
                          className="security-card-image"
                          onError={(e) => {
                            console.error('[Security] Image failed to load:', roleImageUrl);
                            e.target.style.display = 'none';
                            // Show placeholder icon
                            const container = e.target.parentElement;
                            if (container && !container.querySelector('.image-placeholder')) {
                              const placeholder = document.createElement('div');
                              placeholder.className = 'image-placeholder';
                              placeholder.innerHTML = '🔒';
                              placeholder.style.cssText = 'font-size: 3rem; color: #94a3b8; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;';
                              container.appendChild(placeholder);
                            }
                          }}
                          onLoad={(e) => {
                            e.target.style.opacity = '1';
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                        />
                      ) : (
                        <div className="image-placeholder" style={{fontSize: '3rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%'}}>
                          🔒
                        </div>
                      )}
                    </div>
                    <h3 className="security-name">
                      {role.name || getTranslatedRole(role.name) || t('security_page.role_not_available')}
                    </h3>
                    <p className="security-desc">
                      {role.description || getTranslatedRoleDescription(role.name) || t('security_page.description_not_available')}
                    </p>
                    <button 
                      className="security-card-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/security/role/${role.id}`);
                      }}
                    >
                      {t('security_page.click_to_see_agents')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal de réservation - Supprimé car maintenant dans SecurityRoleDetails */}
    </div>
  );
}
