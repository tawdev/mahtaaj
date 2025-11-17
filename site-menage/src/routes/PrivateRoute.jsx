import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ allowedRoles = [], element }) {
  const token = localStorage.getItem('adminToken');
  const adminDataStr = localStorage.getItem('adminData');

  if (!token || !adminDataStr) {
    return <Navigate to="/admin/login" replace />;
  }

  let role = null;
  try {
    role = JSON.parse(adminDataStr)?.role;
  } catch (_) {
    role = null;
  }

  if (!role) {
    return <Navigate to="/admin/login" replace />;
  }

  // Admin has access to everything
  if (role === 'admin') {
    return element;
  }

  if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
    return element;
  }

  return <Navigate to="/admin/403" replace />;
}


