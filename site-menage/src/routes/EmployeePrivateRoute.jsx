import React from 'react';
import { Navigate } from 'react-router-dom';

export default function EmployeePrivateRoute({ element }) {
  const token = localStorage.getItem('employeeToken');
  const data = localStorage.getItem('employeeData');

  if (!token || !data) {
    return <Navigate to="/employee/login" replace />;
  }
  return element;
}


