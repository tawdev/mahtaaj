import React, { useEffect, useState } from 'react';
import { listEmployees } from '../../services/employeeApi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import './styles/overview.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Overview() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, perRole: {} });

  useEffect(() => {
    (async () => {
      const page1 = await listEmployees({ per_page: 100 });
      const items = page1.data || [];
      const total = page1.total || items.length;
      const active = items.filter((e) => e.status).length;
      const inactive = items.filter((e) => !e.status).length;
      const perRole = items.reduce((acc, e) => { acc[e.role] = (acc[e.role] || 0) + 1; return acc; }, {});
      setStats({ total, active, inactive, perRole });
    })();
  }, []);

  const chartData = {
    labels: Object.keys(stats.perRole),
    datasets: [
      {
        label: 'Employees per Role',
        data: Object.values(stats.perRole),
        backgroundColor: '#0a7cff',
      },
    ],
  };

  return (
    <div>
      <h2 className="emp-title">Overview</h2>
      <div className="emp-grid-3" style={{ marginBottom: 20 }}>
        <div className="emp-card emp-stat"><strong>Total</strong><div className="val">{stats.total}</div></div>
        <div className="emp-card emp-stat"><strong>Active</strong><div className="val">{stats.active}</div></div>
        <div className="emp-card emp-stat"><strong>Inactive</strong><div className="val">{stats.inactive}</div></div>
      </div>
      <div className="emp-card" style={{ padding: 16 }}>
        <Bar data={chartData} />
      </div>
    </div>
  );
}


