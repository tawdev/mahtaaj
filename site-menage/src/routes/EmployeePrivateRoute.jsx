import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * EmployeePrivateRoute — allows any active authenticated employee.
 * Verifies via real Supabase session + DB lookup.
 */
export default function EmployeePrivateRoute({ element }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setStatus('denied');
          return;
        }

        const { data: employee, error } = await supabase
          .from('employees')
          .select('id, is_active')
          .eq('email', session.user.email)
          .single();

        if (error || !employee || !employee.is_active) {
          if (!cancelled) setStatus('denied');
          return;
        }

        if (!cancelled) setStatus('allowed');
      } catch (_) {
        if (!cancelled) setStatus('denied');
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>Vérification...</div>;
  if (status === 'denied') return <Navigate to="/employee/login" replace />;
  return element;
}
