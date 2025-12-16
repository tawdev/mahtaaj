import React, { useEffect, useMemo, useState } from 'react';
import './AdminBebeEmployees.css';
import { supabase } from '../../lib/supabase';

// NOTE:
// Cette version utilise directement Supabase (comme les autres pages admin)
// au lieu d'appeler l'ancienne API Laravel sur http://localhost:8000.

export default function AdminBebeEmployees({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');

	const load = async () => {
		try {
			setLoading(true);
			setError('');

			const { data, error } = await supabase
				.from('bebe_employees')
				.select('*')
				.order('created_at', { ascending: false });

			if (error) {
				console.error('[AdminBebeEmployees] Error loading employees:', error);
				throw new Error(error.message || 'Impossible de charger les employés');
			}

			setItems(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Erreur de chargement');
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
			const { error } = await supabase
				.from('bebe_employees')
				.update({
					is_active: !!next,
					status: next ? 'approved' : 'pending',
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error toggling active:', error);
				alert(error.message || 'Erreur lors de la mise à jour du statut');
				return;
			}

			setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !!next, status: next ? 'approved' : 'pending' } : i));
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception toggling active:', e);
			alert(e.message || 'Erreur lors de la mise à jour du statut');
		}
	};

	const remove = async (id) => {
		if (!window.confirm('Supprimer cet employé ?')) return;
		try {
			const { error } = await supabase
				.from('bebe_employees')
				.delete()
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error removing employee:', error);
				alert(error.message || 'Erreur lors de la suppression');
				return;
			}

			setItems(prev => prev.filter(i => i.id !== id));
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception removing employee:', e);
			alert(e.message || 'Erreur lors de la suppression');
		}
	};

	const validateEmployee = async (id) => {
		try {
			// On considère qu'un employé validé est un employé avec status='approved' et is_active=true
			const { error } = await supabase
				.from('bebe_employees')
				.update({
					status: 'approved',
					is_active: true,
					updated_at: new Date().toISOString()
				})
				.eq('id', id);

			if (error) {
				console.error('[AdminBebeEmployees] Error validating employee:', error);
				alert(error.message || 'Validation échouée');
				return;
			}

			// Retirer de la liste "en attente" (comme avant)
			setItems(prev => prev.filter(i => i.id !== id));
			alert('Employé validé ✅');
		} catch (e) {
			console.error('[AdminBebeEmployees] Exception validating employee:', e);
			alert(e.message || 'Validation échouée');
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
								<th>Quartier</th>
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
									<td>{emp.city || (emp.address ? String(emp.address).split(' - ')[0] : '') || '-'}</td>
									<td>{emp.quartier || (emp.address && String(emp.address).includes(' - ') ? String(emp.address).split(' - ')[1] : '') || '-'}</td>
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


