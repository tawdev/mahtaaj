import React, { useEffect, useMemo, useState } from 'react';
import { listOffers, updateOfferStatus } from '../../services/employeeApi';
import './styles/employees.css';
import { useEmployeeAuth } from '../../contexts/EmployeeAuthContext';

export default function Offres() {
  const { employee } = useEmployeeAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [data, setData] = useState({ data: [], total: 0, last_page: 1 });
  const [counts, setCounts] = useState({});
  const [type, setType] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [infoContent, setInfoContent] = useState(null);

  const types = useMemo(() => ([
    { key: 'menage', label: 'Ménage 🧹' },
    { key: 'bebe', label: 'Bébé 👶' },
    { key: 'jardinage', label: 'Jardinage 🌿' },
    { key: 'hand_worker', label: 'Hand Worker 🔧' },
    { key: 'security', label: 'Security 🛡️' },
  ]), []);

  const loadCounts = async () => {
    const res = await listOffers({ per_page: 200 });
    const c = {};
    (res.data || []).forEach((r) => { c[r.type] = (c[r.type] || 0) + 1; });
    setCounts(c);
  };

  const load = async () => {
    const res = await listOffers({ search, page, per_page: perPage, type: type || undefined });
    setData(res);
  };

  // Determine default type for non-admin roles
  useEffect(() => {
    if (!employee) return;
    if (employee.role !== 'adminEmployes') {
      const map = {
        houseKlean: 'menage',
        security: 'security',
        jardinaj: 'jardinage',
        bebeSeitting: 'bebe',
        handWorker: 'hand_worker',
      };
      setType(map[employee.role] || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  useEffect(() => { if (employee?.role === 'adminEmployes') loadCounts(); /* eslint-disable-next-line */ }, [employee]);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, type, employee]);

  const onFilter = async (e) => {
    e.preventDefault();
    setPage(1);
    await load();
  };

  return (
    <div>
      <div className="emp-actions">
        <h3 className="emp-title" style={{ marginBottom: 0 }}>Offres</h3>
        <div className="emp-actions-right" />
      </div>

      {employee?.role === 'adminEmployes' && (
        <div className="emp-grid-3" style={{ marginBottom: 16 }}>
          {types.map((t) => (
            <button
              key={t.key}
              className={`emp-card emp-btn`}
              style={{ textAlign: 'left', padding: 16, borderColor: type === t.key ? '#bcd2ff' : undefined, background: type === t.key ? '#f3f7ff' : '#fff' }}
              onClick={() => { setType(t.key === type ? '' : t.key); setPage(1); }}
            >
              <div style={{ fontWeight: 600 }}>{t.label}</div>
              <div className="emp-hint">{counts[t.key] || 0} reservations</div>
            </button>
          ))}
        </div>
      )}

      {employee?.role === 'adminEmployes' && type && (
        <div className="emp-actions" style={{ marginTop: 8 }}>
          <button className="emp-btn" onClick={() => { setType(''); setPage(1); }}>رجوع</button>
          <div />
        </div>
      )}

      <form onSubmit={onFilter} className="emp-filters">
        <input className="emp-input" placeholder="Search by id/status" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="emp-btn">Filter</button>
      </form>
      {employee?.role === 'adminEmployes' ? (
        <div className="emp-table-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Client</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((r) => (
                <tr key={`${r.type}-${r.id}`}>
                  <td>{r.id}</td>
                  <td>{r.type}</td>
                  <td>{r.customer_name || '-'}</td>
                  <td>{r.address || '-'}</td>
                  <td><span className={`emp-badge ${r.status === 'active' || r.status === 'confirmed' ? 'emp-badge--active' : 'emp-badge--inactive'}`}>{r.status}</span></td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    {r.status !== 'confirmed' ? (
                      <button
                        className="emp-btn emp-btn--primary"
                        onClick={async () => {
                          const updated = await updateOfferStatus(r.type, r.id, 'confirmed');
                          setData((prev) => ({
                            ...prev,
                            data: prev.data.map((x) => (x.type === r.type && x.id === r.id ? { ...x, status: updated.status } : x)),
                          }));
                        }}
                      >
                        Confirm
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="emp-grid-3">
          {data.data.map((r) => (
            <div key={`${r.type}-${r.id}`} className="emp-card" style={{ padding: 16, borderTop: '4px solid', borderTopColor: r.type === 'menage' ? '#0a7cff' : r.type === 'bebe' ? '#ff7ab6' : r.type === 'jardinage' ? '#22c55e' : r.type === 'hand_worker' ? '#f59e0b' : '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700 }}>
                  {r.type === 'jardinage' ? '🌿 Jardinage' : r.type === 'bebe' ? '👶 Bébé' : r.type === 'menage' ? '🧹 Ménage' : r.type === 'security' ? '🛡️ Security' : '🔧 Hand Worker'}
                </div>
                <span className={`emp-badge ${r.status === 'active' || r.status === 'confirmed' ? 'emp-badge--active' : 'emp-badge--inactive'}`}>{r.status}</span>
              </div>
              <div className="emp-hint" style={{ marginTop: 8 }}>Reservation ID: {r.id}</div>
              <div style={{ marginTop: 12 }}>
                <button
                  className="emp-btn emp-btn--primary"
                  onClick={async () => {
                    // For employees (non-admin): show info card overlay instead of revealing client data
                    setInfoContent({
                      title: (r.type === 'jardinage' ? '🌿 Jardinage' : r.type === 'bebe' ? '👶 Bébé' : r.type === 'menage' ? '🧹 Ménage' : r.type === 'security' ? '🛡️ Security' : '🔧 Hand Worker') + ' #' + r.id,
                      message: '📩 لتأكيد هذه الخدمة والحصول على معلومات العميل، يرجى التواصل مع المشرف / Admin',
                    });
                    setShowInfo(true);
                  }}
                >
                  {r.status === 'confirmed' ? 'Change to Cancelled' : 'Accept / Confirm'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Overlay (Modal/Card) for employees */}
      {showInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowInfo(false)}>
          <div className="emp-card" style={{ width: 'min(520px, 92%)', padding: 20, background: '#fff' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 className="emp-title" style={{ marginBottom: 0 }}>{infoContent?.title || 'Request'}</h3>
              <button className="emp-btn" onClick={() => setShowInfo(false)}>×</button>
            </div>
            <div className="emp-hint" style={{ fontSize: 15, lineHeight: 1.6 }}>{infoContent?.message}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="emp-btn emp-btn--primary" onClick={() => setShowInfo(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
      <div className="emp-pagination">
        <button className="emp-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <div>Page {page} / {data.last_page}</div>
        <button className="emp-btn" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}


