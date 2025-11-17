import React, { useEffect, useMemo, useState } from 'react';
import './AdminBebeEmployees.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export default function AdminBebeEmployees({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');

	const getToken = () => token || localStorage.getItem('adminToken');

	const load = async () => {
		try {
			setLoading(true);
			setError('');
			const authToken = getToken();
			const res = await fetch(`${API_BASE_URL}/api/admin/bebe-employees`, {
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Accept': 'application/json'
				}
			});
			if (res.status === 401) {
				if (onAuthError) onAuthError();
				throw new Error('Non autorisé');
			}
			const data = await res.json();
			if (!res.ok || data?.success === false) throw new Error(data.message || 'Load failed');
			setItems(data.data || []);
		} catch (e) {
			setError(e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const filtered = useMemo(() => {
		if (filter === 'all') return items;
		if (filter === 'active') return items.filter(i => i.is_active);
		if (filter === 'inactive') return items.filter(i => !i.is_active);
		return items;
	}, [items, filter]);

	const toggleActive = async (id, next) => {
		try {
			const authToken = getToken();
			const res = await fetch(`${API_BASE_URL}/api/admin/bebe-employees/${id}`, {
				method: 'PUT',
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify({ is_active: !!next })
			});
			if (res.status === 401) { onAuthError && onAuthError(); return; }
			if (res.ok) setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !!next } : i));
		} catch (e) {
			console.error('Error toggling active:', e);
		}
	};

	const remove = async (id) => {
		if (!window.confirm('Supprimer cet employé ?')) return;
		try {
			const authToken = getToken();
			const res = await fetch(`${API_BASE_URL}/api/admin/bebe-employees/${id}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Accept': 'application/json'
				}
			});
			if (res.status === 401) { onAuthError && onAuthError(); return; }
			if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
		} catch (e) {
			console.error('Error removing employee:', e);
		}
	};

	const validateEmployee = async (id) => {
		try {
			const authToken = getToken();
			const res = await fetch(`${API_BASE_URL}/api/admin/bebe-employees-valid`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${authToken}`,
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ employee_id: id })
			});
			if (res.status === 401) { onAuthError && onAuthError(); return; }
			if (!res.ok) {
				const err = await res.json().catch(()=>({message:'Erreur'}));
				alert(err.message || 'Validation échouée');
				return;
			}
			setItems(prev => prev.filter(i => i.id !== id));
			alert('Employé validé ✅');
		} catch (e) {
			console.error('Validate error', e);
		}
	};

	return (
		<main className="admin-page bebe-employees-page">
			<div className="bebe-employees-header">
				<h1>Employés Bébé</h1>
				<div className="bebe-employees-actions">
					<select 
						className="bebe-employees-filter"
						value={filter} 
						onChange={e=>setFilter(e.target.value)}
					>
						<option value="all">Tous</option>
						<option value="active">Actifs</option>
						<option value="inactive">Inactifs</option>
					</select>
					<button className="bebe-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
				</div>
			</div>

			{error && (
				<div className="bebe-employees-alert error">
					<span>⚠️</span>
					<span>{error}</span>
				</div>
			)}
			{loading ? (
				<div className="bebe-employees-loading">Chargement…</div>
			) : (
				<div className="bebe-employees-table-wrapper">
					<table className="bebe-employees-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Nom</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Expertise</th>
								<th>Ville</th>
								<th>Statut</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(emp => (
								<tr key={emp.id}>
									<td>#{emp.id}</td>
									<td>{`${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-'}</td>
									<td>
										<a href={`mailto:${emp.email}`} className="bebe-employees-email">{emp.email || '-'}</a>
									</td>
									<td>{emp.phone || '-'}</td>
									<td>{emp.expertise || '-'}</td>
									<td>{emp.location || '-'}</td>
									<td>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<input 
												type="checkbox" 
												className="bebe-employees-checkbox"
												checked={!!emp.is_active} 
												onChange={e=>toggleActive(emp.id, e.target.checked)} 
											/>
											<span className={`bebe-employees-status ${emp.is_active ? 'active' : 'inactive'}`}>
												{emp.is_active ? '✓ Actif' : '✗ Inactif'}
											</span>
										</div>
									</td>
									<td>
										<div style={{display:'flex', gap:8}}>
											<button className="bebe-employees-validate-btn" onClick={()=>validateEmployee(emp.id)}>✅ Valider</button>
											<button className="bebe-employees-delete-btn" onClick={()=>remove(emp.id)}>🗑️ Supprimer</button>
										</div>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={8} className="bebe-employees-empty">Aucun employé trouvé</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</main>
	);
}


