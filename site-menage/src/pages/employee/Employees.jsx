import React, { useEffect, useMemo, useState } from 'react';
import { listEmployees, deleteEmployee, toggleEmployeeStatus } from '../../services/employeeApi';
import { Link, useNavigate } from 'react-router-dom';
import './styles/employees.css';

export default function Employees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [data, setData] = useState({ data: [], total: 0, last_page: 1 });
  const roles = useMemo(() => ['houseKlean', 'security', 'jardinaj', 'bebeSeitting', 'handWorker'], []);

  const load = async () => {
    const res = await listEmployees({ search, role: role || undefined, status: status === '' ? undefined : status, page, per_page: perPage });
    setData(res);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onFilter = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    await deleteEmployee(id);
    await load();
  };

  const onToggle = async (id) => {
    await toggleEmployeeStatus(id);
    await load();
  };

  return (
    <div>
      <div className="emp-actions">
        <h3 className="emp-title" style={{ marginBottom: 0 }}>Employees</h3>
        <div className="emp-actions-right">
          <button onClick={() => navigate('/employee/dashboard/employees/new')} className="emp-btn emp-btn--primary">Add Employee</button>
        </div>
      </div>
      <form onSubmit={onFilter} className="emp-filters">
        <input className="emp-input" placeholder="Search name/email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="emp-select" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="emp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Any Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" className="emp-btn">Filter</button>
      </form>
      <div className="emp-table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((e) => (
              <tr key={e.id}>
                <td>{e.full_name}</td>
                <td>{e.email}</td>
                <td>{e.role}</td>
                <td>
                  <span className={`emp-badge ${e.status ? 'emp-badge--active' : 'emp-badge--inactive'}`}>{e.status ? 'Active' : 'Inactive'}</span>
                </td>
                <td>
                  <div className="emp-btn-group">
                    <Link to={`/employee/dashboard/employees/${e.id}`} className="emp-btn emp-btn--link emp-btn--sm">View</Link>
                    <Link to={`/employee/dashboard/employees/${e.id}/edit`} className="emp-btn emp-btn--link emp-btn--sm">Edit</Link>
                    <button onClick={() => onDelete(e.id)} className="emp-btn emp-btn--danger emp-btn--sm">Delete</button>
                    <button onClick={() => onToggle(e.id)} className="emp-btn emp-btn--sm">Toggle</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="emp-pagination">
        <button className="emp-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <div>Page {page} / {data.last_page}</div>
        <button className="emp-btn" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}


