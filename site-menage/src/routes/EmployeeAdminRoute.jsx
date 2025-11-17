import React from 'react';
import { Navigate } from 'react-router-dom';

export default function EmployeeAdminRoute({ element }) {
  const data = localStorage.getItem('employeeData');
  let role = null;
  try { role = JSON.parse(data)?.role; } catch (_) { role = null; }
  if (role === 'adminEmployes') return element;
  return <Navigate to="/employee/dashboard/profile" replace />;
}


