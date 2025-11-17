import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEmployee, toggleEmployeeStatus } from '../../services/employeeApi';
import './styles/details.css';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);

  useEffect(() => {
    getEmployee(id).then(setEmp);
  }, [id]);

  const onToggle = async () => {
    await toggleEmployeeStatus(id);
    const updated = await getEmployee(id);
    setEmp(updated);
  };

  if (!emp) return <div>Loading...</div>;

  return (
    <div>
      <div className="emp-toolbar">
        <div className="emp-header" style={{ marginBottom: 0 }}>
        {emp.profile_image && (
          <img src={`http://localhost:8000/storage/${emp.profile_image}`} alt={emp.full_name} className="emp-avatar" />
        )}
        <div>
          <h3 className="emp-title" style={{ margin: 0 }}>{emp.full_name}</h3>
          <div><small>{emp.email}</small></div>
        </div>
        </div>
        <div className="emp-actions-right">
          <Link to={`/employee/dashboard/employees/${emp.id}/edit`} className="emp-btn emp-btn--secondary">Edit</Link>
          <button onClick={onToggle} className="emp-btn">Toggle Status</button>
          <button onClick={() => navigate(-1)} className="emp-btn">Back</button>
        </div>
      </div>
      <div className="emp-details emp-card" style={{ padding: 16 }}>
        <div><strong>Phone:</strong> {emp.phone_number}</div>
        <div><strong>Role:</strong> {emp.role}</div>
        <div><strong>Status:</strong> {emp.status ? 'Active' : 'Inactive'}</div>
        <div><strong>Address:</strong> {emp.address || '-'}</div>
      </div>
    </div>
  );
}


