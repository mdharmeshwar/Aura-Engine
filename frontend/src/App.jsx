import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000/api';
const categories = ['Electronics', 'Office', 'Home', 'Audio', 'Accessories', 'Furniture', 'Lighting', 'Networking'];
const initialSummary = {
  totalSkus: 0,
  totalInventoryValue: 0,
  outOfStockItems: 0,
};

const statCards = [
  { label: 'Total SKUs', key: 'totalSkus' },
  { label: 'Inventory Value', key: 'totalInventoryValue', type: 'currency' },
  { label: 'Out of Stock', key: 'outOfStockItems' },
];

const defaultForm = {
  productName: '',
  sku: '',
  category: 'Electronics',
  price: 0,
  cost: 0,
  stockQuantity: 0,
  reorderLevel: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function escapeCsvValue(value) {
  const text = String(value ?? '');
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function App() {
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [restockPriority, setRestockPriority] = useState([]);
  const [categoryValuation, setCategoryValuation] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 0, hasNextPage: false, hasPreviousPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-price');
  const [activeSection, setActiveSection] = useState('dashboard');

  const fetchInventory = useCallback(async (requestedPage = page) => {
    try {
      const params = new URLSearchParams({
        page: String(requestedPage),
        limit: '8',
        sort,
      });
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const url = `${API_URL}/inventory?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load inventory.');
      setProducts(data.data || []);
      setPagination(data.pagination || { totalPages: 0, hasNextPage: false, hasPreviousPage: false });
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load inventory.');
    }
  }, [category, page, search, sort]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/analytics`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load analytics.');
      setSummary(data.data?.summary || initialSummary);
      setRestockPriority(data.data?.restockPriority || []);
      setCategoryValuation(data.data?.categoryValuation || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load analytics.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    const delay = setTimeout(async () => {
      setLoading(true);
      await Promise.all([fetchInventory(page), fetchAnalytics()]);
      if (active) setLoading(false);
    }, search || category ? 250 : 0);

    return () => {
      active = false;
      clearTimeout(delay);
    };
  }, [fetchAnalytics, fetchInventory, page, search, category]);

  const categoryBreakdown = useMemo(
    () => categoryValuation.slice(0, 5),
    [categoryValuation]
  );

  const handleExport = () => {
    const rows = [
      ['Aura Engine Inventory Report'],
      ['Generated at', new Date().toISOString()],
      ['Total SKUs', summary.totalSkus],
      ['Inventory value', summary.totalInventoryValue],
      ['Out of stock', summary.outOfStockItems],
      [],
      ['Product', 'SKU', 'Category', 'Stock', 'Reorder level', 'Price'],
      ...products.map((product) => [
        product.productName,
        product.sku,
        product.category,
        product.stockQuantity,
        product.reorderLevel,
        product.price,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `aura-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchInventory(page), fetchAnalytics()]);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'price' || name === 'cost' || name === 'stockQuantity' || name === 'reorderLevel' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('');

    try {
      const response = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Create failed.');

      setStatus('Product added successfully.');
      setForm(defaultForm);
      setPage(1);
      await Promise.all([fetchInventory(1), fetchAnalytics()]);
    } catch (submitError) {
      setStatus(submitError.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Delete failed.');
      setStatus('Product removed.');
      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
        await fetchAnalytics();
      } else {
        await refreshDashboard();
      }
    } catch (deleteError) {
      setStatus(deleteError.message);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-mark">A</div>
          <div>
            <div className="eyebrow">PRODESK IT</div>
            <h1>Aura Engine</h1>
          </div>
        </div>

        <nav className="nav" aria-label="Dashboard sections">
          <a className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} href="#dashboard" onClick={() => setActiveSection('dashboard')}>Dashboard</a>
          <a className={`nav-item ${activeSection === 'inventory' ? 'active' : ''}`} href="#inventory" onClick={() => setActiveSection('inventory')}>Inventory</a>
          <a className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`} href="#analytics" onClick={() => setActiveSection('analytics')}>Analytics</a>
          <a className={`nav-item ${activeSection === 'alerts' ? 'active' : ''}`} href="#alerts" onClick={() => setActiveSection('alerts')}>Alerts</a>
        </nav>

        <div className="panel small-panel">
          <p className="label">Warehouse Load</p>
          <strong>84.6%</strong>
          <div className="progress"><span style={{ width: '84.6%' }} /></div>
        </div>
      </aside>

      <main className="main-panel" id="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operational overview</p>
            <h2>Inventory Command Center</h2>
          </div>
          <button className="primary-btn" onClick={handleExport} disabled={loading || products.length === 0}>Export report</button>
        </header>

        <section className="stats-grid">
          {statCards.map((card) => (
            <article key={card.key} className="stat-card">
              <p>{card.label}</p>
              <h3>
                {card.type === 'currency'
                  ? formatCurrency(summary[card.key])
                  : summary[card.key]}
              </h3>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel table-panel" id="inventory">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Catalog</p>
                <h3>Inventory overview</h3>
              </div>
              <div className="filters">
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search product or SKU"
                />
                <select value={category} onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="-price">Sort: Price high</option>
                  <option value="price">Sort: Price low</option>
                  <option value="-stockQuantity">Sort: Stock high</option>
                  <option value="stockQuantity">Sort: Stock low</option>
                  <option value="-lastUpdated">Sort: Recently updated</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading inventory…</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length ? products.map((product) => (
                    <tr key={product._id}>
                      <td>
                        <div className="product-cell">
                          <div className="tiny-badge" />
                          <div>
                            <strong>{product.productName}</strong>
                            <small>Reorder {product.reorderLevel}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td>{product.category}</td>
                      <td>
                        <span className={`stock-pill ${product.stockQuantity <= product.reorderLevel ? 'low' : ''}`}>
                          {product.stockQuantity}
                        </span>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>
                        <button className="ghost-btn" onClick={() => handleDelete(product._id)}>Delete</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td className="empty-table" colSpan="6">No products match these filters.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            <div className="pagination">
              <button onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={!pagination.hasPreviousPage}>Prev</button>
              <span>Page {page}{pagination.totalPages ? ` of ${pagination.totalPages}` : ''}</span>
              <button onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasNextPage}>Next</button>
            </div>
          </div>

          <div className="panel form-panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Quick add</p>
                <h3>Add product</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <label>
                Product name
                <input name="productName" value={form.productName} onChange={handleFormChange} />
              </label>
              <label>
                SKU
                <input name="sku" value={form.sku} onChange={handleFormChange} />
              </label>
              <label>
                Category
                <select name="category" value={form.category} onChange={handleFormChange}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <div className="split-fields">
                <label>
                  Price
                  <input type="number" name="price" value={form.price} onChange={handleFormChange} />
                </label>
                <label>
                  Cost
                  <input type="number" name="cost" value={form.cost} onChange={handleFormChange} />
                </label>
              </div>
              <div className="split-fields">
                <label>
                  Stock
                  <input type="number" name="stockQuantity" value={form.stockQuantity} onChange={handleFormChange} />
                </label>
                <label>
                  Reorder level
                  <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={handleFormChange} />
                </label>
              </div>
              <button className="primary-btn full" type="submit">Create inventory item</button>
              {status && <p className="status-text">{status}</p>}
              {error && <p className="error-text">{error}</p>}
            </form>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel" id="alerts">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Replenishment</p>
                <h3>Restock priority</h3>
              </div>
            </div>
            <ul className="priority-list">
              {restockPriority.length ? restockPriority.map((item) => (
                <li key={item.sku}>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>{item.sku}</small>
                  </div>
                  <span>{item.stockQuantity} left</span>
                </li>
              )) : <li className="empty-state">No restock items yet.</li>}
            </ul>
          </div>

          <div className="panel" id="analytics">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Performance</p>
                <h3>Category valuation</h3>
              </div>
            </div>
            <div className="bars">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="bar-row">
                  <div className="bar-label-row">
                    <span>{item.category}</span>
                    <strong>{formatCurrency(item.totalInventoryValue)}</strong>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${Math.min((item.totalInventoryValue / Math.max(summary.totalInventoryValue, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
