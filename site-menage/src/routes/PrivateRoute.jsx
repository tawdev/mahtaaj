import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * PrivateRoute — verifies a REAL Supabase JWT session server-side.
 * 
 * ✅ SECURITY FIX: no longer relies on localStorage alone.
 * The actual DB query confirms the user has an active admin role.
 * A forged localStorage entry cannot bypass this check.
 */
export default function PrivateRoute({ allowedRoles = [], element }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'allowed' | 'denied' | 'forbidden'

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Step 1: Get the real Supabase session (JWT)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setStatus('denied');
          return;
        }

        // Step 2: Confirm admin record in DB with this authenticated session
        const { data: admin, error } = await supabase
          .from('admins')
          .select('role, is_active')
          .eq('email', session.user.email)
          .single();

        if (error || !admin || !admin.is_active) {
          if (!cancelled) setStatus('denied');
          return;
        }

        if (
          admin.role === 'admin' ||
          allowedRoles.length === 0 ||
          allowedRoles.includes(admin.role)
        ) {
          if (!cancelled) setStatus('allowed');
        } else {
          if (!cancelled) setStatus('forbidden');
        }
      } catch (_) {
        if (!cancelled) setStatus('denied');
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, [allowedRoles]);

  if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>Vérification...</div>;
  if (status === 'denied') return <Navigate to="/admin/login" replace />;
  if (status === 'forbidden') return <Navigate to="/admin/403" replace />;
  return element;
}
