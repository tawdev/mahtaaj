import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createEmployee, getEmployee, updateEmployee } from '../../services/employeeApi';
import './styles/form.css';

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const roles = useMemo(() => ['houseKlean', 'security', 'jardinaj', 'bebeSeitting', 'handWorker'], []);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'houseKlean',
    status: true,
    address: '',
    password: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit) {
      getEmployee(id).then((e) => setForm({ ...form, ...e, password: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'status') {
          fd.append('status', v ? '1' : '0');
        } else if (v !== '' && v !== null && v !== undefined) {
          fd.append(k, v);
        }
      });
      if (file) fd.append('profile_image', file);
      if (isEdit) await updateEmployee(id, fd); else await createEmployee(fd);
      navigate('/employee/dashboard/employees');
    } catch (err) {
      setError(err?.response?.data?.message || 'Error saving employee');
    }
  };

  return (
    <div>
      <div className="emp-toolbar">
        <h3 className="emp-title" style={{ marginBottom: 0 }}>{isEdit ? 'Edit Employee' : 'Add Employee'}</h3>
        <div className="emp-actions-right">
          <button type="button" onClick={() => navigate(-1)} className="emp-btn">Cancel</button>
          <button form="emp-form" type="submit" className="emp-btn emp-btn--primary">{isEdit ? 'Update' : 'Create'}</button>
        </div>
      </div>
      {error && <div className="emp-error">{error}</div>}
      <form id="emp-form" onSubmit={onSubmit} className="emp-form emp-card" style={{ maxWidth: 640, padding: 16 }}>
        <div className="emp-field">
          <label>Full Name</label>
          <input className="emp-input" name="full_name" value={form.full_name} onChange={onChange} />
        </div>
        <div className="emp-field">
          <label>Email</label>
          <input className="emp-input" type="email" name="email" value={form.email} onChange={onChange} />
        </div>
        <div className="emp-field">
          <label>Phone</label>
          <input className="emp-input" name="phone_number" value={form.phone_number} onChange={onChange} />
        </div>
        <div className="emp-field">
          <label>Role</label>
          <select className="emp-select" name="role" value={form.role} onChange={onChange}>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="emp-field">
          <label>Status</label>
          <input type="checkbox" name="status" checked={!!form.status} onChange={onChange} /> Active
        </div>
        <div className="emp-field">
          <label>Address</label>
          <input className="emp-input" name="address" value={form.address} onChange={onChange} />
        </div>
        <div className="emp-field">
          <label>Password {isEdit && <span style={{ color: '#888' }}>(leave empty to keep)</span>}</label>
          <input className="emp-input" type="password" name="password" value={form.password} onChange={onChange} />
        </div>
        <div className="emp-field">
          <label>Profile Image</label>
          <input className="emp-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
      </form>
    </div>
  );
}


