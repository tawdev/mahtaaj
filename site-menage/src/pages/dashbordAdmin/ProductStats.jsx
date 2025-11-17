import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './ProductStats.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ProductStats({ token, onAuthError }) {
  const [productStats, setProductStats] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('total_sales'); // 'total_sales', 'name', 'date'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [chartType, setChartType] = useState('line'); // 'line', 'bar'
  const [summary, setSummary] = useState({
    total_products: 0,
    total_sales: 0,
    total_revenue: 0
  });

  useEffect(() => {
    fetchProductStats();
    fetchChartData();
  }, []);

  const fetchProductStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/stats/products', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onAuthError();
          return;
        }
        throw new Error('Erreur lors de la récupération des statistiques');
      }

      const data = await response.json();
      if (data.success) {
        setProductStats(data.data);
        setSummary(data.summary);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/stats/products/evolution', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onAuthError();
          return;
        }
        throw new Error('Erreur lors de la récupération des données de graphique');
      }

      const data = await response.json();
      if (data.success) {
        setChartData(data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des données de graphique:', err);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedProducts = [...productStats].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'total_sales':
        aValue = a.total_sales;
        bValue = b.total_sales;
        break;
      case 'total_revenue':
        aValue = a.total_revenue;
        bValue = b.total_revenue;
        break;
      case 'date':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      default:
        aValue = a.total_sales;
        bValue = b.total_sales;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const prepareChartData = () => {
    if (!chartData.length) return null;

    const labels = chartData[0]?.data?.map(item => item.date) || [];
    const datasets = chartData.map((product, index) => ({
      label: product.name,
      data: product.data.map(item => item.sales),
      borderColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
      backgroundColor: `hsla(${(index * 137.5) % 360}, 70%, 50%, 0.1)`,
      tension: 0.4,
      fill: false,
    }));

    return {
      labels,
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des ventes par produit (30 derniers jours)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Nombre de ventes',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="product-stats-container">
        <div className="product-stats-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des statistiques des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-stats-container">
        <div className="product-stats-error">
          <p>❌ {error}</p>
          <button onClick={fetchProductStats} className="retry-button">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-stats-container">
      <div className="product-stats-header">
        <h2>📊 Statistiques des Produits</h2>
        <div className="stats-summary">
          <div className="summary-card">
            <div className="summary-number">{summary.total_products}</div>
            <div className="summary-label">Produits</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{summary.total_sales}</div>
            <div className="summary-label">Ventes totales</div>
          </div>
          <div className="summary-card">
            <div className="summary-number">{summary.total_revenue.toFixed(2)}€</div>
            <div className="summary-label">Chiffre d'affaires</div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>📈 Évolution des Ventes</h3>
          <div className="chart-controls">
            <button
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              📈 Ligne
            </button>
            <button
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => setChartType('bar')}
            >
              📊 Barres
            </button>
          </div>
        </div>
        <div className="chart-container">
          {chartData.length > 0 && prepareChartData() ? (
            chartType === 'line' ? (
              <Line data={prepareChartData()} options={chartOptions} />
            ) : (
              <Bar data={prepareChartData()} options={chartOptions} />
            )
          ) : (
            <div className="no-chart-data">
              <p>📊 Aucune donnée de vente disponible pour les graphiques</p>
            </div>
          )}
        </div>
      </div>

      {/* Products List Section */}
      <div className="products-list-section">
        <div className="products-list-header">
          <h3>📦 Liste des Produits</h3>
          <div className="sort-controls">
            <span>Trier par:</span>
            <button
              className={`sort-btn ${sortBy === 'total_sales' ? 'active' : ''}`}
              onClick={() => handleSort('total_sales')}
            >
              Ventes {sortBy === 'total_sales' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => handleSort('name')}
            >
              Nom {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              className={`sort-btn ${sortBy === 'total_revenue' ? 'active' : ''}`}
              onClick={() => handleSort('total_revenue')}
            >
              Revenus {sortBy === 'total_revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              className={`sort-btn ${sortBy === 'date' ? 'active' : ''}`}
              onClick={() => handleSort('date')}
            >
              Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Ventes totales</th>
                <th>Chiffre d'affaires</th>
                <th>Dernières ventes</th>
                <th>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="product-info">
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.name} />
                      ) : (
                        <div className="no-image">📦</div>
                      )}
                    </div>
                    <div className="product-details">
                      <div className="product-name">{product.name}</div>
                      <div className="product-description">{product.description}</div>
                    </div>
                  </td>
                  <td className="product-price">{product.price}€</td>
                  <td className="sales-count">
                    <span className={`sales-badge ${product.total_sales > 0 ? 'has-sales' : 'no-sales'}`}>
                      {product.total_sales}
                    </span>
                  </td>
                  <td className="revenue">{product.total_revenue.toFixed(2)}€</td>
                  <td className="recent-sales">
                    {product.sales.length > 0 ? (
                      <div className="sales-list">
                        {product.sales.slice(0, 3).map((sale, index) => (
                          <div key={index} className="sale-item">
                            <span className="sale-date">{sale.datetime}</span>
                            <span className="sale-quantity">x{sale.quantity}</span>
                          </div>
                        ))}
                        {product.sales.length > 3 && (
                          <div className="more-sales">
                            +{product.sales.length - 3} autres
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="no-sales">Aucune vente</span>
                    )}
                  </td>
                  <td className="created-date">{product.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
