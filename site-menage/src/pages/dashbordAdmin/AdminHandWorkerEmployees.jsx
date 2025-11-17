import React, { useEffect, useMemo, useState } from 'react';
import './AdminHandWorkerEmployees.css';
import { supabase } from '../../lib/supabase';

export default function AdminHandWorkerEmployees({ token, onAuthError }) {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('all');


	const load = async () => {
		try {
			setLoading(true);
			setError('');
			
			console.log('[AdminHandWorkerEmployees] Loading registrations from Supabase');
			
			// Load hand_workers with category join
			const { data, error } = await supabase
				.from('hand_workers')
				.select(`
					*,
					hand_worker_categories:category_id (
						id,
						name,
						name_ar,
						name_fr,
						name_en
					)
				`)
				.order('created_at', { ascending: false });
			
			if (error) {
				console.error('[AdminHandWorkerEmployees] Error loading registrations:', error);
				setError('Erreur lors du chargement: ' + error.message);
				return;
			}
			
			// Transform data to match expected format
			const transformedData = (data || []).map(item => ({
				id: item.id,
				full_name: `${item.first_name || ''} ${item.last_name || ''}`.trim() || '-',
				email: item.email || '-',
				phone: item.phone || '-',
				category: item.hand_worker_categories ? {
					name: item.hand_worker_categories.name || 
					       item.hand_worker_categories.name_fr || 
					       item.hand_worker_categories.name_ar || 
					       item.hand_worker_categories.name_en || '-'
				} : null,
				city: item.city || '-',
				experience_years: item.experience_years || 0,
				status: item.status === 'available' ? 'approved' : (item.status || 'pending')
			}));
			
			console.log('[AdminHandWorkerEmployees] Loaded registrations:', transformedData.length);
			setItems(transformedData);
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception loading registrations:', e);
			setError('Erreur de connexion: ' + e.message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { load(); }, []);

	const filtered = useMemo(() => {
		if (filter === 'all') return items;
		if (filter === 'pending') return items.filter(i => i.status === 'pending');
		if (filter === 'approved') return items.filter(i => i.status === 'approved');
		if (filter === 'rejected') return items.filter(i => i.status === 'rejected');
		return items;
	}, [items, filter]);

	const approveRegistration = async (id) => {
		try {
			console.log('[AdminHandWorkerEmployees] Approving registration:', id);
			
			const { error } = await supabase
				.from('hand_workers')
				.update({ status: 'approved' })
				.eq('id', id);
			
			if (error) {
				console.error('[AdminHandWorkerEmployees] Error approving registration:', error);
				alert('Erreur lors de l\'approbation: ' + error.message);
				return;
			}
			
			// Update local state
			setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
			alert('Inscription approuvée ✅');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception approving registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	const rejectRegistration = async (id) => {
		if (!window.confirm('Rejeter cette inscription ?')) return;
		try {
			console.log('[AdminHandWorkerEmployees] Rejecting registration:', id);
			
			const { error } = await supabase
				.from('hand_workers')
				.update({ status: 'rejected' })
				.eq('id', id);
			
			if (error) {
				console.error('[AdminHandWorkerEmployees] Error rejecting registration:', error);
				alert('Erreur lors du rejet: ' + error.message);
				return;
			}
			
			// Update local state
			setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
			alert('Inscription rejetée');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception rejecting registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	const remove = async (id) => {
		if (!window.confirm('Supprimer cette inscription ?')) return;
		try {
			console.log('[AdminHandWorkerEmployees] Deleting registration:', id);
			
			const { error } = await supabase
				.from('hand_workers')
				.delete()
				.eq('id', id);
			
			if (error) {
				console.error('[AdminHandWorkerEmployees] Error deleting registration:', error);
				alert('Erreur lors de la suppression: ' + error.message);
				return;
			}
			
			// Update local state
			setItems(prev => prev.filter(i => i.id !== id));
			alert('Inscription supprimée');
		} catch (e) {
			console.error('[AdminHandWorkerEmployees] Exception deleting registration:', e);
			alert('Erreur: ' + e.message);
		}
	};

	return (
		<main className="admin-page handworker-employees-page">
			<div className="handworker-employees-header">
				<h1>Employés Travaux Manuels</h1>
				<div className="handworker-employees-actions">
					<select 
						className="handworker-employees-filter"
						value={filter} 
						onChange={e=>setFilter(e.target.value)}
					>
						<option value="all">Tous</option>
						<option value="pending">En attente</option>
						<option value="approved">Approuvés</option>
						<option value="rejected">Rejetés</option>
					</select>
					<button className="handworker-employees-refresh-btn" onClick={load}>🔄 Rafraîchir</button>
				</div>
			</div>

			{error && (
				<div className="handworker-employees-alert error">
					<span>⚠️</span>
					<span>{error}</span>
				</div>
			)}
			{loading ? (
				<div className="handworker-employees-loading">Chargement…</div>
			) : (
				<div className="handworker-employees-table-wrapper">
					<table className="handworker-employees-table">
						<thead>
							<tr>
								<th>ID</th>
								<th>Nom</th>
								<th>Email</th>
								<th>Téléphone</th>
								<th>Catégorie</th>
								<th>Ville</th>
								<th>Expérience</th>
								<th>Statut</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map(emp => (
								<tr key={emp.id}>
									<td>#{emp.id}</td>
									<td>{emp.full_name || '-'}</td>
									<td>
										<a href={`mailto:${emp.email}`} className="handworker-employees-email">{emp.email || '-'}</a>
									</td>
									<td>{emp.phone || '-'}</td>
									<td>{emp.category?.name || '-'}</td>
									<td>{emp.city || '-'}</td>
									<td>{emp.experience_years || 0} ans</td>
									<td>
										<span className={`handworker-employees-status ${emp.status || 'pending'}`}>
											{emp.status === 'pending' ? '⏳ En attente' : 
											 emp.status === 'approved' ? '✓ Approuvé' : 
											 emp.status === 'rejected' ? '✗ Rejeté' : 'Inconnu'}
										</span>
									</td>
									<td>
										<div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
											{emp.status === 'pending' && (
												<button className="handworker-employees-approve-btn" onClick={()=>approveRegistration(emp.id)}>✅ Valider</button>
											)}
											{emp.status === 'pending' && (
												<button className="handworker-employees-reject-btn" onClick={()=>rejectRegistration(emp.id)}>❌ Rejeter</button>
											)}
											<button className="handworker-employees-delete-btn" onClick={()=>remove(emp.id)}>🗑️ Supprimer</button>
										</div>
									</td>
								</tr>
							))}
							{filtered.length === 0 && (
								<tr>
									<td colSpan={9} className="handworker-employees-empty">Aucune inscription trouvée</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}
		</main>
	);
}

