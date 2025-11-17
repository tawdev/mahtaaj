/**
 * Supabase API Client
 * This file replaces the Laravel API calls with Supabase client calls
 */

import { supabase } from './lib/supabase';

// Resolve current language from i18next/localStorage with fallback
const getCurrentLocale = () => {
  try {
    const lng = localStorage.getItem('i18nextLng');
    if (lng && ['fr','ar','en'].includes(lng)) return lng;
  } catch (_) {}
  return 'fr';
};

// Helper to get localized field name
const getLocalizedField = (obj, field, locale) => {
  const localeMap = { fr: 'fr', ar: 'ar', en: 'en' };
  const lang = localeMap[locale] || 'fr';
  return obj[`${field}_${lang}`] || obj[field] || obj[`${field}_fr`] || '';
};

// Global error handler
const handleApiError = (error) => {
  console.error('API Error:', error);
  if (error?.message?.includes('JWT')) {
    // Clear tokens and redirect to login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.dispatchEvent(new CustomEvent('adminAuthError'));
  }
  throw error;
};

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Admin Authentication
 */
export async function adminLogin(email, password) {
  try {
    // Note: For admin auth, you might want to use a custom auth table
    // or use Supabase Auth with custom claims. This is a simplified version.
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Invalid credentials');
    }

    // In production, use Supabase Auth or verify password hash
    // For now, this is a placeholder - you'll need to implement proper password verification
    // You might want to use Supabase Auth with custom user metadata instead

    // Create a session token (in production, use Supabase Auth)
    const token = btoa(JSON.stringify({ id: data.id, email: data.email }));
    
    return {
      message: 'Login successful',
      admin: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      },
      token: token,
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function adminLogout() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    return { message: 'Logout successful' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function adminProfile() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('Not authenticated');

    // Decode token and get admin data
    const adminData = JSON.parse(atob(token));
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', adminData.id)
      .single();

    if (error) throw error;

    return {
      admin: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      }
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * User Authentication (using Supabase Auth)
 */
export async function userLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Login successful',
      token: data.session.access_token,
      user: data.user,
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function userRegister(email, password, name) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Registration successful',
      user: data.user,
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function userLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { message: 'Logout successful' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// CONTACTS
// ============================================

export async function postContact(form) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([{
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getContacts() {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Admin Contacts CRUD
export async function getContactsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function createContactAdmin(token, contactData) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([contactData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function updateContactAdmin(token, id, contactData) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .update(contactData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function deleteContactAdmin(token, id) {
  try {
    const { error } = await supabase
      .from('contact_submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Contact deleted successfully' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// SERVICES
// ============================================

export async function getServices(locale = getCurrentLocale()) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Map data to include localized fields
    return data.map(service => ({
      ...service,
      title: getLocalizedField(service, 'name', locale),
      description: getLocalizedField(service, 'description', locale),
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getServiceById(id, locale = getCurrentLocale()) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      title: getLocalizedField(data, 'name', locale),
      description: getLocalizedField(data, 'description', locale),
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Admin Services CRUD
export async function getServicesAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function createServiceAdmin(token, serviceData) {
  try {
    // Remove undefined values and ensure proper types
    const cleanData = Object.fromEntries(
      Object.entries(serviceData).filter(([_, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .from('services')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      throw new Error(error.message || 'Erreur lors de la création du service');
    }
    return data;
  } catch (error) {
    console.error('Exception in createServiceAdmin:', error);
    handleApiError(error);
    throw error;
  }
}

export async function updateServiceAdmin(token, id, serviceData) {
  try {
    if (!id) {
      throw new Error('ID du service requis pour la mise à jour');
    }

    // Remove undefined values and ensure proper types
    const cleanData = Object.fromEntries(
      Object.entries(serviceData).filter(([_, v]) => v !== undefined)
    );

    // Add updated_at timestamp
    cleanData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('services')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      throw new Error(error.message || 'Erreur lors de la mise à jour du service');
    }
    return data;
  } catch (error) {
    console.error('Exception in updateServiceAdmin:', error);
    handleApiError(error);
    throw error;
  }
}

export async function deleteServiceAdmin(token, id) {
  try {
    if (!id) {
      throw new Error('ID du service requis pour la suppression');
    }

    console.log('Attempting to delete service with ID:', id, 'Type:', typeof id);

    // Ensure ID is a number
    const serviceId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(serviceId)) {
      throw new Error('ID invalide');
    }

    // Check if we have a valid Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session && !token) {
      console.warn('No Supabase session or token found');
      // Try to use token if provided
      if (token) {
        console.log('Using provided token for authentication');
      } else {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
    }

    // Try to delete the service directly
    const { data: deletedData, error: deleteError } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .select();

    // If deletion succeeded (returned data)
    if (deletedData && deletedData.length > 0) {
      console.log('Service deleted successfully:', deletedData);
      return { message: 'Service supprimé avec succès', deleted: true, data: deletedData };
    }

    // If there's an error, check if it's RLS-related or session-related
    if (deleteError) {
      console.error('Delete error:', deleteError);
      console.error('Error code:', deleteError.code);
      console.error('Error message:', deleteError.message);
      console.error('Error details:', deleteError);
      
      // Check for 406 Not Acceptable (usually means no session or RLS issue)
      if (deleteError.code === 'PGRST301' || deleteError.message?.includes('406') || deleteError.message?.includes('Not Acceptable')) {
        console.log('406 error detected - likely RLS or session issue, attempting soft delete...');
        
        // Try soft delete: set is_active to false
        const { data: softDeleteData, error: softDeleteError } = await supabase
          .from('services')
          .update({ is_active: false })
          .eq('id', serviceId)
          .select()
          .single();

        if (softDeleteError) {
          console.error('Soft delete also failed:', softDeleteError);
          throw new Error('Impossible de supprimer le service. Vérifiez que vous êtes connecté et que les permissions RLS sont correctes.');
        }

        if (softDeleteData) {
          console.log('Service soft deleted (is_active = false)');
          return { 
            message: 'Service désactivé (soft delete) - Vérifiez les permissions RLS pour la suppression complète', 
            deleted: true, 
            softDeleted: true,
            data: softDeleteData 
          };
        }
      }
      
      // If RLS error, try soft delete as fallback
      if (deleteError.code === '42501' || deleteError.message?.includes('permission') || deleteError.message?.includes('policy') || deleteError.message?.includes('row-level security')) {
        console.log('RLS permission error detected, attempting soft delete...');
        
        // Try soft delete: set is_active to false
        const { data: softDeleteData, error: softDeleteError } = await supabase
          .from('services')
          .update({ is_active: false })
          .eq('id', serviceId)
          .select()
          .single();

        if (softDeleteError) {
          console.error('Soft delete also failed:', softDeleteError);
          throw new Error('Impossible de supprimer le service. Vérifiez les permissions RLS dans Supabase.');
        }

        if (softDeleteData) {
          console.log('Service soft deleted (is_active = false)');
          return { 
            message: 'Service désactivé (soft delete) - Vérifiez les permissions RLS pour la suppression complète', 
            deleted: true, 
            softDeleted: true,
            data: softDeleteData 
          };
        }
      }
      
      // For other errors, throw the original error
      throw new Error(deleteError.message || 'Erreur lors de la suppression du service');
    }

    // If no error and no data returned, deletion might have succeeded silently
    // Verify by checking if service still exists
    const { data: verifyData, error: verifyError } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .maybeSingle();

    // If service doesn't exist (PGRST116 = not found), deletion was successful
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('Service verified as deleted (not found after delete)');
      return { message: 'Service supprimé avec succès', deleted: true };
    }

    // If service still exists and no error, deletion failed silently
    if (verifyData) {
      console.warn('Service still exists after delete - no error but service persists');
      // Try soft delete as fallback
      const { data: softDeleteData, error: softDeleteError } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId)
        .select()
        .single();

      if (!softDeleteError && softDeleteData) {
        return { 
          message: 'Service désactivé (soft delete) - La suppression complète nécessite des permissions RLS', 
          deleted: true, 
          softDeleted: true 
        };
      }
      
      throw new Error('La suppression a échoué. Le service existe toujours. Vérifiez les permissions RLS.');
    }

    // If no verifyData and no error, assume deletion succeeded
    console.log('Service deleted successfully (no verification data)');
    return { message: 'Service supprimé avec succès', deleted: true };
  } catch (error) {
    console.error('Exception in deleteServiceAdmin:', error);
    handleApiError(error);
    throw error;
  }
}

// ============================================
// CATEGORIES HOUSE
// ============================================

export async function getCategoriesHouse(locale = getCurrentLocale(), serviceId = null) {
  try {
    let query = supabase
      .from('categories_house')
      .select('*');

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(cat => ({
      ...cat,
      name: getLocalizedField(cat, 'name', locale),
      description: getLocalizedField(cat, 'description', locale),
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getCategoryHouseById(id, locale = getCurrentLocale()) {
  try {
    const { data, error } = await supabase
      .from('categories_house')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      name: getLocalizedField(data, 'name', locale),
      description: getLocalizedField(data, 'description', locale),
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// TYPES
// ============================================

export async function getTypes(locale = getCurrentLocale(), serviceId = null, categoryHouseId = null) {
  try {
    let query = supabase
      .from('types')
      .select('*');

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    if (categoryHouseId) {
      query = query.eq('category_house_id', categoryHouseId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(type => ({
      ...type,
      name: getLocalizedField(type, 'name', locale),
      description: getLocalizedField(type, 'description', locale),
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getTypeById(id, locale = getCurrentLocale()) {
  try {
    const { data, error } = await supabase
      .from('types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      name: getLocalizedField(data, 'name', locale),
      description: getLocalizedField(data, 'description', locale),
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// TYPE OPTIONS
// ============================================

export async function getTypeOptions(typeId, locale = getCurrentLocale()) {
  try {
    let query = supabase
      .from('type_options')
      .select('*');

    if (typeId) {
      query = query.eq('type_id', typeId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(option => ({
      ...option,
      name: getLocalizedField(option, 'name', locale),
      description: getLocalizedField(option, 'description', locale),
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// RESERVATIONS
// ============================================

export async function createReservation(reservationData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        ...reservationData,
        user_id: user?.id || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getReservationsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function createReservationAdmin(token, reservationData) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function updateReservationAdmin(token, id, reservationData) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update(reservationData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function deleteReservationAdmin(token, id) {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Reservation deleted successfully' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function updateReservationStatus(token, id, status) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// RATINGS
// ============================================

// Helper function to calculate stats from ratings array
function calculateRatingStats(ratings) {
  if (!ratings || ratings.length === 0) {
    return {
      total_ratings: 0,
      average_rating: 0,
      recent_comments: []
    };
  }

  const totalRatings = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
  const averageRating = totalRatings > 0 ? sum / totalRatings : 0;
  
  // Get recent comments (ratings with comments, sorted by date)
  const recentComments = ratings
    .filter(r => r.comment && r.comment.trim())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10)
    .map(r => ({
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at
    }));

  return {
    total_ratings: totalRatings,
    average_rating: averageRating,
    recent_comments: recentComments
  };
}

export async function getRatings() {
  try {
    // Only get site ratings (where product_id is NULL)
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .is('product_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Calculate stats and return in expected format
    const stats = calculateRatingStats(data);
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getAllRatings() {
  try {
    // Only get site ratings (where product_id is NULL)
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .is('product_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

/**
 * Check if the current user has already rated the site
 * (ratings where product_id is NULL are site ratings)
 */
export async function hasUserRatedSite() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { hasRated: false, rating: null };
    }

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', user.id)
      .is('product_id', null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return {
      hasRated: !!data,
      rating: data || null
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function submitRating(ratingData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user has already rated the site (for site ratings, product_id should be null)
    if (user && !ratingData.product_id) {
      const { data: existingRating, error: checkError } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', user.id)
        .is('product_id', null)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingRating) {
        return {
          success: false,
          message: 'Vous avez déjà soumis une évaluation. Vous ne pouvez évaluer qu\'une seule fois.'
        };
      }
    }
    
    // Get user IP (non-blocking, with timeout)
    let userIp = 'unknown';
    try {
      const ipResponse = await Promise.race([
        fetch('https://api.ipify.org?format=json'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ]);
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        userIp = ipData.ip || 'unknown';
      }
    } catch (ipError) {
      // IP fetch failed, continue with 'unknown'
      console.warn('Could not fetch user IP:', ipError);
    }

    const { data, error } = await supabase
      .from('ratings')
      .insert([{
        ...ratingData,
        user_id: user?.id || null,
        user_ip: userIp,
        user_agent: navigator.userAgent,
        product_id: ratingData.product_id || null, // Ensure product_id is null for site ratings
      }])
      .select()
      .single();

    if (error) {
      // Handle duplicate rating error - return error object instead of throwing
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        return {
          success: false,
          message: 'Vous avez déjà soumis une évaluation. Vous ne pouvez évaluer qu\'une seule fois.'
        };
      }
      // For other database errors, throw to be caught by outer catch
      throw error;
    }

    // Fetch all site ratings to calculate updated stats (only where product_id is NULL)
    const { data: allRatings, error: statsError } = await supabase
      .from('ratings')
      .select('*')
      .is('product_id', null)
      .order('created_at', { ascending: false });

    if (statsError) {
      console.warn('Could not fetch stats after rating submission:', statsError);
    }

    // Calculate stats
    const stats = calculateRatingStats(allRatings || []);

    // Return in expected format
    return {
      success: true,
      data: {
        stats: stats
      }
    };
  } catch (error) {
    handleApiError(error);
    // Re-throw to be handled by component's catch block
    throw error;
  }
}

// Admin Rating CRUD functions
export async function getRatingsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function createRatingAdmin(token, ratingData) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .insert([ratingData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function updateRatingAdmin(token, id, ratingData) {
  try {
    const { data, error } = await supabase
      .from('ratings')
      .update(ratingData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function deleteRatingAdmin(token, id) {
  try {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Rating deleted successfully' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// PRODUCTS
// ============================================

export async function getProductsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// EMPLOYEES
// ============================================

export async function getEmployeesAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getConfirmedEmployeesAdmin(token) {
  try {
    // Note: This might need to be adjusted based on your actual table structure
    // Assuming there's a confirmed_employees table or a status field
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// PROMOTIONS
// ============================================

export async function getPromotionsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// SECURITY
// ============================================

export async function getSecuritiesAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('securities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getSecurityReservationsAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('reserve_security')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// ORDERS
// ============================================

export async function getOrdersAdmin(token) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// GALLERY
// ============================================

export async function getGalleryImages(locale = getCurrentLocale(), categoryId = null, typeId = null) {
  try {
    let query = supabase
      .from('gallery')
      .select('*');

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (typeId) {
      query = query.eq('type_id', typeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getGalleryCategories(locale = getCurrentLocale(), typeId = null) {
  try {
    let query = supabase
      .from('category_gallery')
      .select('*');

    if (typeId) {
      query = query.eq('type_category_gallery_id', typeId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getGalleryTypes(locale = getCurrentLocale()) {
  try {
    const { data, error } = await supabase
      .from('type_category_gallery')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// ============================================
// ADMIN CRUD
// ============================================

export async function getAdmins(token) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function createAdmin(token, adminData) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert([adminData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function updateAdmin(token, id, adminData) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .update(adminData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function deleteAdmin(token, id) {
  try {
    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Admin deleted successfully' };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Export supabase client for direct use if needed
export { supabase };

