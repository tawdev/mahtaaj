import React, { useState, useEffect } from 'react';
import { 
  getContacts, 
  getServicesAdmin, 
  getReservationsAdmin, 
  getRatingsAdmin,
  getProductsAdmin,
  getEmployeesAdmin,
  getConfirmedEmployeesAdmin,
  getPromotionsAdmin,
  getSecuritiesAdmin,
  getSecurityReservationsAdmin,
  getOrdersAdmin,
  getAdmins
} from '../../api-supabase';
import { supabase } from '../../lib/supabase';
import ProductStats from './ProductStats';
import HandWorkerStats from '../../components/HandWorkerStats';
import './DashboardStats.css';

export default function DashboardStats({ token, onAuthError, onCardClick, role }) {
  const [showHandWorkerStats, setShowHandWorkerStats] = useState(false);
  const [stats, setStats] = useState({
    contacts: { total: 0, thisMonth: 0, thisWeek: 0 },
    services: { total: 0, active: 0, inactive: 0 },
    reservations: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    revenue: { total: 0, thisMonth: 0, thisWeek: 0 },
    ratings: { total: 0, average: 0, thisMonth: 0, thisWeek: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    products: { total: 0, inStock: 0, outOfStock: 0 },
    productTypes: { total: 0, active: 0, inactive: 0 },
    employees: { total: 0, pending: 0, validated: 0 },
    confirmedEmployees: { total: 0 },
    promotions: { total: 0, active: 0, inactive: 0 },
    securities: { total: 0, active: 0, inactive: 0 },
    securityReservations: { total: 0, pending: 0, confirmed: 0, completed: 0 },
    orders: { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 },
    admins: { total: 0, active: 0, inactive: 0, roles: {} },
    handWorkerCategories: { total: 0, active: 0, inactive: 0 },
    handWorkers: { total: 0, available: 0, busy: 0, unavailable: 0 },
    handWorkerReservations: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    handWorkerRevenue: { total: 0, thisMonth: 0, thisWeek: 0 },
    handWorkerRegistrations: { total: 0, pending: 0, approved: 0, rejected: 0 },
    handWorkerEmployees: { total: 0, pending: 0, approved: 0, rejected: 0 },
    valideHandWorkerReservations: { total: 0 },
    galleryTypes: { total: 0, active: 0, inactive: 0 },
    galleryCategories: { total: 0, active: 0, inactive: 0 },
    galleryImages: { total: 0, active: 0, inactive: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = role === 'admin';
  const hasRole = (r) => isAdmin || role === r;

  useEffect(() => {
    loadStats();
  }, [token]);

  const handleCardClick = (cardType) => {
    if (cardType === 'hand-worker-stats') {
      setShowHandWorkerStats(true);
    } else {
      onCardClick && onCardClick(cardType);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Créer un tableau de promesses basé sur les permissions de l'utilisateur
      const promises = [];
      const promiseIndexes = {
        contacts: -1,
        services: -1,
        reservations: -1,
        ratings: -1,
        products: -1,
        employees: -1,
        confirmedEmployees: -1,
        promotions: -1,
        productTypes: -1,
        securities: -1,
        securityReservations: -1,
        orders: -1,
        admins: -1,
        handWorkerCategories: -1,
        handWorkers: -1,
        handWorkerReservations: -1,
        handWorkerRegistrations: -1,
        valideHandWorkerReservations: -1,
        galleryTypes: -1,
        galleryCategories: -1,
        galleryImages: -1
      };

      // Contacts (pour les non-admin)
      if (!isAdmin) {
        promiseIndexes.contacts = promises.length;
        promises.push(getContacts().catch(err => {
          console.warn('Error loading contacts:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Services (adminHouseKeeping)
      if (hasRole('adminHouseKeeping')) {
        promiseIndexes.services = promises.length;
        promises.push(getServicesAdmin(token).catch(err => {
          console.warn('Error loading services:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Reservations (admin)
      if (isAdmin) {
        promiseIndexes.reservations = promises.length;
        promises.push(getReservationsAdmin(token).catch(err => {
          console.warn('Error loading reservations:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Ratings (non-admin)
      if (!isAdmin) {
        promiseIndexes.ratings = promises.length;
        promises.push(getRatingsAdmin(token).catch(err => {
          console.warn('Error loading ratings:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Products (admin)
      if (isAdmin) {
        promiseIndexes.products = promises.length;
        promises.push(getProductsAdmin(token).catch(err => {
          console.warn('Error loading products:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Employees (admin)
      if (isAdmin) {
        promiseIndexes.employees = promises.length;
        promises.push(getEmployeesAdmin(token).catch(err => {
          console.warn('Error loading employees:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Confirmed Employees (admin)
      if (isAdmin) {
        promiseIndexes.confirmedEmployees = promises.length;
        promises.push(getConfirmedEmployeesAdmin(token).catch(err => {
          console.warn('Error loading confirmed employees:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Promotions (admin)
      if (isAdmin) {
        promiseIndexes.promotions = promises.length;
        promises.push(getPromotionsAdmin(token).catch(err => {
          console.warn('Error loading promotions:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Product types (admin)
      if (isAdmin) {
        promiseIndexes.productTypes = promises.length;
        promises.push((async () => {
          try {
            const { data, error } = await supabase
              .from('product_types')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) {
              console.warn('Error loading product types:', error);
              return { success: false, data: [] };
            }
            return { success: true, data: data || [] };
          } catch (err) {
            console.warn('Error loading product types:', err);
            return { success: false, data: [] };
          }
        })());
      } else {
        promises.push(Promise.resolve({ success: false, data: [] }));
      }

      // Securities (adminSecurity)
      if (hasRole('adminSecurity')) {
        promiseIndexes.securities = promises.length;
        promises.push(getSecuritiesAdmin(token).catch(err => {
          console.warn('Error loading securities:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Security Reservations (adminSecurity)
      if (hasRole('adminSecurity')) {
        promiseIndexes.securityReservations = promises.length;
        promises.push(getSecurityReservationsAdmin(token).catch(err => {
          console.warn('Error loading security reservations:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Orders (admin)
      if (isAdmin) {
        promiseIndexes.orders = promises.length;
        promises.push(getOrdersAdmin(token).catch(err => {
          console.warn('Error loading orders:', err);
          return { data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      // Admins (admin only)
      if (isAdmin) {
        promiseIndexes.admins = promises.length;
        promises.push(getAdmins(token).catch(err => {
          console.warn('Error loading admins:', err);
          return { success: false, data: [] };
        }));
      } else {
        promises.push(Promise.resolve({ success: false, data: [] }));
      }

      // Hand Worker APIs (adminHandWorker or admin)
      if (isAdmin || hasRole('adminHandWorker')) {
        promiseIndexes.handWorkerCategories = promises.length;
        promises.push((async () => {
          try {
            const { data, error } = await supabase
              .from('hand_worker_categories')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) {
              console.warn('Error loading hand worker categories:', error);
            return { success: false, data: [] };
          }
            return { success: true, data: data || [] };
          } catch (err) {
          console.warn('Error loading hand worker categories:', err);
          return { success: false, data: [] };
          }
        })());

        promiseIndexes.handWorkers = promises.length;
        promises.push((async () => {
          try {
            const { data, error } = await supabase
              .from('hand_workers')
              .select('*')
              .order('created_at', { ascending: false });
            if (error) {
              console.warn('Error loading hand workers:', error);
            return { success: false, data: [] };
          }
            return { success: true, data: data || [] };
          } catch (err) {
          console.warn('Error loading hand workers:', err);
          return { success: false, data: [] };
          }
        })());

        promiseIndexes.handWorkerReservations = promises.length;
        // TODO: إنشاء جدول hand_worker_reservations في Supabase
        promises.push(Promise.resolve({ success: false, data: [] }));

        promiseIndexes.handWorkerRegistrations = promises.length;
        // TODO: إنشاء جدول hand_worker_registrations في Supabase
        promises.push(Promise.resolve({ success: false, data: [] }));

        promiseIndexes.valideHandWorkerReservations = promises.length;
        // TODO: إنشاء جدول valide_hand_worker_reservations في Supabase
        promises.push(Promise.resolve({ success: false, data: [] }));
      } else {
        promises.push(Promise.resolve({ success: false, data: [] }));
        promises.push(Promise.resolve({ success: false, data: [] }));
        promises.push(Promise.resolve({ success: false, data: [] }));
        promises.push(Promise.resolve({ success: false, data: [] }));
        promises.push(Promise.resolve({ success: false, data: [] }));
      }

      // Gallery APIs (tous les admins)
      promiseIndexes.galleryTypes = promises.length;
      promises.push((async () => {
        try {
          const { data, error } = await supabase
            .from('type_category_gallery')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn('Error loading gallery types:', error);
          return { success: false, data: [] };
        }
          return { success: true, data: data || [] };
        } catch (err) {
        console.warn('Error loading gallery types:', err);
        return { success: false, data: [] };
        }
      })());

      promiseIndexes.galleryCategories = promises.length;
      promises.push((async () => {
        try {
          const { data, error } = await supabase
            .from('category_gallery')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn('Error loading gallery categories:', error);
          return { success: false, data: [] };
        }
          return { success: true, data: data || [] };
        } catch (err) {
        console.warn('Error loading gallery categories:', err);
        return { success: false, data: [] };
        }
      })());

      promiseIndexes.galleryImages = promises.length;
      promises.push((async () => {
        try {
          const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) {
            console.warn('Error loading gallery images:', error);
          return { success: false, data: [] };
        }
          return { success: true, data: data || [] };
        } catch (err) {
        console.warn('Error loading gallery images:', err);
        return { success: false, data: [] };
        }
      })());

      // Exécuter toutes les promesses
      const results = await Promise.allSettled(promises);
      
      // Extraire les données en utilisant les index
      const getResult = (index) => {
        if (index === -1) return { value: { data: [] } };
        return results[index] || { value: { data: [] } };
      };

      // Extraire les données des réponses avec gestion d'erreur
      const contactsDataResult = getResult(promiseIndexes.contacts);
      const servicesDataResult = getResult(promiseIndexes.services);
      const reservationsDataResult = getResult(promiseIndexes.reservations);
      const ratingsDataResult = getResult(promiseIndexes.ratings);
      const productsDataResult = getResult(promiseIndexes.products);
      const employeesDataResult = getResult(promiseIndexes.employees);
      const confirmedEmployeesDataResult = getResult(promiseIndexes.confirmedEmployees);
      const promotionsDataResult = getResult(promiseIndexes.promotions);
      const productTypesDataResult = getResult(promiseIndexes.productTypes);
      const securitiesDataResult = getResult(promiseIndexes.securities);
      const securityReservationsDataResult = getResult(promiseIndexes.securityReservations);
      const ordersDataResult = getResult(promiseIndexes.orders);
      const adminsDataResult = getResult(promiseIndexes.admins);
      const handWorkerCategoriesDataResult = getResult(promiseIndexes.handWorkerCategories);
      const handWorkersDataResult = getResult(promiseIndexes.handWorkers);
      const handWorkerReservationsDataResult = getResult(promiseIndexes.handWorkerReservations);
      const handWorkerRegistrationsDataResult = getResult(promiseIndexes.handWorkerRegistrations);
      const valideHandWorkerReservationsDataResult = getResult(promiseIndexes.valideHandWorkerReservations);
      const galleryTypesDataResult = getResult(promiseIndexes.galleryTypes);
      const galleryCategoriesDataResult = getResult(promiseIndexes.galleryCategories);
      const galleryImagesDataResult = getResult(promiseIndexes.galleryImages);

      const contacts = Array.isArray(contactsDataResult.value) ? contactsDataResult.value : (contactsDataResult.value?.data || []);
      const services = Array.isArray(servicesDataResult.value) ? servicesDataResult.value : (servicesDataResult.value?.data || []);
      const reservations = Array.isArray(reservationsDataResult.value) ? reservationsDataResult.value : (reservationsDataResult.value?.data || []);
      const ratings = Array.isArray(ratingsDataResult.value) ? ratingsDataResult.value : (ratingsDataResult.value?.data || []);
      const products = Array.isArray(productsDataResult.value) ? productsDataResult.value : (productsDataResult.value?.data || []);
      const employees = Array.isArray(employeesDataResult.value) ? employeesDataResult.value : (employeesDataResult.value?.data || []);
      const confirmedEmployees = Array.isArray(confirmedEmployeesDataResult.value) ? confirmedEmployeesDataResult.value : (confirmedEmployeesDataResult.value?.data || []);
      const promotions = Array.isArray(promotionsDataResult.value) ? promotionsDataResult.value : (promotionsDataResult.value?.data || []);
      const securities = Array.isArray(securitiesDataResult.value) ? securitiesDataResult.value : (securitiesDataResult.value?.data || []);
      const securityReservations = Array.isArray(securityReservationsDataResult.value) ? securityReservationsDataResult.value : (securityReservationsDataResult.value?.data || []);
      const orders = Array.isArray(ordersDataResult.value) ? ordersDataResult.value : (ordersDataResult.value?.data || []);

      // S'assurer que toutes les variables sont des tableaux
      const safeContacts = Array.isArray(contacts) ? contacts : [];
      const safeServices = Array.isArray(services) ? services : [];
      const safeReservations = Array.isArray(reservations) ? reservations : [];
      const safeRatings = Array.isArray(ratings) ? ratings : [];
      const safeProducts = Array.isArray(products) ? products : [];
      const safeEmployees = Array.isArray(employees) ? employees : [];
      const safeConfirmedEmployees = Array.isArray(confirmedEmployees) ? confirmedEmployees : [];
      const safePromotions = Array.isArray(promotions) ? promotions : [];
      const productTypesResponse = productTypesDataResult.value;
      const productTypes = productTypesResponse?.success ? productTypesResponse.data : (Array.isArray(productTypesResponse) ? productTypesResponse : productTypesResponse?.data);
      const safeProductTypes = Array.isArray(productTypes) ? productTypes : [];
      const safeSecurities = Array.isArray(securities) ? securities : [];
      const safeSecurityReservations = Array.isArray(securityReservations) ? securityReservations : [];
      const safeOrders = Array.isArray(orders) ? orders : [];
      
      // Handle admins data - it might come as {success: true, data: [...]} or directly as array
      const adminsResponse = adminsDataResult.value;
      let adminsList = [];
      if (adminsResponse?.success && Array.isArray(adminsResponse.data)) {
        adminsList = adminsResponse.data;
      } else if (Array.isArray(adminsResponse)) {
        adminsList = adminsResponse;
      } else if (Array.isArray(adminsResponse?.data)) {
        adminsList = adminsResponse.data;
      }
      const safeAdmins = Array.isArray(adminsList) ? adminsList : [];
      
      // Hand Worker data extraction
      const handWorkerCategories = handWorkerCategoriesDataResult.value?.success ? handWorkerCategoriesDataResult.value.data : [];
      const handWorkers = handWorkersDataResult.value?.success ? handWorkersDataResult.value.data : [];
      const handWorkerReservations = handWorkerReservationsDataResult.value?.success ? handWorkerReservationsDataResult.value.data : [];
      const handWorkerRegistrations = handWorkerRegistrationsDataResult.value?.success ? handWorkerRegistrationsDataResult.value.data : [];
      // handWorkerEmployees uses the same data as handWorkerRegistrations (they are the employee registrations)
      const handWorkerEmployees = handWorkerRegistrations;
      const valideHandWorkerReservations = valideHandWorkerReservationsDataResult.value?.success ? valideHandWorkerReservationsDataResult.value.data : [];
      
      const safeHandWorkerCategories = Array.isArray(handWorkerCategories) ? handWorkerCategories : [];
      const safeHandWorkers = Array.isArray(handWorkers) ? handWorkers : [];
      const safeHandWorkerReservations = Array.isArray(handWorkerReservations) ? handWorkerReservations : [];
      const safeHandWorkerRegistrations = Array.isArray(handWorkerRegistrations) ? handWorkerRegistrations : [];
      const safeHandWorkerEmployees = Array.isArray(handWorkerEmployees) ? handWorkerEmployees : [];
      const safeValideHandWorkerReservations = Array.isArray(valideHandWorkerReservations) ? valideHandWorkerReservations : [];
      
      // Gallery data extraction
      const galleryTypes = galleryTypesDataResult.value?.success ? galleryTypesDataResult.value.data : [];
      const galleryCategories = galleryCategoriesDataResult.value?.success ? galleryCategoriesDataResult.value.data : [];
      const galleryImages = galleryImagesDataResult.value?.success ? galleryImagesDataResult.value.data : [];
      
      const safeGalleryTypes = Array.isArray(galleryTypes) ? galleryTypes : [];
      const safeGalleryCategories = Array.isArray(galleryCategories) ? galleryCategories : [];
      const safeGalleryImages = Array.isArray(galleryImages) ? galleryImages : [];

      // Calculer les dates
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Calculer les statistiques des contacts
      const contactsThisMonth = safeContacts.filter(c => new Date(c.created_at) >= thisMonth).length;
      const contactsThisWeek = safeContacts.filter(c => new Date(c.created_at) >= thisWeek).length;

      // Calculer les statistiques des services
      const activeServices = safeServices.filter(s => s.is_active).length;
      const inactiveServices = safeServices.filter(s => !s.is_active).length;

      // Calculer les statistiques des réservations
      const pendingReservations = safeReservations.filter(r => r.status === 'pending').length;
      const confirmedReservations = safeReservations.filter(r => r.status === 'confirmed').length;
      const completedReservations = safeReservations.filter(r => r.status === 'completed').length;
      const cancelledReservations = safeReservations.filter(r => r.status === 'cancelled').length;

      // Calculer le chiffre d'affaires
      const reservationsWithPrice = safeReservations.filter(r => r.total_price && r.total_price > 0);
      const totalRevenue = reservationsWithPrice.reduce((sum, r) => sum + parseFloat(r.total_price), 0);
      
      const revenueThisMonth = reservationsWithPrice
        .filter(r => new Date(r.created_at) >= thisMonth)
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0);
      
      const revenueThisWeek = reservationsWithPrice
        .filter(r => new Date(r.created_at) >= thisWeek)
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0);

      // Calculer les statistiques des évaluations
      const ratingsThisMonth = safeRatings.filter(r => new Date(r.created_at) >= thisMonth).length;
      const ratingsThisWeek = safeRatings.filter(r => new Date(r.created_at) >= thisWeek).length;
      
      const averageRating = safeRatings.length > 0 
        ? safeRatings.reduce((sum, r) => sum + r.rating, 0) / safeRatings.length 
        : 0;
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      safeRatings.forEach(rating => {
        if (ratingDistribution.hasOwnProperty(rating.rating)) {
          ratingDistribution[rating.rating]++;
        }
      });

      // Calculer les statistiques des produits
      const inStockProducts = safeProducts.filter(p => p.in_stock).length;
      const outOfStockProducts = safeProducts.filter(p => !p.in_stock).length;

      // Calculer les statistiques des employés
      const pendingEmployees = safeEmployees.filter(e => e.status === 'pending').length;
      // Les employés validés sont ceux avec status 'accepted' ou (status 'active' et is_active === true)
      const validatedEmployees = safeEmployees.filter(e => {
        return e.status === 'accepted' || (e.status === 'active' && e.is_active === true);
      }).length;

      // Calculer les statistiques des promotions
      const activePromotions = safePromotions.filter(p => p.is_active).length;
      const inactivePromotions = safePromotions.filter(p => !p.is_active).length;

      // Product type stats
      const activeProductTypes = safeProductTypes.filter(t => t.is_active).length;
      const inactiveProductTypes = safeProductTypes.filter(t => !t.is_active).length;

      // Calculer les statistiques de sécurité
      const activeSecurities = safeSecurities.filter(s => s.is_active).length;
      const inactiveSecurities = safeSecurities.filter(s => !s.is_active).length;

      // Calculer les statistiques des réservations de sécurité
      const pendingSecurityReservations = safeSecurityReservations.filter(r => r.status === 'pending').length;
      const confirmedSecurityReservations = safeSecurityReservations.filter(r => r.status === 'confirmed').length;
      const completedSecurityReservations = safeSecurityReservations.filter(r => r.status === 'completed').length;

      // Calculer les statistiques des commandes
      const pendingOrders = safeOrders.filter(o => o.status === 'pending').length;
      const processingOrders = safeOrders.filter(o => o.status === 'processing').length;
      const completedOrders = safeOrders.filter(o => o.status === 'completed').length;
      const cancelledOrders = safeOrders.filter(o => o.status === 'cancelled').length;

      // Calculer les statistiques des administrateurs
      const activeAdmins = safeAdmins.filter(a => a.is_active).length;
      const inactiveAdmins = safeAdmins.filter(a => !a.is_active).length;
      
      // Calculer إحصائيات الأدوار
      const rolesStats = {
        admin: 0,
        adminBebe: 0,
        adminJardinaje: 0,
        adminHouseKeeping: 0,
        adminSecurity: 0,
        adminHandWorker: 0
      };
      
      safeAdmins.forEach(admin => {
        if (admin.role && rolesStats.hasOwnProperty(admin.role)) {
          rolesStats[admin.role]++;
        }
      });

      // Calculer les statistiques des travaux manuels
      const activeHandWorkerCategories = safeHandWorkerCategories.filter(c => c.is_active).length;
      const inactiveHandWorkerCategories = safeHandWorkerCategories.filter(c => !c.is_active).length;
      
      const availableHandWorkers = safeHandWorkers.filter(w => w.status === 'available').length;
      const busyHandWorkers = safeHandWorkers.filter(w => w.status === 'busy').length;
      const unavailableHandWorkers = safeHandWorkers.filter(w => w.status === 'unavailable').length;
      
      const pendingHandWorkerReservations = safeHandWorkerReservations.filter(r => r.status === 'pending').length;
      const confirmedHandWorkerReservations = safeHandWorkerReservations.filter(r => r.status === 'confirmed').length;
      const completedHandWorkerReservations = safeHandWorkerReservations.filter(r => r.status === 'completed').length;
      const cancelledHandWorkerReservations = safeHandWorkerReservations.filter(r => r.status === 'cancelled').length;
      
      // Calculer le chiffre d'affaires des travaux manuels
      const handWorkerReservationsWithPrice = safeHandWorkerReservations.filter(r => r.total_price && r.total_price > 0);
      const totalHandWorkerRevenue = handWorkerReservationsWithPrice.reduce((sum, r) => sum + parseFloat(r.total_price), 0);
      
      const handWorkerRevenueThisMonth = handWorkerReservationsWithPrice
        .filter(r => new Date(r.created_at) >= thisMonth)
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0);
      
      const handWorkerRevenueThisWeek = handWorkerReservationsWithPrice
        .filter(r => new Date(r.created_at) >= thisWeek)
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0);

      // Calculer les statistiques des inscriptions de travailleurs manuels
      const pendingHandWorkerRegistrations = safeHandWorkerRegistrations.filter(r => r.status === 'pending').length;
      const approvedHandWorkerRegistrations = safeHandWorkerRegistrations.filter(r => r.status === 'approved').length;
      const rejectedHandWorkerRegistrations = safeHandWorkerRegistrations.filter(r => r.status === 'rejected').length;
      
      // Calculer les statistiques des employés travaux manuels (hand_worker_registrations)
      const pendingHandWorkerEmployees = safeHandWorkerEmployees.filter(r => r.status === 'pending').length;
      const approvedHandWorkerEmployees = safeHandWorkerEmployees.filter(r => r.status === 'approved').length;
      const rejectedHandWorkerEmployees = safeHandWorkerEmployees.filter(r => r.status === 'rejected').length;

      // Calculate Gallery statistics
      const activeGalleryTypes = safeGalleryTypes.filter(t => t.is_active).length;
      const inactiveGalleryTypes = safeGalleryTypes.filter(t => !t.is_active).length;
      
      const activeGalleryCategories = safeGalleryCategories.filter(c => c.is_active).length;
      const inactiveGalleryCategories = safeGalleryCategories.filter(c => !c.is_active).length;
      
      const activeGalleryImages = safeGalleryImages.filter(img => img.is_active).length;
      const inactiveGalleryImages = safeGalleryImages.filter(img => !img.is_active).length;

      setStats({
        contacts: {
          total: safeContacts.length,
          thisMonth: contactsThisMonth,
          thisWeek: contactsThisWeek
        },
        services: {
          total: safeServices.length,
          active: activeServices,
          inactive: inactiveServices
        },
        reservations: {
          total: safeReservations.length,
          pending: pendingReservations,
          confirmed: confirmedReservations,
          completed: completedReservations,
          cancelled: cancelledReservations
        },
        revenue: {
          total: totalRevenue,
          thisMonth: revenueThisMonth,
          thisWeek: revenueThisWeek
        },
        ratings: {
          total: safeRatings.length,
          average: averageRating,
          thisMonth: ratingsThisMonth,
          thisWeek: ratingsThisWeek,
          distribution: ratingDistribution
        },
        products: {
          total: safeProducts.length,
          inStock: inStockProducts,
          outOfStock: outOfStockProducts
        },
        productTypes: {
          total: safeProductTypes.length,
          active: activeProductTypes,
          inactive: inactiveProductTypes
        },
        employees: {
          total: safeEmployees.length,
          pending: pendingEmployees,
          validated: validatedEmployees
        },
        confirmedEmployees: {
          total: safeConfirmedEmployees.length
        },
        promotions: {
          total: safePromotions.length,
          active: activePromotions,
          inactive: inactivePromotions
        },
        securities: {
          total: safeSecurities.length,
          active: activeSecurities,
          inactive: inactiveSecurities
        },
        securityReservations: {
          total: safeSecurityReservations.length,
          pending: pendingSecurityReservations,
          confirmed: confirmedSecurityReservations,
          completed: completedSecurityReservations
        },
        orders: {
          total: safeOrders.length,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          cancelled: cancelledOrders
        },
        admins: {
          total: safeAdmins.length,
          active: activeAdmins,
          inactive: inactiveAdmins,
          roles: rolesStats
        },
        handWorkerCategories: {
          total: safeHandWorkerCategories.length,
          active: activeHandWorkerCategories,
          inactive: inactiveHandWorkerCategories
        },
        handWorkers: {
          total: safeHandWorkers.length,
          available: availableHandWorkers,
          busy: busyHandWorkers,
          unavailable: unavailableHandWorkers
        },
        handWorkerReservations: {
          total: safeHandWorkerReservations.length,
          pending: pendingHandWorkerReservations,
          confirmed: confirmedHandWorkerReservations,
          completed: completedHandWorkerReservations,
          cancelled: cancelledHandWorkerReservations
        },
        handWorkerRevenue: {
          total: totalHandWorkerRevenue,
          thisMonth: handWorkerRevenueThisMonth,
          thisWeek: handWorkerRevenueThisWeek
        },
        handWorkerRegistrations: {
          total: safeHandWorkerRegistrations.length,
          pending: pendingHandWorkerRegistrations,
          approved: approvedHandWorkerRegistrations,
          rejected: rejectedHandWorkerRegistrations
        },
        handWorkerEmployees: {
          total: safeHandWorkerEmployees.length,
          pending: pendingHandWorkerEmployees,
          approved: approvedHandWorkerEmployees,
          rejected: rejectedHandWorkerEmployees
        },
        valideHandWorkerReservations: {
          total: safeValideHandWorkerReservations.length
        },
        galleryTypes: {
          total: safeGalleryTypes.length,
          active: activeGalleryTypes,
          inactive: inactiveGalleryTypes
        },
        galleryCategories: {
          total: safeGalleryCategories.length,
          active: activeGalleryCategories,
          inactive: inactiveGalleryCategories
        },
        galleryImages: {
          total: safeGalleryImages.length,
          active: activeGalleryImages,
          inactive: inactiveGalleryImages
        }
      });
    } catch (e) {
      console.error('Error loading stats:', e);
      if (e.status === 401 || e.message?.includes('Unauthorized')) {
        onAuthError && onAuthError();
        return;
      }
      setError(`Impossible de charger les statistiques: ${e.message || 'Erreur de connexion'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-stats-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-stats-error">
        <p>{error}</p>
        <button onClick={loadStats} className="retry-button">Réessayer</button>
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      <div className="stats-header">
        <h2 className="stats-title">Statistiques du Site</h2>
        <button onClick={loadStats} className="refresh-button">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 21v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Actualiser
        </button>
      </div>

      <div className="stats-grid">
        {/* Contacts (hide for admin) */}
        {!isAdmin && (
        <div className="stat-card contacts-card clickable" onClick={() => onCardClick && onCardClick('contacts')}>
          <div className="stat-icon contacts-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Contacts</h3>
            <div className="stat-main-value">{stats.contacts.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Ce mois:</span>
                <span className="stat-value">{stats.contacts.thisMonth}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Cette semaine:</span>
                <span className="stat-value">{stats.contacts.thisWeek}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Services (adminHouseKeeping only) */}
        {hasRole('adminHouseKeeping') && (
        <div className="stat-card services-card clickable" onClick={() => onCardClick && onCardClick('services')}>
          <div className="stat-icon services-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Services</h3>
            <div className="stat-main-value">{stats.services.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actifs:</span>
                <span className="stat-value active">{stats.services.active}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactifs:</span>
                <span className="stat-value inactive">{stats.services.inactive}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Réservations (admin only) */}
        {isAdmin && (
        <div className="stat-card reservations-card clickable" onClick={() => onCardClick && onCardClick('reservations')}>
          <div className="stat-icon reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Réservations</h3>
            <div className="stat-main-value">{stats.reservations.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.reservations.pending}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Confirmées:</span>
                <span className="stat-value confirmed">{stats.reservations.confirmed}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Terminées:</span>
                <span className="stat-value completed">{stats.reservations.completed}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Annulées:</span>
                <span className="stat-value cancelled">{stats.reservations.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Évaluations (hide for admin) */}
        {!isAdmin && (
        <div className="stat-card ratings-card clickable" onClick={() => onCardClick && onCardClick('ratings')}>
          <div className="stat-icon ratings-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Évaluations</h3>
            <div className="stat-main-value">{stats.ratings.average.toFixed(1)} ⭐</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Total:</span>
                <span className="stat-value">{stats.ratings.total}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Ce mois:</span>
                <span className="stat-value">{stats.ratings.thisMonth}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Cette semaine:</span>
                <span className="stat-value">{stats.ratings.thisWeek}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">5 étoiles:</span>
                <span className="stat-value excellent">{stats.ratings.distribution[5]}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Produits (admin only) */}
        {isAdmin && (
        <div className="stat-card products-card clickable" onClick={() => onCardClick && onCardClick('products')}>
          <div className="stat-icon products-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.27 6.96L12 12.01L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Produits</h3>
            <div className="stat-main-value">{stats.products.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En stock:</span>
                <span className="stat-value active">{stats.products.inStock}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Rupture:</span>
                <span className="stat-value inactive">{stats.products.outOfStock}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {isAdmin && (
        <div className="stat-card product-types-card clickable" onClick={() => onCardClick && onCardClick('product-types')}>
          <div className="stat-icon product-types-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 7h8M8 12h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Types de produits</h3>
            <div className="stat-main-value">{stats.productTypes.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actifs:</span>
                <span className="stat-value active">{stats.productTypes.active}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactifs:</span>
                <span className="stat-value inactive">{stats.productTypes.inactive}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Statistiques des Produits (admin only) */}
        {isAdmin && (
        <div className="stat-card product-stats-card clickable" onClick={() => onCardClick && onCardClick('product_stats')}>
          <div className="stat-icon product-stats-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Statistiques Produits</h3>
            <div className="stat-main-value">📊</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Ventes & Graphiques</span>
                <span className="stat-value">Analytics</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Employés (admin only) */}
        {isAdmin && (
        <div className="stat-card employees-card clickable" onClick={() => onCardClick && onCardClick('employees')}>
          <div className="stat-icon employees-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Employés</h3>
            <div className="stat-main-value">{stats.employees.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.employees.pending}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Validés:</span>
                <span className="stat-value confirmed">{stats.employees.validated}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Employés Validés (admin only) */}
        {isAdmin && (
        <div className="stat-card confirmed-employees-card clickable" onClick={() => onCardClick && onCardClick('confirmed_employees')}>
          <div className="stat-icon confirmed-employees-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Validés</h3>
            <div className="stat-main-value">{stats.confirmedEmployees.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Employés confirmés</span>
                <span className="stat-value confirmed">{stats.confirmedEmployees.total}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Promotions (admin only) */}
        {isAdmin && (
        <div className="stat-card promotions-card clickable" onClick={() => onCardClick && onCardClick('promotions')}>
          <div className="stat-icon promotions-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Promotions</h3>
            <div className="stat-main-value">{stats.promotions.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actives:</span>
                <span className="stat-value active">{stats.promotions.active}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactives:</span>
                <span className="stat-value inactive">{stats.promotions.inactive}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Sécurité (adminSecurity only) */}
        {hasRole('adminSecurity') && (
        <div className="stat-card securities-card clickable" onClick={() => onCardClick && onCardClick('security')}>
          <div className="stat-icon securities-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Sécurité</h3>
            <div className="stat-main-value">{stats.securities.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actifs:</span>
                <span className="stat-value active">{stats.securities.active}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactifs:</span>
                <span className="stat-value inactive">{stats.securities.inactive}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Réservations Sécurité (adminSecurity only) */}
        {hasRole('adminSecurity') && (
        <div className="stat-card security-reservations-card clickable" onClick={() => onCardClick && onCardClick('security-reservations')}>
          <div className="stat-icon security-reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Réservations Sécurité</h3>
            <div className="stat-main-value">{stats.securityReservations.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.securityReservations.pending}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Confirmées:</span>
                <span className="stat-value confirmed">{stats.securityReservations.confirmed}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Terminées:</span>
                <span className="stat-value completed">{stats.securityReservations.completed}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Commandes (admin only) */}
        {isAdmin && (
        <div className="stat-card orders-card clickable" onClick={() => onCardClick && onCardClick('orders')}>
          <div className="stat-icon orders-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Commandes</h3>
            <div className="stat-main-value">{stats.orders.total}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.orders.pending}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">En cours:</span>
                <span className="stat-value processing">{stats.orders.processing}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Terminées:</span>
                <span className="stat-value completed">{stats.orders.completed}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Annulées:</span>
                <span className="stat-value cancelled">{stats.orders.cancelled}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Administrateurs (admin only) */}
        {isAdmin && (
        <div className="stat-card admins-card clickable" onClick={() => onCardClick && onCardClick('admins')}>
          <div className="stat-icon admins-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.41 22c0-3.87 3.85-7 8.59-7s8.59 3.13 8.59 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">👥 Gestion des Comptes</h3>
            <div className="stat-main-value">{stats.admins?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actifs:</span>
                <span className="stat-value active">{stats.admins?.active || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactifs:</span>
                <span className="stat-value inactive">{stats.admins?.inactive || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Chiffre d'affaires (admin only) */}
        {isAdmin && (
        <div className="stat-card revenue-card clickable" onClick={() => onCardClick && onCardClick('revenue')}>
          <div className="stat-icon revenue-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Chiffre d'Affaires</h3>
            <div className="stat-main-value">{stats.revenue.total.toFixed(2)} €</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Ce mois:</span>
                <span className="stat-value">{stats.revenue.thisMonth.toFixed(2)} €</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Cette semaine:</span>
                <span className="stat-value">{stats.revenue.thisWeek.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Bébé Setting Section (adminBebe only) */}
        {hasRole('adminBebe') && (
        <div className="stat-card bebe-categories-card clickable" onClick={() => onCardClick && onCardClick('bebe-categories')}>
          <div className="stat-icon bebe-categories-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="9" y1="9" x2="9.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="15" y1="9" x2="15.01" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🍼 Catégories Bébé</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des catégories</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminBebe') && (
        <div className="stat-card bebe-services-card clickable" onClick={() => onCardClick && onCardClick('bebe-services')}>
          <div className="stat-icon bebe-services-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🍼 Services Bébé</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des services</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminBebe') && (
        <div className="stat-card bebe-reservations-card clickable" onClick={() => onCardClick && onCardClick('bebe-reservations')}>
          <div className="stat-icon bebe-reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🍼 Réservations Bébé</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des réservations</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminBebe') && (
        <div className="stat-card bebe-ratings-card clickable" onClick={() => onCardClick && onCardClick('bebe-ratings')}>
          <div className="stat-icon bebe-ratings-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🍼 Avis Bébé</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des évaluations</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Jardinage Section (adminJardinaje only) */}
        {hasRole('adminJardinaje') && (
        <div className="stat-card jardinage-categories-card clickable" onClick={() => onCardClick && onCardClick('jardinage-categories')}>
          <div className="stat-icon jardinage-categories-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🌿 Catégories Jardinage</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des catégories</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminJardinaje') && (
        <div className="stat-card jardinage-services-card clickable" onClick={() => onCardClick && onCardClick('jardinage-services')}>
          <div className="stat-icon jardinage-services-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🌿 Services Jardinage</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des services</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminJardinaje') && (
        <div className="stat-card jardinage-reservations-card clickable" onClick={() => onCardClick && onCardClick('jardinage-reservations')}>
          <div className="stat-icon jardinage-reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🌿 Réservations Jardinage</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des réservations</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {hasRole('adminJardinaje') && (
        <div className="stat-card jardinage-ratings-card clickable" onClick={() => onCardClick && onCardClick('jardinage-ratings')}>
          <div className="stat-icon jardinage-ratings-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🌿 Avis Jardinage</h3>
            <div className="stat-main-value">-</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Gestion des évaluations</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Hand Workers Section (admin or adminHandWorker) */}
        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card hand-worker-categories-card clickable" onClick={() => onCardClick && onCardClick('hand-worker-categories')}>
          <div className="stat-icon hand-worker-categories-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🔨 Catégories Travaux Manuels</h3>
            <div className="stat-main-value">{stats.handWorkerCategories?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Actives:</span>
                <span className="stat-value active">{stats.handWorkerCategories?.active || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Inactives:</span>
                <span className="stat-value inactive">{stats.handWorkerCategories?.inactive || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card hand-workers-card clickable" onClick={() => onCardClick && onCardClick('hand-workers')}>
          <div className="stat-icon hand-workers-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">👷 Gestion Employés Travaux Manuels</h3>
            <div className="stat-main-value">{stats.handWorkerEmployees?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.handWorkerEmployees?.pending || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Approuvés:</span>
                <span className="stat-value confirmed">{stats.handWorkerEmployees?.approved || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Rejetés:</span>
                <span className="stat-value cancelled">{stats.handWorkerEmployees?.rejected || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card hand-worker-reservations-card clickable" onClick={() => onCardClick && onCardClick('hand-worker-reservations')}>
          <div className="stat-icon hand-worker-reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m0-7V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-6 0h6m-6 0v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">📋 Réservations Travaux Manuels</h3>
            <div className="stat-main-value">{stats.handWorkerReservations?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">En attente:</span>
                <span className="stat-value pending">{stats.handWorkerReservations?.pending || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Confirmées:</span>
                <span className="stat-value confirmed">{stats.handWorkerReservations?.confirmed || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Terminées:</span>
                <span className="stat-value completed">{stats.handWorkerReservations?.completed || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Annulées:</span>
                <span className="stat-value cancelled">{stats.handWorkerReservations?.cancelled || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Hand Worker Registrations (admin or adminHandWorker) */}
        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card hand-worker-registrations-card clickable" onClick={() => onCardClick && onCardClick('hand-worker-registrations')}>
          <div className="stat-icon hand-worker-registrations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">📝 تسجيلات عمال الحرف</h3>
            <div className="stat-main-value">{stats.handWorkerRegistrations?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">في الانتظار:</span>
                <span className="stat-value pending">{stats.handWorkerRegistrations?.pending || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">معتمدة:</span>
                <span className="stat-value confirmed">{stats.handWorkerRegistrations?.approved || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">مرفوضة:</span>
                <span className="stat-value cancelled">{stats.handWorkerRegistrations?.rejected || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Validated Hand Worker Reservations (admin or adminHandWorker) */}
        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card valide-hand-worker-reservations-card clickable" onClick={() => onCardClick && onCardClick('valide-hand-worker-reservations')}>
          <div className="stat-icon valide-hand-worker-reservations-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">✅ العمّال المعتمدون</h3>
            <div className="stat-main-value">{stats.valideHandWorkerReservations?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">إجمالي المعتمدين:</span>
                <span className="stat-value confirmed">{stats.valideHandWorkerReservations?.total || 0}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Statistiques Détaillées Travaux Manuels (admin or adminHandWorker) */}
        {(isAdmin || hasRole('adminHandWorker')) && (
        <div className="stat-card hand-worker-stats-card clickable" onClick={() => handleCardClick('hand-worker-stats')}>
          <div className="stat-icon hand-worker-stats-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">📊 Statistiques Travaux Manuels</h3>
            <div className="stat-main-value">{(stats.handWorkerRevenue?.total || 0).toFixed(2)} DH</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">Ce mois:</span>
                <span className="stat-value">{(stats.handWorkerRevenue?.thisMonth || 0).toFixed(2)} DH</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">Cette semaine:</span>
                <span className="stat-value">{(stats.handWorkerRevenue?.thisWeek || 0).toFixed(2)} DH</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Gallery Types */}
        <div className="stat-card gallery-types-card clickable" onClick={() => onCardClick && onCardClick('gallery-types')}>
          <div className="stat-icon gallery-types-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🖼️ أنواع المعرض</h3>
            <div className="stat-main-value">{stats.galleryTypes?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">نشط:</span>
                <span className="stat-value active">{stats.galleryTypes?.active || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">غير نشط:</span>
                <span className="stat-value inactive">{stats.galleryTypes?.inactive || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Categories */}
        <div className="stat-card gallery-categories-card clickable" onClick={() => onCardClick && onCardClick('gallery-categories')}>
          <div className="stat-icon gallery-categories-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">📁 تصنيفات المعرض</h3>
            <div className="stat-main-value">{stats.galleryCategories?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">نشط:</span>
                <span className="stat-value active">{stats.galleryCategories?.active || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">غير نشط:</span>
                <span className="stat-value inactive">{stats.galleryCategories?.inactive || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Images */}
        <div className="stat-card gallery-images-card clickable" onClick={() => onCardClick && onCardClick('gallery')}>
          <div className="stat-icon gallery-images-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 15-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <h3 className="stat-title">🖼️ صور المعرض</h3>
            <div className="stat-main-value">{stats.galleryImages?.total || 0}</div>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-label">نشط:</span>
                <span className="stat-value active">{stats.galleryImages?.active || 0}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-label">غير نشط:</span>
                <span className="stat-value inactive">{stats.galleryImages?.inactive || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage des statistiques détaillées des travaux manuels */}
      {showHandWorkerStats && (
        <div className="hand-worker-stats-modal">
          <div className="modal-header">
            <h2>Statistiques Détaillées - Travaux Manuels</h2>
            <button 
              className="close-modal-btn"
              onClick={() => setShowHandWorkerStats(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="modal-content">
            <HandWorkerStats />
          </div>
        </div>
      )}
    </div>
  );
}
