import React from 'react';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';
import './styles/profile.css';

export default function EmployeeProfile() {
  const { employee } = useEmployeeAuth();

  if (!employee) return null;

  const initial = (employee.full_name || employee.email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div>
      <h2 className="emp-title">My Profile</h2>

      <div className="emp-toolbar">
        <div className="emp-header" style={{ marginBottom: 0 }}>
          {employee.profile_image ? (
            <img
              src={`http://localhost:8000/storage/${employee.profile_image}`}
              alt={employee.full_name}
              className="emp-avatar"
            />
          ) : (
            <div
              className="emp-avatar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(180deg,#8ab6ff,#2f73ff)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 28,
              }}
            >
              {initial}
            </div>
          )}
          <div>
            <h3 className="emp-title" style={{ margin: 0 }}>{employee.full_name}</h3>
            <div><small>{employee.email}</small></div>
          </div>
        </div>
      </div>

      <div className="emp-card" style={{ padding: 16 }}>
        <div className="emp-details">
          <div><strong>Full Name:</strong> {employee.full_name}</div>
          <div><strong>Email:</strong> {employee.email}</div>
          <div><strong>Role:</strong> {employee.role}</div>
          <div><strong>Status:</strong> {employee.status ? 'Active' : 'Inactive'}</div>
          <div><strong>Phone:</strong> {employee.phone_number || '-'}</div>
          <div><strong>Address:</strong> {employee.address || '-'}</div>
        </div>
      </div>
    </div>
  );
}


