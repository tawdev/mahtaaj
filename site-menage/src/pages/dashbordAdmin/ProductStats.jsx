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
import { supabase } from '../../lib/supabase';

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) throw productsError;

      // 2. Fetch all orders with their items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, items, created_at, status')
        .neq('status', 'cancelled');

      if (ordersError) throw ordersError;

      // 3. Process products and orders to calculate stats
      let totalSalesCount = 0;
      let totalRevenueSum = 0;

      const statsMap = products.map(product => {
        let productSales = 0;
        let productRevenue = 0;
        const salesHistory = [];

        orders.forEach(order => {
          const items = Array.isArray(order.items) ? order.items : [];
          const productItem = items.find(item =>
            parseInt(item.product_id) === product.id ||
            item.name === product.name
          );

          if (productItem) {
            const qty = parseInt(productItem.quantity || 1);
            const price = parseFloat(productItem.price || product.price || 0);
            const subtotal = price * qty;

            productSales += qty;
            productRevenue += subtotal;

            salesHistory.push({
              date: new Date(order.created_at).toISOString().split('T')[0],
              datetime: new Date(order.created_at).toLocaleString(),
              quantity: qty,
              price: price
            });
          }
        });

        totalSalesCount += productSales;
        totalRevenueSum += productRevenue;

        return {
          ...product,
          total_sales: productSales,
          total_revenue: productRevenue,
          sales: salesHistory
        };
      });

      setProductStats(statsMap);
      setSummary({
        total_products: products.length,
        total_sales: totalSalesCount,
        total_revenue: totalRevenueSum
      });

      // 4. Prepare chart data (History for last 30 days)
      const last30Days = [...Array(30)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });

      const processedChartData = statsMap
        .filter(p => p.total_sales > 0)
        .slice(0, 5) // Show top 5 products in chart to avoid clutter
        .map(product => {
          const dailyData = last30Days.map(date => {
            const daySales = product.sales
              .filter(s => s.date === date)
              .reduce((sum, s) => sum + s.quantity, 0);
            return { date, sales: daySales };
          });

          return {
            name: product.name,
            data: dailyData
          };
        });

      setChartData(processedChartData);

    } catch (err) {
      console.error('Migration error:', err);
      setError('Erreur lors de la récupération des données Supabase: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductStats = fetchData; // Keep compatible name if needed

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
