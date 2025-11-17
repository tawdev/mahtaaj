import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const EmployeeAuthContext = createContext(null);

export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاولة استعادة الجلسة من localStorage
    const storedEmployee = localStorage.getItem('employeeData');
    if (storedEmployee) {
      try {
        setEmployee(JSON.parse(storedEmployee));
      } catch (e) {
        console.error('Error parsing stored employee data:', e);
      }
    }
    setLoading(false);

    // يمكنك أيضاً استخدام Supabase Auth مع custom user metadata
    // أو استخدام جدول user_employees منفصل
  }, []);

  const login = async (email, password) => {
    try {
      // استخدام Supabase Auth للتحقق من المستخدم
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // الحصول على بيانات الموظف من جدول user_employees
      const { data: employeeData, error: empError } = await supabase
        .from('user_employees')
        .select('*')
        .eq('email', email)
        .eq('status', true)
        .single();

      if (empError) {
        // إذا لم يكن في جدول user_employees، قد يكون في جدول employees
        // أو يمكنك استخدام authData.user مباشرة
        throw new Error('Employee not found or inactive');
      }

      setEmployee(employeeData);
      localStorage.setItem('employeeToken', authData.session.access_token);
      localStorage.setItem('employeeData', JSON.stringify(employeeData));

      return employeeData;
    } catch (error) {
      console.error('Employee login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeData');
      setEmployee(null);
    } catch (error) {
      console.error('Employee logout error:', error);
      // Continue with logout even if there's an error
      localStorage.removeItem('employeeToken');
      localStorage.removeItem('employeeData');
      setEmployee(null);
    }
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, loading, login, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error('useEmployeeAuth must be used within EmployeeAuthProvider');
  }
  return context;
}


