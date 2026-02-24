import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * EmployeeAdminRoute — only allows employees with role 'adminEmployes'.
 * Verifies via real Supabase session + DB lookup.
 */
export default function EmployeeAdminRoute({ element }) {
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
          .select('role, is_active')
          .eq('email', session.user.email)
          .single();

        if (error || !employee || !employee.is_active) {
          if (!cancelled) setStatus('denied');
          return;
        }

        if (!cancelled) {
          setStatus(employee.role === 'adminEmployes' ? 'allowed' : 'forbidden');
        }
      } catch (_) {
        if (!cancelled) setStatus('denied');
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, []);

  if (status === 'loading') return <div style={{ padding: '2rem', textAlign: 'center' }}>Vérification...</div>;
  if (status === 'denied') return <Navigate to="/employee/login" replace />;
  if (status === 'forbidden') return <Navigate to="/employee/dashboard/profile" replace />;
  return element;
}
